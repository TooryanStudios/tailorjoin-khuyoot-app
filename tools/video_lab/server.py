import os
import shutil
import tempfile
import traceback
from typing import Literal, Optional

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

# Pillow 10 removed Image.ANTIALIAS; MoviePy 1.0.3 still expects it.
try:
    from PIL import Image  # type: ignore

    if not hasattr(Image, "ANTIALIAS") and hasattr(Image, "Resampling"):
        Image.ANTIALIAS = Image.Resampling.LANCZOS  # type: ignore[attr-defined]
except Exception:
    # If Pillow isn't available or changes again, fail later with a clear stack trace.
    pass

from moviepy.editor import ColorClip, CompositeVideoClip, ImageClip, VideoClip, concatenate_videoclips

app = FastAPI(title="Khuyoot Video Lab", version="0.1")

Transition = Literal[
    "cut",
    "crossfade",
    "fade",
    "slide-left",
    "slide-right",
    "zoom",
    "tryon-slider",
]


def _resolve_font_path() -> Optional[str]:
    # Allow explicit override.
    env = os.environ.get("VIDEO_LAB_FONT_PATH")
    if env and os.path.isfile(env):
        return env

    # Windows common fonts.
    candidates = [
        r"C:\\Windows\\Fonts\\segoeui.ttf",
        r"C:\\Windows\\Fonts\\arial.ttf",
        r"C:\\Windows\\Fonts\\tahoma.ttf",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def _make_label_image(text: str, *, font_size: int = 28):
    # Render a label into a small RGBA image (no ImageMagick dependency).
    from PIL import Image, ImageDraw, ImageFont  # type: ignore

    t = (text or "").strip()
    if not t:
        t = " "

    font_path = _resolve_font_path()
    try:
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # Measure text.
    tmp = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), t, font=font)
    text_w = max(1, bbox[2] - bbox[0])
    text_h = max(1, bbox[3] - bbox[1])

    pad_x, pad_y = 14, 8
    w = text_w + pad_x * 2
    h = text_h + pad_y * 2

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Simple rounded rect background.
    try:
        d.rounded_rectangle((0, 0, w - 1, h - 1), radius=12, fill=(0, 0, 0, 160), outline=(255, 255, 255, 40))
    except Exception:
        d.rectangle((0, 0, w - 1, h - 1), fill=(0, 0, 0, 160), outline=(255, 255, 255, 40))

    d.text((pad_x, pad_y), t, font=font, fill=(255, 255, 255, 235))
    return img


def _make_slider_handle_image(*, diameter: int):
    # Simple circular slider thumb with chevrons, rendered via Pillow.
    from PIL import Image, ImageDraw  # type: ignore

    d = max(18, int(diameter))
    img = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Shadow
    draw.ellipse((2, 3, d - 2, d - 1), fill=(0, 0, 0, 90))
    # Thumb
    draw.ellipse((1, 1, d - 3, d - 3), fill=(0, 0, 0, 150), outline=(255, 255, 255, 200), width=2)

    # Chevrons
    cx = d // 2
    cy = d // 2
    s = max(4, d // 7)
    # Left chevron
    draw.line((cx - s, cy, cx - 1, cy - s), fill=(255, 255, 255, 220), width=2)
    draw.line((cx - s, cy, cx - 1, cy + s), fill=(255, 255, 255, 220), width=2)
    # Right chevron
    draw.line((cx + s, cy, cx + 1, cy - s), fill=(255, 255, 255, 220), width=2)
    draw.line((cx + s, cy, cx + 1, cy + s), fill=(255, 255, 255, 220), width=2)

    return img


def _slider_x_norm(local_t: float, slide_seconds: float, wait_seconds: float, loops: int) -> float:
    """Divider x in normalized [0..1] (1=right edge, 0=left edge).

    Desired UX:
    - Start at right edge.
    - Slide to left, wait.
    - Slide back to right, wait.
    - Repeat.
    - End on left edge after the final slide.

    Interpretation: loops=N means the slider reaches the left edge N times.
    """

    slide_seconds = float(slide_seconds)
    if slide_seconds <= 0:
        slide_seconds = 1e-6

    wait_seconds = float(wait_seconds)
    if wait_seconds < 0:
        wait_seconds = 0.0

    loops = int(max(1, loops))
    t = float(max(0.0, local_t))

    def ease(p: float) -> float:
        # smoothstep
        p = 0.0 if p < 0.0 else 1.0 if p > 1.0 else p
        return p * p * (3.0 - 2.0 * p)

    # For i in 0..loops-1:
    # forward (right->left)
    # if not last: wait at left, backward (left->right), wait at right
    for i in range(loops):
        # Forward: right -> left
        if t < slide_seconds:
            p = ease(t / slide_seconds)
            return 1.0 + (0.0 - 1.0) * p
        t -= slide_seconds

        if i == loops - 1:
            return 0.0

        # Wait at left edge
        if t < wait_seconds:
            return 0.0
        t -= wait_seconds

        # Backward: left -> right
        if t < slide_seconds:
            p = ease(t / slide_seconds)
            return 0.0 + (1.0 - 0.0) * p
        t -= slide_seconds

        # Wait at right edge
        if t < wait_seconds:
            return 1.0
        t -= wait_seconds

    return 0.0


def _mask_reveal_right(
    width: int,
    height: int,
    t: float,
    slide_seconds: float,
    wait_seconds: float,
    loops: int,
):
    # Returns a 2D float mask (0..1) that reveals pixels to the right of a moving divider.
    x_norm = _slider_x_norm(float(t), float(slide_seconds), float(wait_seconds), int(loops))
    divider_x = int(round(width * x_norm))

    mask = np.zeros((height, width), dtype=np.float32)
    mask[:, max(0, min(width, divider_x)) :] = 1.0
    return mask


def _build_video(
    image_a_path: str,
    image_b_path: str,
    transition: Transition,
    seconds_per_image: float,
    transition_seconds: float,
    fps: int,
    width: int,
    height: int,
    out_path: str,
    slider_loops: int = 1,
    slider_wait_seconds: float = 0.2,
    before_label: Optional[str] = None,
    after_label: Optional[str] = None,
) -> None:
    clip_a = ImageClip(image_a_path).set_duration(seconds_per_image)
    clip_b = ImageClip(image_b_path).set_duration(seconds_per_image)

    # Fit into a fixed frame to keep output dimensions stable.
    def fit(clip: ImageClip) -> ImageClip:
        fitted = clip.resize(height=height)
        # Center on a black canvas
        return fitted.on_color(size=(width, height), color=(0, 0, 0), pos=("center", "center"))

    clip_a = fit(clip_a)
    clip_b = fit(clip_b)

    if transition_seconds < 0:
        transition_seconds = 0

    if transition == "cut" or transition_seconds == 0:
        final = concatenate_videoclips([clip_a, clip_b], method="compose")
    else:
        t = min(transition_seconds, seconds_per_image)
        if transition == "crossfade":
            clip_b = clip_b.crossfadein(t)
            final = concatenate_videoclips([clip_a, clip_b], method="compose", padding=-t)
        elif transition == "fade":
            clip_a = clip_a.fadeout(t)
            clip_b = clip_b.fadein(t)
            final = concatenate_videoclips([clip_a, clip_b], method="compose", padding=-t)
        elif transition in ("slide-left", "slide-right"):
            # Slide transition: overlap clips for `t` seconds.
            w, h = width, height
            direction = -1 if transition == "slide-left" else 1
            start_b = max(0.0, float(seconds_per_image) - t)

            a = clip_a.set_start(0)
            b = clip_b.set_start(start_b)

            def pos_a(tt: float):
                # During overlap, move A out.
                if tt < start_b:
                    return (0, 0)
                p = min(1.0, max(0.0, (tt - start_b) / t))
                return (-direction * p * w, 0)

            def pos_b(tt: float):
                # During overlap, move B in.
                if tt < start_b:
                    return (direction * w, 0)
                p = min(1.0, max(0.0, (tt - start_b) / t))
                return (direction * (1.0 - p) * w, 0)

            a = a.set_position(pos_a)
            b = b.set_position(pos_b)

            total = float(seconds_per_image) * 2.0 - t
            final = CompositeVideoClip([a, b], size=(w, h)).set_duration(total)
        elif transition == "zoom":
            # Zoom + crossfade: clip B starts slightly zoomed-in then settles during overlap.
            start_b = max(0.0, float(seconds_per_image) - t)
            b = clip_b.set_start(start_b)

            zoom_from = 1.10
            zoom_to = 1.00

            def zoom_factor(tt: float):
                if tt < start_b:
                    return zoom_from
                p = min(1.0, max(0.0, (tt - start_b) / t))
                return zoom_from + (zoom_to - zoom_from) * p

            b = b.resize(lambda tt: zoom_factor(tt)).set_position(("center", "center"))
            b = b.crossfadein(t)
            final = concatenate_videoclips([clip_a, b], method="compose", padding=-t)
        elif transition == "tryon-slider":
            w, h = width, height
            # Try-on slider is its own animation (no need for secondsPerImage).
            # We interpret transition_seconds as the slide duration (per slide).
            start_b = 0.0

            # Slider semantics:
            # loops=N => reach the left edge N times, returning to right between loops.
            loops = int(max(1, slider_loops))
            wait_s = float(max(0.0, slider_wait_seconds))
            slide_s = float(transition_seconds)
            if slide_s <= 0:
                slide_s = 0.01

            # Total slider animation duration:
            # forward slides: N
            # backward slides: N-1
            # waits: 2*(N-1) (left+right between cycles)
            slider_duration = slide_s * float(2 * loops - 1) + wait_s * float(2 * loops - 2)

            # MoviePy renders frames at t=(n-1)/fps, so the exact last instant (t=duration)
            # is not guaranteed to be included. Add a 1-frame epsilon so the final frame
            # shows the slider fully reaching the end.
            epsilon = 1.0 / float(max(1, fps))
            total = slider_duration + epsilon

            # Keep A visible throughout so the slider always compares before/after.
            a = clip_a.set_start(0).set_duration(total)

            # Reveal B to the right of a divider that moves like a draggable slider.
            # The mask runs for the full hold duration; after the slide completes,
            # _slider_x_norm returns 0 so the mask becomes fully revealed.
            mask = (
                VideoClip(
                    make_frame=lambda tt: _mask_reveal_right(
                        w,
                        h,
                        float(tt),
                        float(slide_s),
                        float(wait_s),
                        int(loops),
                    ),
                    ismask=True,
                )
                .set_start(start_b)
                .set_duration(total)
            )

            b = clip_b.set_start(start_b).set_duration(total).set_mask(mask)

            # Divider line during the slider animation.
            divider_w = max(3, int(round(w * 0.006)))
            divider = (
                ColorClip(size=(divider_w, h), color=(255, 255, 255))
                .set_opacity(0.9)
                .set_start(start_b)
                .set_duration(total)
            )

            def divider_pos(tt: float):
                local = float(tt)
                x_norm = _slider_x_norm(local, float(slide_s), float(wait_s), int(loops))
                x = int(round(w * x_norm)) - divider_w // 2
                return (x, 0)

            divider = divider.set_position(divider_pos)

            # Slider handle (thumb) during the overlap.
            handle_d = max(22, int(round(min(w, h) * 0.07)))
            handle_img = _make_slider_handle_image(diameter=handle_d)
            handle = (
                ImageClip(np.array(handle_img))
                .set_start(start_b)
                .set_duration(total)
            )

            def handle_pos(tt: float):
                local = float(tt)
                x_norm = _slider_x_norm(local, float(slide_s), float(wait_s), int(loops))
                x = int(round(w * x_norm)) - handle_d // 2
                y = int(round(h * 0.5)) - handle_d // 2
                return (x, y)

            handle = handle.set_position(handle_pos)

            overlays = [a, b, divider, handle]

            # Labels for the full slider duration.
            try:
                label_before = (before_label or "قبل").strip()
                label_after = (after_label or "بعد").strip()
                label_a_img = _make_label_image(label_before, font_size=max(18, int(h * 0.03)))
                label_b_img = _make_label_image(label_after, font_size=max(18, int(h * 0.03)))

                la = (
                    ImageClip(np.array(label_a_img))
                    .set_start(start_b)
                    .set_duration(total)
                    .set_position((14, 14))
                )
                lb = (
                    ImageClip(np.array(label_b_img))
                    .set_start(start_b)
                    .set_duration(total)
                    .set_position((w - int(label_b_img.size[0]) - 14, 14))
                )
                overlays.extend([la, lb])
            except Exception:
                pass

            final = CompositeVideoClip(overlays, size=(w, h)).set_duration(total)
        else:
            final = concatenate_videoclips([clip_a, clip_b], method="compose")

    # H.264 MP4
    final.write_videofile(
        out_path,
        fps=fps,
        codec="libx264",
        audio=False,
        preset="medium",
        threads=max(1, os.cpu_count() or 1),
        logger=None,
    )


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
async def generate(
    imageA: UploadFile = File(...),
    imageB: UploadFile = File(...),
    transition: Transition = Form("crossfade"),
    secondsPerImage: float = Form(2.0),
    transitionSeconds: float = Form(0.5),
    fps: int = Form(24),
    width: int = Form(720),
    height: int = Form(960),
    sliderLoops: int = Form(1),
    sliderWaitSeconds: float = Form(0.2),
    beforeLabel: Optional[str] = Form(None),
    afterLabel: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
):
    try:
        if transition != "tryon-slider" and secondsPerImage <= 0:
            return JSONResponse({"error": "secondsPerImage must be > 0"}, status_code=400)
        if fps <= 0 or fps > 60:
            return JSONResponse({"error": "fps must be between 1 and 60"}, status_code=400)
        if width < 64 or height < 64:
            return JSONResponse({"error": "width/height too small"}, status_code=400)
        sliderLoops = int(max(1, min(12, sliderLoops)))
        sliderWaitSeconds = float(max(0.0, min(2.0, float(sliderWaitSeconds))))

        tmp = tempfile.mkdtemp(prefix="khuyoot_video_lab_")
        try:
            a_path = os.path.join(tmp, "a" + os.path.splitext(imageA.filename or "a.jpg")[1])
            b_path = os.path.join(tmp, "b" + os.path.splitext(imageB.filename or "b.jpg")[1])
            out_path = os.path.join(tmp, "out.mp4")

            with open(a_path, "wb") as f:
                f.write(await imageA.read())
            with open(b_path, "wb") as f:
                f.write(await imageB.read())

            _build_video(
                image_a_path=a_path,
                image_b_path=b_path,
                transition=transition,
                seconds_per_image=float(secondsPerImage),
                transition_seconds=float(transitionSeconds),
                fps=int(fps),
                width=int(width),
                height=int(height),
                out_path=out_path,
                slider_loops=int(sliderLoops),
                slider_wait_seconds=float(sliderWaitSeconds),
                before_label=beforeLabel,
                after_label=afterLabel,
            )

            download_name = (filename or "video") + ".mp4"
            return FileResponse(
                out_path,
                media_type="video/mp4",
                filename=download_name,
                background=BackgroundTask(shutil.rmtree, tmp, ignore_errors=True),
            )
        except Exception:
            shutil.rmtree(tmp, ignore_errors=True)
            raise
    except Exception as e:
        print("[VideoLab] Generation failed:")
        print(traceback.format_exc())
        return JSONResponse({"error": str(e), "trace": traceback.format_exc()}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("VIDEO_LAB_PORT", "8790"))
    uvicorn.run(app, host="127.0.0.1", port=port)

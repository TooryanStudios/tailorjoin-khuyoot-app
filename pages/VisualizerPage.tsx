import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { firebaseService } from '../services/firebase';
import { Mannequin } from '../src/components/Mannequin';
import { apiFetch } from '../src/api/apiFetch';
import { ApiError, ApiUnauthorizedError, AuthRequiredError } from '../src/api/httpErrors';
import { requestLoginPrompt } from '../src/auth/authEvents';
import { useAuth } from '../src/auth/useAuth';

const DEFAULT_PROMPT = 'A photorealistic studio fashion shoot with a neutral background, realistic fabric drape, and soft cinematic lighting.';

const PROMPT_PRESETS = [
  { id: 'studio', label: 'Studio', text: 'Studio lighting, neutral background, clean editorial style, fabric details sharp.' },
  { id: 'runway', label: 'Runway', text: 'Runway catwalk scene, dramatic lighting, high-fashion styling.' },
  { id: 'outdoor', label: 'Outdoor', text: 'Outdoor natural light, soft shadows, realistic environment.' },
  { id: 'editorial', label: 'Editorial', text: 'Editorial fashion photography, cinematic lighting, shallow depth of field.' },
];

const STYLE_CHIPS = [
  'Silk texture',
  'Linen drape',
  'Gold embroidery',
  'Minimalist palette',
  'Warm lighting',
  'Cool studio',
  'High contrast',
  'Soft shadows',
];

const STYLE_PRESETS = [
  {
    id: 'realistic-studio',
    label: 'Realistic Studio',
    prompt: 'Keep the output photorealistic, studio-lit, and physically accurate materials.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="180" height="120" fill="%23111"/><text x="50%" y="52%" text-anchor="middle" fill="%23e5e7eb" font-family="Arial" font-size="12">Realistic Studio</text></svg>',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    prompt: 'Cinematic lighting, shallow depth of field, and filmic color grading.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="180" height="120" fill="%231f2937"/><text x="50%" y="52%" text-anchor="middle" fill="%23f9fafb" font-family="Arial" font-size="12">Cinematic</text></svg>',
  },
  {
    id: 'tech-flat',
    label: 'Tech Flat',
    prompt: 'Clean tech aesthetic, soft shadows, minimal reflections, consistent identity.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="180" height="120" fill="%232563eb"/><text x="50%" y="52%" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Tech Flat</text></svg>',
  },
  {
    id: 'stylized',
    label: 'Stylized',
    prompt: 'Stylized 3D look, consistent character identity, smooth gradients.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="180" height="120" fill="%237c3aed"/><text x="50%" y="52%" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Stylized</text></svg>',
  },
];

const ASPECT_OPTIONS = [
  { id: 'widescreen', label: '16:9', ratio: 16 / 9, hint: 'Video' },
  { id: 'square', label: '1:1', ratio: 1, hint: 'Square' },
  { id: 'classic', label: '4:3', ratio: 4 / 3, hint: 'Classic' },
  { id: 'portrait', label: '9:16', ratio: 9 / 16, hint: 'Portrait' },
  { id: 'print-a4', label: 'A4', ratio: 210 / 297, hint: 'Print' },
  { id: 'print-4x6', label: '4x6', ratio: 4 / 6, hint: 'Print' },
  { id: 'ultra', label: '6016×9', ratio: 6016 / 9, hint: 'Wide' },
] as const;

const MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
  { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (Preview)' },
];

const SCENE_MODELS = [
  {
    id: 'robot-expressive',
    label: 'Robot Expressive (Free)',
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    scale: 1,
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    id: 'cesium-man',
    label: 'Cesium Man (CC0)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    scale: 1,
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    id: 'damaged-helmet',
    label: 'Damaged Helmet (CC0)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    scale: 1.6,
    position: [0, 1.4, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    id: 'boombox',
    label: 'BoomBox (CC0)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    scale: 2,
    position: [0, 1.2, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    id: 'duck',
    label: 'Duck (CC0)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
    scale: 2.2,
    position: [0, 1.1, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
];

const HISTORY_KEY = 'khuyoot_visualizer_history_v1';

type HistoryItem = {
  id: string;
  dataUrl: string;
  prompt: string;
  createdAt: number;
  aspectLabel: string;
};

type CameraRigProps = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

function CameraRig({ position, target, fov }: CameraRigProps) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(target[0], target[1], target[2]);
  }, [camera, position, target, fov]);
  return null;
}

type SceneContentProps = {
  showGrid: boolean;
  showBackdrop: boolean;
  showFabricPlane: boolean;
  fabricPosition: [number, number, number];
  fabricScale: [number, number];
  fabricRotation: number;
  primaryModelId: string;
  propModels: Array<{ id: string; modelId: string }>;
};

type SceneModelProps = {
  url: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

function SceneModel({ url, scale, position, rotation }: SceneModelProps) {
  const { scene } = useGLTF(url);
  return (
    <primitive object={scene} scale={scale} position={position} rotation={rotation} />
  );
}

function SceneContent({
  showGrid,
  showBackdrop,
  showFabricPlane,
  fabricPosition,
  fabricScale,
  fabricRotation,
  primaryModelId,
  propModels,
}: SceneContentProps) {
  const primary = SCENE_MODELS.find((model) => model.id === primaryModelId) || SCENE_MODELS[0];
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight intensity={0.6} color="#f5f5f5" groundColor="#2a2a2a" />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 5, -10]} intensity={0.5} />
      {primary ? (
        <SceneModel
          url={primary.url}
          scale={primary.scale}
          position={primary.position}
          rotation={primary.rotation}
        />
      ) : (
        <Mannequin />
      )}
      {propModels.map((item) => {
        const model = SCENE_MODELS.find((option) => option.id === item.modelId);
        if (!model) return null;
        return (
          <SceneModel
            key={item.id}
            url={model.url}
            scale={model.scale * 0.8}
            position={[model.position[0] + 1.2, model.position[1], model.position[2]]}
            rotation={model.rotation}
          />
        );
      })}
      {showBackdrop && (
        <mesh position={[0, 2.2, -2.5]}>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}
      {showFabricPlane && (
        <mesh position={fabricPosition} rotation={[0, fabricRotation, 0]}>
          <planeGeometry args={fabricScale} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      )}
      {showGrid && <Grid infiniteGrid fadeDistance={30} sectionColor="#4f4f4f" cellColor="#333" />}
    </>
  );
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

const VisualizerPage = () => {
  const { status: authStatus } = useAuth();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aspectId, setAspectId] = useState<(typeof ASPECT_OPTIONS)[number]['id']>('widescreen');
  const [modelId, setModelId] = useState<string>(MODEL_OPTIONS[0].id);
  const [primaryModelId, setPrimaryModelId] = useState<string>(SCENE_MODELS[0].id);
  const [propModels, setPropModels] = useState<Array<{ id: string; modelId: string }>>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>(SCENE_MODELS[0].id);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLE_PRESETS[0].id);
  const [cameraPresets, setCameraPresets] = useState<Array<{
    id: string;
    name: string;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    cameraFov: number;
    thumbnailDataUrl?: string | null;
  }>>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [includeGridInCapture, setIncludeGridInCapture] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [showFabricPlane, setShowFabricPlane] = useState(true);
  const [fabricPosition, setFabricPosition] = useState<[number, number, number]>([0, 1.6, 0]);
  const [fabricScale, setFabricScale] = useState<[number, number]>([1.6, 2.2]);
  const [fabricRotation, setFabricRotation] = useState(0);
  const [cameraFov, setCameraFov] = useState(45);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 2, 5]);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 2, 0]);
  const [dofEnabled, setDofEnabled] = useState(false);
  const [dofFocusDistance, setDofFocusDistance] = useState(5);
  const [dofAperture, setDofAperture] = useState(2.8);
  const [dofFocalLength, setDofFocalLength] = useState(50);
  const [controlsKey, setControlsKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const activeAspect = useMemo(
    () => ASPECT_OPTIONS.find((option) => option.id === aspectId) || ASPECT_OPTIONS[0],
    [aspectId]
  );

  const cameraInfo = useMemo(() => {
    const [cx, cy, cz] = cameraPosition;
    const [tx, ty, tz] = cameraTarget;
    const dx = cx - tx;
    const dy = cy - ty;
    const dz = cz - tz;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const yaw = Math.atan2(dx, dz) * (180 / Math.PI);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
    return { yaw, pitch, distance };
  }, [cameraPosition, cameraTarget]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    firebaseService.getVisualizerCameraPresets()
      .then(setCameraPresets)
      .catch((e) => console.warn('Failed to load camera presets', e));
    firebaseService.getVisualizerGenerations(20)
      .then((items) => {
        if (!items.length) return;
        setHistory((prev) => {
          const merged = [...items.map((item) => ({
            id: item.id,
            dataUrl: item.imageUrl,
            prompt: item.promptText || 'Saved generation',
            createdAt: item.createdAt,
            aspectLabel: item.aspectLabel || 'Saved',
          })), ...prev];
          const seen = new Set<string>();
          return merged.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }).slice(0, 20);
        });
      })
      .catch((e) => console.warn('Failed to load generations', e));
  }, [authStatus]);

  const handleCapture = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMessage('Canvas not found.');
      return null;
    }
    const shouldHideGrid = showGrid && !includeGridInCapture;
    if (shouldHideGrid) {
      setShowGrid(false);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    const dataUrl = canvas.toDataURL('image/png');
    if (shouldHideGrid) {
      setShowGrid(true);
    }
    setCapturePreview(dataUrl);
    return dataUrl;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const dataUrl = await handleCapture();
      if (!dataUrl) return;
      const base64Image = dataUrl.split(',')[1];

      const effectivePrompt = prompt.trim() || DEFAULT_PROMPT;
      if (effectivePrompt.trim().length < 10) {
        setErrorMessage('Please add more detail to the prompt.');
        return;
      }

      const stylePreset = STYLE_PRESETS.find((style) => style.id === selectedStyleId);
      const dofText = dofEnabled
        ? `Depth of field enabled. Focus distance ${dofFocusDistance.toFixed(1)}m, aperture f/${dofAperture.toFixed(1)}, focal length ${dofFocalLength}mm.`
        : 'Depth of field disabled.';
      const systemPrompt = `You are a professional fashion photographer. Use the provided 3D screenshot as a strict spatial reference for composition and perspective. Generate a photorealistic image that transforms the 3D shapes into high-quality fabric and human models based on this prompt: ${effectivePrompt}. ${stylePreset ? stylePreset.prompt : ''} Camera details: position [${cameraPosition.map((v) => v.toFixed(2)).join(', ')}], target [${cameraTarget.map((v) => v.toFixed(2)).join(', ')}], FOV ${cameraFov}°, yaw ${cameraInfo.yaw.toFixed(1)}°, pitch ${cameraInfo.pitch.toFixed(1)}°, distance ${cameraInfo.distance.toFixed(2)}. ${dofText} Match the camera lens and angle perfectly.`;

      const res = await apiFetch('/api/visualizer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        requireAuth: true,
        body: JSON.stringify({
          imageBase64: base64Image,
          imageMimeType: 'image/png',
          promptText: systemPrompt,
          model: modelId,
          aspectLabel: activeAspect.label,
          cameraInfo,
          dofEnabled,
          dofFocusDistance,
          dofAperture,
          dofFocalLength,
        }),
      });

      const data = await res.json();
      if (data?.imageBase64) {
        const mimeType = data?.mimeType || 'image/png';
        const outDataUrl = data?.storedImageUrl
          ? String(data.storedImageUrl)
          : `data:${mimeType};base64,${data.imageBase64}`;
        setGeneratedImage(outDataUrl);
        setHistory((prev) => [
          {
            id: `${Date.now()}`,
            dataUrl: outDataUrl,
            prompt: effectivePrompt,
            createdAt: Date.now(),
            aspectLabel: activeAspect.label,
          },
          ...prev,
        ]);
      } else {
        setErrorMessage('No image returned from Gemini.');
      }
    } catch (error) {
      if (error instanceof AuthRequiredError || error instanceof ApiUnauthorizedError) {
        setErrorMessage('Please sign in to generate and save images.');
        requestLoginPrompt('generation');
        return;
      }
      if (error instanceof ApiError) {
        setErrorMessage(error.message || 'Generation failed.');
        return;
      }
      console.error('Generation failed', error);
      setErrorMessage('Generation failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCamera = () => {
    setCameraPosition([0, 2, 5]);
    setCameraTarget([0, 2, 0]);
    setCameraFov(45);
    setControlsKey((v) => v + 1);
  };

  const handlePreset = (text: string) => {
    setPrompt(text);
  };

  const handleStyleChip = (text: string) => {
    setPrompt((prev) => `${prev.trim()} ${text}`.trim());
  };

  const getNextPresetName = () => {
    const base = 'Camera';
    const used = cameraPresets
      .map((p) => p.name)
      .filter((name) => name.startsWith(base))
      .map((name) => Number(name.replace(base, '').trim()))
      .filter((n) => Number.isFinite(n));
    const next = used.length ? Math.max(...used) + 1 : cameraPresets.length + 1;
    return `${base} ${next}`;
  };

  const capturePresetThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const thumb = document.createElement('canvas');
    const targetWidth = 220;
    const targetHeight = Math.round(targetWidth / activeAspect.ratio);
    thumb.width = targetWidth;
    thumb.height = targetHeight;
    const ctx = thumb.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return thumb.toDataURL('image/jpeg', 0.7);
  };

  const handleSavePreset = async () => {
    try {
      if (isSavingPreset) return;
      const name = getNextPresetName();
      const thumbnailDataUrl = capturePresetThumbnail();
      const tempId = `temp-${Date.now()}`;
      setIsSavingPreset(true);
      setCameraPresets((prev) => [
        {
          id: tempId,
          name,
          cameraPosition,
          cameraTarget,
          cameraFov,
          thumbnailDataUrl: thumbnailDataUrl || null,
        },
        ...prev,
      ]);
      const controls = controlsRef.current;
      const currentPosition = controls?.object?.position
        ? [controls.object.position.x, controls.object.position.y, controls.object.position.z] as [number, number, number]
        : cameraPosition;
      const currentTarget = controls?.target
        ? [controls.target.x, controls.target.y, controls.target.z] as [number, number, number]
        : cameraTarget;
      await firebaseService.saveVisualizerCameraPreset({
        name,
        cameraPosition: currentPosition,
        cameraTarget: currentTarget,
        cameraFov,
        cameraInfo,
        dofEnabled,
        dofFocusDistance,
        dofAperture,
        dofFocalLength,
        thumbnailDataUrl,
      });
      const list = await firebaseService.getVisualizerCameraPresets();
      setCameraPresets(list);
      setIsSavingPreset(false);
    } catch (e: any) {
      setIsSavingPreset(false);
      setErrorMessage(e?.message || 'Failed to save preset.');
    }
  };

  const handleApplyPreset = (preset: { cameraPosition: [number, number, number]; cameraTarget: [number, number, number]; cameraFov: number; dofEnabled?: boolean; dofFocusDistance?: number; dofAperture?: number; dofFocalLength?: number }) => {
    const safePos = Array.isArray(preset.cameraPosition) && preset.cameraPosition.length >= 3
      ? preset.cameraPosition
      : [0, 2, 5];
    const safeTarget = Array.isArray(preset.cameraTarget) && preset.cameraTarget.length >= 3
      ? preset.cameraTarget
      : [0, 2, 0];
    setCameraPosition([Number(safePos[0]), Number(safePos[1]), Number(safePos[2])]);
    setCameraTarget([Number(safeTarget[0]), Number(safeTarget[1]), Number(safeTarget[2])]);
    setCameraFov(Number.isFinite(preset.cameraFov) ? preset.cameraFov : 45);
    setDofEnabled(!!preset.dofEnabled);
    if (typeof preset.dofFocusDistance === 'number') setDofFocusDistance(preset.dofFocusDistance);
    if (typeof preset.dofAperture === 'number') setDofAperture(preset.dofAperture);
    if (typeof preset.dofFocalLength === 'number') setDofFocalLength(preset.dofFocalLength);
    setControlsKey((v) => v + 1);
  };

  const handleDeletePreset = async (id: string) => {
    try {
      setDeletingPresetId(id);

      try {
        await apiFetch('/api/visualizer/presets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          requireAuth: true,
          body: JSON.stringify({ presetId: id }),
        });
      } catch (e) {
        // Preserve old behavior: allow local Firestore-based deletion when not authenticated for server API.
        if (e instanceof AuthRequiredError || e instanceof ApiUnauthorizedError) {
          await firebaseService.deleteVisualizerCameraPreset(id);
        } else {
          throw e;
        }
      }

      const list = await firebaseService.getVisualizerCameraPresets();
      setCameraPresets(list);
      setDeletingPresetId(null);
    } catch (e: any) {
      setDeletingPresetId(null);
      setErrorMessage(e?.message || 'Failed to delete preset.');
    }
  };

  return (
    <div className="flex bg-gray-900 text-white h-[calc(100vh-64px)]">
      {/* Left: Control Panel */}
      <div className="w-1/3 bg-gray-800 px-4 pb-6 pt-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-400">◆</span> AI Visualizer
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Primary Model</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-sm"
            value={primaryModelId}
            onChange={(e) => setPrimaryModelId(e.target.value)}
          >
            {SCENE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>{model.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Add Props</label>
          <div className="flex gap-2">
            <select
              className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-sm"
              value={selectedPropId}
              onChange={(e) => setSelectedPropId(e.target.value)}
            >
              {SCENE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>{model.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPropModels((prev) => [...prev, { id: `${Date.now()}`, modelId: selectedPropId }])}
              className="px-3 py-2 rounded-md bg-gray-700 text-xs"
            >
              Add
            </button>
          </div>
          {propModels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {propModels.map((item) => {
                const model = SCENE_MODELS.find((option) => option.id === item.modelId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPropModels((prev) => prev.filter((p) => p.id !== item.id))}
                    className="px-2 py-1 rounded-md bg-zinc-900 text-[11px] border border-zinc-700"
                  >
                    {model?.label || item.modelId} ✕
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Art Style</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyleId(style.id)}
                className={`rounded-md overflow-hidden border ${
                  selectedStyleId === style.id ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : 'border-zinc-700'
                }`}
              >
                <img src={style.thumbnail} alt={style.label} className="w-full h-16 object-cover" />
                <div className="text-[11px] px-2 py-1 bg-zinc-900/80 text-left">{style.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Prompt Presets</label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset.text)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-600 bg-gray-700/60 hover:bg-gray-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Prompt</label>
          <textarea
            className="w-full bg-gray-700 border border-gray-600 p-3 rounded h-32 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
            placeholder="Leave empty to use the default prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {STYLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleStyleChip(chip)}
                className="px-2 py-1 rounded-full text-[11px] border border-blue-500/40 text-blue-200 bg-blue-500/10 hover:bg-blue-500/20"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Model</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-sm"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {MODEL_OPTIONS.map((model) => (
              <option key={model.id} value={model.id}>{model.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
          <div className="text-xs font-semibold text-gray-300">Scene Toggles</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeGridInCapture}
                onChange={(e) => setIncludeGridInCapture(e.target.checked)}
              />
              Include grid in capture
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showBackdrop} onChange={(e) => setShowBackdrop(e.target.checked)} /> Backdrop
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showFabricPlane} onChange={(e) => setShowFabricPlane(e.target.checked)} /> Fabric Plane
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
          <div className="text-xs font-semibold text-gray-300">Camera Controls</div>
          <div className="text-[11px] text-gray-400 leading-relaxed">
            Drag to rotate the camera. Scroll to zoom. Use Front/Side to snap angles.
            Current yaw {cameraInfo.yaw.toFixed(1)}°, pitch {cameraInfo.pitch.toFixed(1)}°, distance {cameraInfo.distance.toFixed(2)}.
          </div>
          <label className="text-xs">FOV: {cameraFov}°</label>
          <input
            type="range"
            min={20}
            max={80}
            value={cameraFov}
            onChange={(e) => setCameraFov(Number(e.target.value))}
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={dofEnabled}
              onChange={(e) => setDofEnabled(e.target.checked)}
            />
            Depth of Field
          </label>
          <label className="text-xs">Focus Distance: {dofFocusDistance.toFixed(1)}</label>
          <input
            type="range"
            min={1}
            max={20}
            step={0.1}
            value={dofFocusDistance}
            onChange={(e) => setDofFocusDistance(Number(e.target.value))}
          />
          <label className="text-xs">Aperture: f/{dofAperture.toFixed(1)}</label>
          <input
            type="range"
            min={1.2}
            max={16}
            step={0.1}
            value={dofAperture}
            onChange={(e) => setDofAperture(Number(e.target.value))}
          />
          <label className="text-xs">Focal Length: {dofFocalLength}mm</label>
          <input
            type="range"
            min={18}
            max={135}
            step={1}
            value={dofFocalLength}
            onChange={(e) => setDofFocalLength(Number(e.target.value))}
          />
          <div className="flex gap-2">
            <button className="text-xs px-2 py-1 rounded-md bg-gray-700" onClick={() => setCameraPosition([0, 2, 5])}>Front</button>
            <button className="text-xs px-2 py-1 rounded-md bg-gray-700" onClick={() => setCameraPosition([5, 2, 0])}>Side</button>
            <button className="text-xs px-2 py-1 rounded-md bg-gray-700" onClick={handleResetCamera}>Reset</button>
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={handleSavePreset}
              className={`w-full px-2 py-1.5 rounded-md text-xs ${
                isSavingPreset ? 'bg-blue-500/60 cursor-wait' : 'bg-blue-600'
              }`}
            >
              {isSavingPreset ? 'Saving…' : 'Save Camera Preset'}
            </button>
          </div>

          {cameraPresets.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-gray-400">Presets</div>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {cameraPresets.map((preset) => (
                  <div key={preset.id} className="group relative rounded-md border border-gray-700 bg-gray-900/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full text-left"
                    >
                      <div className="w-full aspect-[16/10] bg-gray-800 relative">
                        {preset.thumbnailDataUrl ? (
                          <img src={preset.thumbnailDataUrl} alt={preset.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No preview</div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                          <div className="w-full px-2 py-1 text-[11px] text-white bg-gradient-to-t from-black/70 to-black/0">
                            {preset.name}
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-red-200 text-xs"
                    >
                      {deletingPresetId === preset.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
          <div className="text-xs font-semibold text-gray-300">Fabric Plane</div>
          <label className="text-xs">Height</label>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={fabricPosition[1]}
            onChange={(e) => setFabricPosition([fabricPosition[0], Number(e.target.value), fabricPosition[2]])}
          />
          <label className="text-xs">Width</label>
          <input
            type="range"
            min={0.6}
            max={3}
            step={0.1}
            value={fabricScale[0]}
            onChange={(e) => setFabricScale([Number(e.target.value), fabricScale[1]])}
          />
          <label className="text-xs">Height Scale</label>
          <input
            type="range"
            min={0.6}
            max={3.5}
            step={0.1}
            value={fabricScale[1]}
            onChange={(e) => setFabricScale([fabricScale[0], Number(e.target.value)])}
          />
          <label className="text-xs">Rotation</label>
          <input
            type="range"
            min={-3.14}
            max={3.14}
            step={0.05}
            value={fabricRotation}
            onChange={(e) => setFabricRotation(Number(e.target.value))}
          />
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleCapture()}
            className="flex-1 p-2.5 rounded-md font-semibold bg-gray-700 hover:bg-gray-600 text-sm"
          >
            Capture Preview
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`flex-1 p-2.5 rounded-md font-bold transition-all shadow-lg ${
              loading
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 active:scale-95'
            }`}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {history.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-2">History</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGeneratedImage(item.dataUrl)}
                  className="w-full flex items-center gap-3 text-left rounded-lg border border-gray-700 bg-gray-900/40 p-2 hover:bg-gray-800/60"
                >
                  <img src={item.dataUrl} alt="history" className="w-16 h-16 object-cover rounded" />
                  <div className="text-xs text-gray-300">
                    <div className="font-semibold">{item.aspectLabel}</div>
                    <div className="opacity-70 line-clamp-2">{item.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: 3D Viewport */}
      <div className="w-2/3 border-l border-gray-700 overflow-y-auto">
        <div className="w-full px-4 pt-3 pb-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Viewport Window</h3>
              <p className="text-xs text-gray-400">Choose a target aspect ratio before capture.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAspectId(option.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    aspectId === option.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                  <span className="ml-1 text-[10px] opacity-70">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              className="relative w-full max-w-[980px] bg-zinc-900/80 border border-zinc-700 rounded-md shadow-lg overflow-hidden"
              style={{ aspectRatio: activeAspect.ratio }}
            >
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 border-b border-zinc-700 flex items-center px-3 text-[11px] text-zinc-300">
                3D Viewport • {activeAspect.label}
              </div>
              <div className="absolute inset-0 pt-8">
                <Canvas
                  gl={{ preserveDrawingBuffer: true }}
                  camera={{ position: cameraPosition, fov: cameraFov }}
                  className="bg-gradient-to-b from-gray-800 to-gray-900"
                  onCreated={({ gl }) => {
                    canvasRef.current = gl.domElement;
                  }}
                >
                  <Suspense fallback={null}>
                    <CameraRig position={cameraPosition} target={cameraTarget} fov={cameraFov} />
                    <SceneContent
                      showGrid={showGrid}
                      showBackdrop={showBackdrop}
                      showFabricPlane={showFabricPlane}
                      fabricPosition={fabricPosition}
                      fabricScale={fabricScale}
                      fabricRotation={fabricRotation}
                      primaryModelId={primaryModelId}
                      propModels={propModels}
                    />
                    <OrbitControls
                      ref={controlsRef}
                      key={controlsKey}
                      makeDefault
                      maxPolarAngle={Math.PI / 1.8}
                      minDistance={2}
                      maxDistance={10}
                      target={cameraTarget}
                      onEnd={() => {
                        const controls = controlsRef.current;
                        if (!controls) return;
                        const pos = controls.object?.position;
                        const target = controls.target;
                        if (pos) {
                          setCameraPosition([pos.x, pos.y, pos.z]);
                        }
                        if (target) {
                          setCameraTarget([target.x, target.y, target.z]);
                        }
                      }}
                      mouseButtons={{
                        LEFT: THREE.MOUSE.ROTATE,
                        MIDDLE: THREE.MOUSE.PAN,
                        RIGHT: THREE.MOUSE.DOLLY,
                      }}
                    />
                  </Suspense>
                </Canvas>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Drag to rotate • Scroll to zoom • Captures use {activeAspect.label} framing
          </div>

          <div className="w-full max-w-[980px] mx-auto">
            <div className="bg-zinc-900/60 border border-zinc-700 rounded-md p-3">
              <p className="text-sm text-gray-400 mb-2 font-medium">Result:</p>
              <div
                className="relative w-full bg-zinc-900/70 border border-zinc-800 rounded-md overflow-hidden"
                style={{ aspectRatio: activeAspect.ratio }}
              >
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="AI Generated"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <div className="text-3xl mb-2 opacity-20">🖼️</div>
                    <p className="text-sm">Capture the 3D scene and generate a preview.</p>
                  </div>
                )}
              </div>
              {generatedImage && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadDataUrl(generatedImage, 'visualizer-result.png')}
                    className="px-3 py-1 rounded-md bg-gray-700 text-xs"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizerPage;

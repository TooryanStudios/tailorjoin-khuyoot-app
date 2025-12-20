export type ImageMeta = { width?: number; height?: number };

export function getImageMeta(buffer: Buffer, mimeType: string): ImageMeta {
  const mime = (mimeType || '').toLowerCase();
  if (mime === 'image/png') return getPngMeta(buffer);
  if (mime === 'image/jpeg') return getJpegMeta(buffer);
  if (mime === 'image/webp') return getWebpMeta(buffer);
  return {};
}

function getPngMeta(buffer: Buffer): ImageMeta {
  // PNG IHDR starts at byte 8+4+4 = 16 for width, 20 for height
  if (buffer.length < 24) return {};
  const signature = buffer.subarray(0, 8);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(pngSig)) return {};
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

function getJpegMeta(buffer: Buffer): ImageMeta {
  // Walk JPEG markers to find SOF0/SOF2
  if (buffer.length < 4) return {};
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return {};

  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const isSof = marker === 0xc0 || marker === 0xc2;
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;

    if (isSof && offset + 2 + length <= buffer.length) {
      // [precision(1), height(2), width(2)] after length
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    offset += 2 + length;
  }

  return {};
}

function getWebpMeta(buffer: Buffer): ImageMeta {
  // RIFF....WEBP
  if (buffer.length < 30) return {};
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return {};
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return {};
  const chunkType = buffer.toString('ascii', 12, 16);

  if (chunkType === 'VP8X') {
    // Width-1 at bytes 24..26, height-1 at 27..29 (little endian 24-bit)
    const wMinus1 = buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
    const hMinus1 = buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
    return { width: wMinus1 + 1, height: hMinus1 + 1 };
  }

  // Fallback: unknown chunk
  return {};
}

import imageCompression from 'browser-image-compression';

export async function resizeImage(
  file: File,
  maxSize = 1024
): Promise<File> {
  const options: imageCompression.Options = {
    maxWidthOrHeight: maxSize,
    useWebWorker: true,
    // Keep it conservative; server enforces 5MB anyway.
    maxSizeMB: 1.5,
    fileType: file.type || undefined,
    initialQuality: 0.85,
  };

  const compressed = await imageCompression(file, options);
  return new File([compressed], file.name, { type: compressed.type || file.type });
}

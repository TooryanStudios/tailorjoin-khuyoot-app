export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const mimeType = file.type || 'application/octet-stream';
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL');
  }

  return {
    base64: dataUrl.slice(commaIndex + 1),
    mimeType,
  };
}

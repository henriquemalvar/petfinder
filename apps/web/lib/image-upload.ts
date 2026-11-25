export const MAX_UPLOAD_DIMENSION = 1600;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const SHRINK_THRESHOLD_BYTES = 1024 * 1024;
const JPEG_QUALITY = 0.85;

export class UploadTooLarge extends Error {
  constructor() {
    super("A foto passa de 4 MB mesmo reduzida. Escolha outra imagem.");
  }
}

export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function shouldShrink(file: File): boolean {
  return (
    file.size > SHRINK_THRESHOLD_BYTES &&
    file.type.startsWith("image/") &&
    file.type !== "image/gif"
  );
}

function toJpegName(name: string): string {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

async function renderAsJpeg(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_UPLOAD_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

export async function shrinkImage(file: File): Promise<File> {
  if (!shouldShrink(file)) return file;
  try {
    const blob = await renderAsJpeg(file);
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], toJpegName(file.name), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

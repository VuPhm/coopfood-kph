export const EVIDENCE_MAX_WIDTH = 1280;
export const EVIDENCE_MAX_HEIGHT = 720;
export const EVIDENCE_TARGET_BYTES = 420 * 1024;

export type StoreStamp = { storeCode: string; storeName: string };

export type ProcessedEvidencePhoto = {
  blob: Blob;
  capturedAt: Date;
  width: number;
  height: number;
};

type DrawableImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

const STAMP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function evidenceDimensions(width: number, height: number) {
  const scale = Math.min(1, EVIDENCE_MAX_WIDTH / width, EVIDENCE_MAX_HEIGHT / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function captureDate(file: File, controlledNow: Date) {
  try {
    const { parse: parseExif } = await import("exifr/dist/lite.esm.mjs");
    const metadata = await parseExif(file, ["DateTimeOriginal", "DateTimeDigitized", "DateTime"]);
    const value = metadata?.DateTimeOriginal ?? metadata?.DateTimeDigitized ?? metadata?.DateTime;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  } catch {
    // EXIF is optional. File metadata and then the controlled clock are valid fallbacks.
  }
  if (file.lastModified > 0) return new Date(file.lastModified);
  return controlledNow;
}

async function loadDrawable(file: File): Promise<DrawableImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, dispose: () => bitmap.close() };
    } catch {
      // Safari can decode some camera formats through <img> even when createImageBitmap cannot.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc ảnh. Hãy chọn ảnh JPEG, PNG hoặc ảnh camera mà thiết bị hỗ trợ."));
    };
    image.src = url;
  });
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function ellipsis(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output && context.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
  return `${output}…`;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Không thể tạo bản ảnh đã đóng tem."));
  }, "image/jpeg", quality));
}

async function compress(canvas: HTMLCanvasElement) {
  let workingCanvas = canvas;
  let blob = await canvasBlob(workingCanvas, 0.8);
  for (let pass = 0; pass < 4; pass += 1) {
    for (const quality of [0.72, 0.64, 0.56]) {
      if (blob.size <= EVIDENCE_TARGET_BYTES) return { blob, canvas: workingCanvas };
      blob = await canvasBlob(workingCanvas, quality);
    }
    if (blob.size <= EVIDENCE_TARGET_BYTES || Math.max(workingCanvas.width, workingCanvas.height) <= 720) break;
    const resized = document.createElement("canvas");
    resized.width = Math.max(1, Math.round(workingCanvas.width * 0.8));
    resized.height = Math.max(1, Math.round(workingCanvas.height * 0.8));
    resized.getContext("2d")?.drawImage(workingCanvas, 0, 0, resized.width, resized.height);
    workingCanvas = resized;
    blob = await canvasBlob(workingCanvas, 0.8);
  }
  return { blob, canvas: workingCanvas };
}

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: STAMP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    time: `${part("hour")}:${part("minute")}`,
    weekday: part("weekday"),
    date: `${part("day")}/${part("month")}/${part("year")}`,
  };
}

function drawStamp(context: CanvasRenderingContext2D, source: CanvasImageSource, width: number, height: number, capturedAt: Date, store: StoreStamp) {
  const { date, time, weekday } = dateParts(capturedAt);
  const storeIdentity = [store.storeCode, store.storeName].filter(Boolean).join(" - ");
  const shortEdge = Math.min(width, height);
  const unit = Math.min(22, Math.max(13, Math.round(shortEdge * 0.028)));
  const padding = Math.round(unit * 0.44);
  const timeSize = Math.round(unit * 1.72);
  const textSize = Math.round(unit * 0.88);
  const storeTextSize = Math.max(10, Math.round(textSize * 0.78));
  const margin = Math.min(42, Math.max(12, Math.round(shortEdge * 0.035)));

  context.font = `700 ${timeSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const timeWidth = context.measureText(time).width;
  context.font = `600 ${textSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const weekdayWidth = context.measureText(weekday).width;
  context.font = `500 ${Math.round(textSize * 0.86)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const dateWidth = context.measureText(date).width;
  const columnGap = Math.round(unit * 0.55);
  const contentWidth = timeWidth + columnGap + Math.max(weekdayWidth, dateWidth);
  const baseCardWidth = Math.min(310, Math.max(170, Math.round(contentWidth + padding * 2)));
  const cardWidth = Math.min(width - margin * 2, Math.round(baseCardWidth * 1.25));
  const infoHeight = Math.round(timeSize * 1.24);
  const storeHeight = storeIdentity ? Math.round(unit * 1.08) : 0;
  const cardHeight = padding * 2 + infoHeight + storeHeight;
  const x = margin;
  const y = Math.max(margin, height - margin - cardHeight);

  context.save();
  roundedRect(context, x, y, cardWidth, cardHeight, Math.round(unit * 0.62));
  context.clip();
  context.filter = `blur(${Math.max(2, Math.round(unit * 0.22))}px) brightness(0.76)`;
  context.drawImage(source, 0, 0, width, height);
  context.filter = "none";
  context.fillStyle = "rgba(0, 102, 51, 0.1)";
  context.fillRect(x, y, cardWidth, cardHeight);
  context.restore();

  context.save();
  roundedRect(context, x, y, cardWidth, cardHeight, Math.round(unit * 0.62));
  context.strokeStyle = "rgba(213, 240, 222, 0.38)";
  context.lineWidth = Math.max(1, Math.round(unit * 0.07));
  context.stroke();
  const contentX = x + padding;
  const infoTop = y + padding;
  const dateX = contentX + timeWidth + columnGap;
  context.fillStyle = "#fff";
  context.font = `700 ${timeSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillText(time, contentX, infoTop + timeSize);
  context.font = `600 ${textSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.fillText(weekday, dateX, infoTop + Math.round(textSize * 1.05));
  context.font = `500 ${Math.round(textSize * 0.86)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.fillText(date, dateX, infoTop + Math.round(textSize * 2.12));
  if (storeIdentity) {
    const storeY = y + padding + infoHeight;
    context.fillStyle = "#93c11f";
    context.fillRect(contentX, storeY, Math.max(3, Math.round(unit * 0.18)), Math.round(unit * 0.88));
    context.fillStyle = "#fff";
    context.font = `600 ${storeTextSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    context.fillText(ellipsis(context, storeIdentity, cardWidth - padding * 2 - Math.round(unit * 0.7)), contentX + Math.round(unit * 0.58), storeY + Math.round(unit * 0.7));
  }
  context.restore();
}

export async function processEvidencePhoto(file: File, store: StoreStamp, controlledNow = new Date()): Promise<ProcessedEvidencePhoto> {
  const [drawable, capturedAt] = await Promise.all([loadDrawable(file), captureDate(file, controlledNow)]);
  try {
    if (!drawable.width || !drawable.height) throw new Error("Ảnh minh chứng không có kích thước hợp lệ.");
    const dimensions = evidenceDimensions(drawable.width, drawable.height);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Thiết bị không hỗ trợ xử lý ảnh minh chứng.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);
    drawStamp(context, drawable.source, canvas.width, canvas.height, capturedAt, store);
    const compressed = await compress(canvas);
    return { blob: compressed.blob, capturedAt, width: compressed.canvas.width, height: compressed.canvas.height };
  } finally {
    drawable.dispose();
  }
}

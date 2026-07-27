import { extractPlateCandidatesFromTextBlocks } from "@/features/quick-access/utils";

import { detectTextBlocksFromCanvas } from "@/components/scanning/text-detector";

let tesseractWorkerPromise: Promise<import("tesseract.js").Worker> | null = null;

export function canUseNativeTextDetector() {
  if (typeof window === "undefined") {
    return false;
  }

  return "TextDetector" in window;
}

export async function detectPlateFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const nativeBlocks = await detectTextBlocksFromCanvas(canvas);

  if (nativeBlocks && nativeBlocks.length > 0) {
    const candidates = extractPlateCandidatesFromTextBlocks(nativeBlocks);

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  return detectPlateWithTesseract(canvas);
}

async function detectPlateWithTesseract(canvas: HTMLCanvasElement): Promise<string | null> {
  const cropped = cropPlateRegion(canvas);
  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(cropped);
  const text = data.text ?? "";

  if (!text.trim()) {
    return null;
  }

  const candidates = extractPlateCandidatesFromTextBlocks([text]);

  return candidates[0] ?? null;
}

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });

      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      });

      return worker;
    })();
  }

  return tesseractWorkerPromise;
}

function cropPlateRegion(source: HTMLCanvasElement) {
  const crop = document.createElement("canvas");
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const cropWidth = Math.max(1, Math.round(sourceWidth * 0.88));
  const cropHeight = Math.max(1, Math.round(sourceHeight * 0.32));
  const originX = Math.round((sourceWidth - cropWidth) / 2);
  const originY = Math.round((sourceHeight - cropHeight) / 2);

  crop.width = cropWidth;
  crop.height = cropHeight;

  const context = crop.getContext("2d");

  if (!context) {
    return source;
  }

  context.drawImage(
    source,
    originX,
    originY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return crop;
}

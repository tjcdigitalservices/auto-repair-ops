import type { DeviceScanMode } from "@/components/scanning/types";
import { detectPlateFromCanvas } from "@/components/scanning/plate-ocr";

export async function decodeScanFrame(
  mode: DeviceScanMode,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  switch (mode) {
    case "vehicle_plate":
      return detectPlateFromCanvas(canvas);
    case "qr_code":
    case "barcode":
      return null;
    default:
      return null;
  }
}

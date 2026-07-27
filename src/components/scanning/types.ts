export type DeviceScanMode = "vehicle_plate" | "qr_code" | "barcode";

export type DeviceScannerCopy = {
  title: string;
  hint: string;
  aligning: string;
  reading: string;
  unsupported: string;
  permissionError: string;
};

export const DEVICE_SCANNER_COPY: Record<DeviceScanMode, DeviceScannerCopy> = {
  vehicle_plate: {
    title: "Scan plate",
    hint: "Align the license plate inside the frame. Recognition runs automatically.",
    aligning: "Align the plate inside the frame",
    reading: "Reading plate…",
    unsupported:
      "Automatic plate reading is not available in this browser. Enter the plate manually instead.",
    permissionError: "Unable to access the camera. Check permissions or enter the plate manually.",
  },
  qr_code: {
    title: "Scan QR code",
    hint: "Center the QR code inside the frame.",
    aligning: "Align the QR code inside the frame",
    reading: "Reading code…",
    unsupported: "QR scanning is not available yet in this browser.",
    permissionError: "Unable to access the camera.",
  },
  barcode: {
    title: "Scan barcode",
    hint: "Center the barcode inside the frame.",
    aligning: "Align the barcode inside the frame",
    reading: "Reading barcode…",
    unsupported: "Barcode scanning is not available yet in this browser.",
    permissionError: "Unable to access the camera.",
  },
};

export function isCameraApiAvailable() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** Browsers only allow camera on HTTPS or localhost — not http://192.168.x.x */
export function isSecureCameraContext() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function resolveCameraBlockMessage(fallbackPermissionMessage: string) {
  if (typeof window === "undefined") {
    return null;
  }

  if (!isSecureCameraContext()) {
    return "Camera requires HTTPS on a phone. Stop any HTTP dev server on port 3000, run npm run dev:lan:https on your computer, then open the https:// address shown (not http://). If Safari shows ERR_SSL_PROTOCOL_ERROR, an old HTTP server is still running on that port.";
  }

  if (!isCameraApiAvailable()) {
    return fallbackPermissionMessage;
  }

  return null;
}

export function resolveGetUserMediaErrorMessage(
  error: unknown,
  fallbackPermissionMessage: string,
) {
  if (!isSecureCameraContext()) {
    return resolveCameraBlockMessage(fallbackPermissionMessage) ?? fallbackPermissionMessage;
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Camera access was denied. In iPhone Settings → Safari → Camera, allow access, or tap Allow when Safari asks.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera was found on this device.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The camera is in use by another app. Close other apps using the camera and try again.";
    }
  }

  return fallbackPermissionMessage;
}

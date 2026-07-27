"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { decodeScanFrame } from "@/components/scanning/decode-scan-frame";
import {
  isCameraApiAvailable,
  resolveCameraBlockMessage,
  resolveGetUserMediaErrorMessage,
} from "@/components/scanning/camera-access";
import { canUseNativeTextDetector } from "@/components/scanning/plate-ocr";
import {
  DEVICE_SCANNER_COPY,
  type DeviceScanMode,
} from "@/components/scanning/types";
import { cn } from "@/lib/utils";

const NATIVE_SCAN_INTERVAL_MS = 450;
const FALLBACK_SCAN_INTERVAL_MS = 1400;

export function DeviceScannerOverlay({
  mode,
  open,
  onOpenChange,
  onScan,
}: {
  mode: DeviceScanMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}) {
  const copy = DEVICE_SCANNER_COPY[mode];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const isScanningFrameRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready" | "blocked">("idle");
  const [statusMessage, setStatusMessage] = useState(copy.aligning);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    isScanningFrameRef.current = false;
    setCameraState("idle");
  }, []);

  const closeScanner = useCallback(() => {
    stopCamera();
    hasSubmittedRef.current = false;
    setErrorMessage(null);
    setStatusMessage(copy.aligning);
    onOpenChange(false);
  }, [copy.aligning, onOpenChange, stopCamera]);

  const captureAndDecode = useCallback(async () => {
    if (hasSubmittedRef.current || isScanningFrameRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    isScanningFrameRef.current = true;
    setStatusMessage(copy.reading);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const decoded = await decodeScanFrame(mode, canvas);

      if (decoded && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        stopCamera();
        onScan(decoded);
        onOpenChange(false);
        return;
      }

      setStatusMessage(copy.aligning);
    } catch {
      setStatusMessage(copy.aligning);
    } finally {
      isScanningFrameRef.current = false;
    }
  }, [copy.aligning, copy.reading, mode, onOpenChange, onScan, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      hasSubmittedRef.current = false;
      return;
    }

    const blockMessage = resolveCameraBlockMessage(copy.permissionError);
    if (blockMessage) {
      setCameraState("blocked");
      setErrorMessage(blockMessage);
      return;
    }

    if (!isCameraApiAvailable()) {
      setCameraState("blocked");
      setErrorMessage(copy.permissionError);
      return;
    }

    let cancelled = false;
    const scanIntervalMs = canUseNativeTextDetector()
      ? NATIVE_SCAN_INTERVAL_MS
      : FALLBACK_SCAN_INTERVAL_MS;

    async function startCamera() {
      setCameraState("loading");
      setErrorMessage(null);
      setStatusMessage(
        canUseNativeTextDetector() ? copy.aligning : "Starting camera and plate reader…",
      );
      hasSubmittedRef.current = false;

      try {
        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch (firstError) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (secondError) {
            throw secondError ?? firstError;
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          await video.play();
        }

        setCameraState("ready");
        setStatusMessage(copy.aligning);
        scanTimerRef.current = window.setInterval(() => {
          void captureAndDecode();
        }, scanIntervalMs);
      } catch (error) {
        if (!cancelled) {
          setCameraState("blocked");
          setErrorMessage(resolveGetUserMediaErrorMessage(error, copy.permissionError));
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [captureAndDecode, copy.aligning, copy.permissionError, open, stopCamera]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-lg font-semibold">{copy.title}</p>
          <p className="text-sm text-white/70">{copy.hint}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          onClick={closeScanner}
          aria-label="Close scanner"
        >
          <X className="size-5" />
        </Button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
          <video
            ref={videoRef}
            className={cn(
              "h-full w-full object-cover",
              cameraState === "ready" ? "opacity-100" : "opacity-0",
            )}
            muted
            playsInline
            autoPlay
          />

          {cameraState === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-white/80" />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 bg-black/35" />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div
              className={cn(
                "relative w-full max-w-md rounded-xl border-2 border-dashed border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]",
                mode === "vehicle_plate" ? "aspect-[2.4/1]" : "aspect-square max-w-xs",
              )}
            >
              <div className="absolute -top-8 left-0 right-0 text-center text-xs font-medium uppercase tracking-wide text-white/80">
                {mode === "vehicle_plate" ? "License plate" : "Scan target"}
              </div>
            </div>
          </div>
        </div>

        <footer className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          {errorMessage ? (
            <p className="text-center text-sm leading-relaxed text-red-300">{errorMessage}</p>
          ) : (
            <p className="text-center text-sm text-white/80">{statusMessage}</p>
          )}
          <Button type="button" variant="secondary" className="w-full" onClick={closeScanner}>
            Cancel
          </Button>
        </footer>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body,
  );
}

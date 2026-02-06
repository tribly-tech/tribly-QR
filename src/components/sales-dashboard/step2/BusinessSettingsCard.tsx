"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NewBusinessState } from "../types";
import { getAuthToken } from "@/lib/auth";
import { QrCode, Scan, AlertCircle, Camera, Square } from "lucide-react";
import jsQR from "jsqr";

type ValidateQrResult =
  | { ok: true; is_active: true; code: string; cdn_url: string }
  | { ok: true; is_active: false; code: string; cdn_url: string }
  | { ok: false; status: number };

/** Crop canvas to the QR code region using jsQR location; returns blob or null */
function cropCanvasToQrRegion(
  sourceCanvas: HTMLCanvasElement,
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  },
  paddingPx = 8
): HTMLCanvasElement {
  const xs = [
    location.topLeftCorner.x,
    location.topRightCorner.x,
    location.bottomLeftCorner.x,
    location.bottomRightCorner.x,
  ];
  const ys = [
    location.topLeftCorner.y,
    location.topRightCorner.y,
    location.bottomLeftCorner.y,
    location.bottomRightCorner.y,
  ];
  const minX = Math.max(0, Math.floor(Math.min(...xs)) - paddingPx);
  const minY = Math.max(0, Math.floor(Math.min(...ys)) - paddingPx);
  const maxX = Math.min(
    sourceCanvas.width,
    Math.ceil(Math.max(...xs)) + paddingPx
  );
  const maxY = Math.min(
    sourceCanvas.height,
    Math.ceil(Math.max(...ys)) + paddingPx
  );
  const w = maxX - minX;
  const h = maxY - minY;
  const cropped = document.createElement("canvas");
  cropped.width = w;
  cropped.height = h;
  const ctx = cropped.getContext("2d");
  if (!ctx) return sourceCanvas;
  ctx.drawImage(sourceCanvas, minX, minY, w, h, 0, 0, w, h);
  return cropped;
}

interface BusinessSettingsCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
  /** QR code set when user scans (8-char code); used in API payload */
  scannedQrCode?: string | null;
  /** Called when a valid Tribly QR is scanned */
  onQrCodeScanned?: (code: string) => void;
  /** Called when the scanned QR is cleared */
  onQrCodeCleared?: () => void;
}

export function BusinessSettingsCard({
  newBusiness,
  setNewBusiness,
  onQrCodeScanned,
  onQrCodeCleared,
}: BusinessSettingsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const validateQr = useCallback(
    async (qrData: string): Promise<ValidateQrResult> => {
      const authToken = getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const response = await fetch("/api/qr/validate", {
        method: "POST",
        headers,
        body: JSON.stringify({ qr_data: qrData }),
      });
      const json = await response.json();
      if (!response.ok) {
        return { ok: false, status: response.status };
      }
      const data = json.data;
      return {
        ok: true,
        is_active: data?.is_active ?? true,
        code: data?.code ?? "",
        cdn_url: data?.cdn_url ?? "",
      };
    },
    []
  );

  const revokePreviousUrl = useCallback(() => {
    if (qrImageUrl && qrImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(qrImageUrl);
    }
    setQrImageUrl(null);
  }, [qrImageUrl]);

  const handleScanQr = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      revokePreviousUrl();
      setScanError(null);
      setScannedCode(null);
      setIsScanning(true);

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setScanError("Could not read image.");
            setIsScanning(false);
            URL.revokeObjectURL(url);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            { inversionAttempts: "dontInvert" }
          );
          if (!result?.data) {
            setScanError("No QR code found in image.");
            URL.revokeObjectURL(url);
          } else {
            const qrData = result.data.trim();
            setScanError(null);
            setIsValidating(true);
            validateQr(qrData)
              .then((res) => {
                if (!res.ok) {
                  if (res.status === 404) {
                    setScanError("Please scan a valid QR.");
                  } else {
                    setScanError("Could not validate QR. Please try again.");
                  }
                  URL.revokeObjectURL(url);
                  return;
                }
                if (res.is_active) {
                  setScanError(
                    "This QR is already in use. Please scan an unused QR."
                  );
                  URL.revokeObjectURL(url);
                  return;
                }
                setScannedCode(res.code);
                onQrCodeScanned?.(res.code);
                if (res.cdn_url) {
                  setQrImageUrl(res.cdn_url);
                  URL.revokeObjectURL(url);
                } else {
                  const cropped = cropCanvasToQrRegion(canvas, result.location);
                  cropped.toBlob(
                    (blob) => {
                      if (blob) {
                        setQrImageUrl(URL.createObjectURL(blob));
                      }
                      URL.revokeObjectURL(url);
                    },
                    "image/png",
                    0.9
                  );
                }
              })
              .catch(() => {
                setScanError("Could not validate QR. Please try again.");
                URL.revokeObjectURL(url);
              })
              .finally(() => {
                setIsScanning(false);
                setIsValidating(false);
              });
          }
        } catch (err) {
          setScanError("Failed to decode QR code.");
          URL.revokeObjectURL(url);
        } finally {
          setIsScanning(false);
        }
      };
      img.onerror = () => {
        setScanError("Failed to load image.");
        setIsScanning(false);
        URL.revokeObjectURL(url);
      };
      img.src = url;
      e.target.value = "";
    },
    [revokePreviousUrl, validateQr, onQrCodeScanned]
  );

  const handleClearScan = useCallback(() => {
    revokePreviousUrl();
    setScannedCode(null);
    setScanError(null);
    setCameraError(null);
    onQrCodeCleared?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [revokePreviousUrl, onQrCodeCleared]);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current != null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  }, []);

  const startCameraScan = useCallback(() => {
    revokePreviousUrl();
    setScanError(null);
    setScannedCode(null);
    setCameraError(null);
    setShowCamera(true);
    setIsScanning(true);
  }, [revokePreviousUrl]);

  useEffect(() => {
    if (!showCamera || !videoRef.current) return;

    let cancelled = false;
    setCameraError(null);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().then(() => {
          if (!cancelled && videoRef.current) runScanLoop();
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            err.name === "NotAllowedError"
              ? "Camera access was denied."
              : "Could not access camera. Try uploading an image instead."
          );
          setShowCamera(false);
          setIsScanning(false);
        }
      });

    return () => {
      cancelled = true;
      stopCamera();
      setIsScanning(false);
    };
  }, [showCamera, stopCamera]);

  function runScanLoop() {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(runScanLoop);
      return;
    }

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
      scanLoopRef.current = requestAnimationFrame(runScanLoop);
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      scanLoopRef.current = requestAnimationFrame(runScanLoop);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const result = jsQR(imageData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });

    if (result?.data) {
      const qrData = result.data.trim();
      if (scanLoopRef.current != null) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setScanError(null);
      setIsValidating(true);
      validateQr(qrData)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              setScanError("Please scan a valid QR.");
            } else {
              setScanError("Could not validate QR. Please try again.");
            }
            return;
          }
          if (res.is_active) {
            setScanError(
              "This QR is already in use. Please scan an unused QR."
            );
            return;
          }
          setScannedCode(res.code);
          onQrCodeScanned?.(res.code);
          if (res.cdn_url) {
            setQrImageUrl(res.cdn_url);
          } else {
            const cropped = cropCanvasToQrRegion(canvas, result.location);
            cropped.toBlob(
              (blob) => {
                if (blob) {
                  setQrImageUrl(URL.createObjectURL(blob));
                }
              },
              "image/png",
              0.9
            );
          }
        })
        .catch(() => {
          setScanError("Could not validate QR. Please try again.");
        })
        .finally(() => {
          setShowCamera(false);
          setIsScanning(false);
          setIsValidating(false);
        });
      return;
    }

    scanLoopRef.current = requestAnimationFrame(runScanLoop);
  }

  useEffect(() => {
    return () => {
      if (qrImageUrl && qrImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [qrImageUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Settings</CardTitle>
        <CardDescription>Configure review settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="google-review-link">
              Google Business Review Link
            </Label>
            <Input
              id="google-review-link"
              type="url"
              placeholder="https://g.page/r/your-business/review"
              value={newBusiness.googleBusinessReviewLink}
              onChange={(e) =>
                setNewBusiness({
                  ...newBusiness,
                  googleBusinessReviewLink: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add your Google Business review link to redirect
              customers after they submit feedback
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </Label>
              <p className="text-xs text-muted-foreground">
                Scan with your camera or upload an image of a Tribly QR code (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  https://qr.tribly.ai/qr/XXXXXXXX
                </code>
                ) to extract the 8-character code.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScanQr}
                disabled={isScanning || isValidating}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCameraScan}
                  disabled={isScanning || isValidating}
                >
                  <Camera className="h-4 w-4" />
                  Scan with camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning || isValidating}
                >
                  {isValidating ? (
                    "Validating…"
                  ) : isScanning && !showCamera ? (
                    "Scanning…"
                  ) : (
                    <>
                      <Scan className="h-4 w-4" />
                      Choose image
                    </>
                  )}
                </Button>
                {(scannedCode || qrImageUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearScan}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {showCamera && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <div className="relative aspect-square max-h-64 w-full overflow-hidden rounded-lg border bg-black">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                  />
                  <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/90">
                    Point your camera at the QR code
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="w-full"
                >
                  <Square className="h-4 w-4" />
                  Stop camera
                </Button>
              </div>
            )}

            {cameraError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {scanError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {(scannedCode || qrImageUrl) && !scanError && (
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center">
                {qrImageUrl && (
                  <div className="shrink-0">
                    <img
                      src={qrImageUrl}
                      alt="Scanned QR code"
                      className="h-24 w-24 rounded-lg border object-cover"
                    />
                  </div>
                )}
                {scannedCode && (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Extracted code
                    </p>
                    <p className="font-mono text-lg font-semibold tracking-wide">
                      {scannedCode}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

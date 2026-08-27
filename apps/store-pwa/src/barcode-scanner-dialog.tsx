import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@coopfood-kph/ui";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, type Result, type Exception } from "@zxing/library";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  ScanLine,
  SwitchCamera,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type BarcodeScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
};

type CameraDevice = {
  deviceId: string;
  label: string;
};

type ScannerStatus = "idle" | "requesting" | "scanning" | "success" | "error";

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats: () => Promise<string[]>;
}

export function BarcodeScannerDialog({ onOpenChange, onScan, open }: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const titleId = useId();
  const descId = useId();

  const stopStream = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch {
        // Ignore reset error on unmount/stop
      }
      zxingReaderRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // Ignore track stop error
        }
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  const handleScanSuccess = useCallback((code: string) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;
    const trimmed = code.trim();
    if (!trimmed) return;

    setScannedCode(trimmed);
    setStatus("success");

    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(100);
      }
    } catch {
      // Ignore vibration error
    }

    // Short delay to display success animation/flash before closing
    window.setTimeout(() => {
      stopStream();
      onScan(trimmed);
      onOpenChange(false);
    }, 450);
  }, [onOpenChange, onScan, stopStream]);

  const startScanning = useCallback(async (deviceId?: string) => {
    stopStream();
    setStatus("requesting");
    setErrorMessage("");
    setScannedCode(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Trình duyệt không hỗ trợ truy cập camera. Vui lòng nhập mã thủ công.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${index + 1}`,
          }));
        setCameras(videoDevices);
      } catch {
        // Enumerate devices not critical
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        const capabilities = videoTrack.getCapabilities() as { torch?: boolean };
        setTorchAvailable(Boolean(capabilities.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      isScanningRef.current = true;
      setStatus("scanning");

      // Check if native BarcodeDetector API is supported
      const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

      if (hasBarcodeDetector) {
        try {
          const detectorClass = (window as unknown as { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
          const supportedFormats = await detectorClass.getSupportedFormats();
          const targetFormats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"].filter((f) => supportedFormats.includes(f));
          
          const detector = targetFormats.length
            ? new detectorClass({ formats: targetFormats })
            : new detectorClass();

          let lastDetectTime = 0;
          const detectLoop = async (time: number) => {
            if (!isScanningRef.current || !videoRef.current) return;

            // Scan at ~12-15 fps for performance balance
            if (time - lastDetectTime >= 70 && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              lastDetectTime = time;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
                  handleScanSuccess(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // Ignore detection frame error
              }
            }

            if (isScanningRef.current) {
              animationFrameIdRef.current = requestAnimationFrame(detectLoop);
            }
          };

          animationFrameIdRef.current = requestAnimationFrame(detectLoop);
          return;
        } catch {
          // Fallback to ZXing if BarcodeDetector init fails
        }
      }

      // ZXing fallback engine
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const zxingReader = new BrowserMultiFormatReader(hints, 100);
      zxingReaderRef.current = zxingReader;

      if (videoRef.current) {
        void zxingReader.decodeFromVideoElementContinuously(
          videoRef.current,
          (result: Result | null | undefined, err: Exception | null | undefined) => {
            if (result && isScanningRef.current) {
              handleScanSuccess(result.getText());
            }
            if (err && !(err.name === "NotFoundException")) {
              // Non-fatal frame scan errors can be ignored
            }
          }
        );
      }
    } catch (err: unknown) {
      stopStream();
      setStatus("error");

      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Quyền truy cập máy ảnh bị từ chối. Vui lòng cho phép quyền Camera trong cài đặt trình duyệt hoặc nhập mã thủ công.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("Không tìm thấy máy ảnh trên thiết bị này. Vui lòng nhập mã thủ công.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setErrorMessage("Máy ảnh đang được ứng dụng khác sử dụng hoặc không sẵn sàng.");
      } else {
        setErrorMessage("Không thể khởi động máy ảnh. Vui lòng thử lại hoặc nhập mã thủ công.");
      }
    }
  }, [handleScanSuccess, stopStream]);

  // Start scanning when dialog opens
  useEffect(() => {
    if (open) {
      void startScanning(selectedDeviceId || undefined);
    } else {
      stopStream();
      setStatus("idle");
      setErrorMessage("");
      setScannedCode(null);
    }

    return () => {
      stopStream();
    };
  }, [open, selectedDeviceId, startScanning, stopStream]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as MediaStreamTrack & { applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      // Ignore torch error
    }
  }, [torchOn]);

  const switchCamera = useCallback(() => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextDevice = cameras[nextIndex];
    if (nextDevice) {
      setSelectedDeviceId(nextDevice.deviceId);
    }
  }, [cameras, selectedDeviceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="barcode-scanner-dialog-content max-w-lg p-0 overflow-hidden"
        aria-describedby={descId}
        aria-labelledby={titleId}
      >
        <DialogHeader className="barcode-scanner-header">
          <DialogTitle id={titleId} className="flex items-center gap-2 text-base font-bold text-white">
            <ScanLine size={20} aria-hidden="true" className="text-emerald-400" />
            <span>Quét mã SKU / UPC</span>
          </DialogTitle>
          <DialogDescription id={descId} className="text-xs text-white/70">
            Căn chỉnh mã vạch vào giữa khung quét để tự động nhận dạng.
          </DialogDescription>
        </DialogHeader>

        <div className="barcode-scanner-view-container relative bg-black aspect-[4/3] w-full overflow-hidden flex items-center justify-center">
          {/* Video preview */}
          <video
            ref={videoRef}
            className="barcode-scanner-video absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            aria-label="Camera preview"
          />

          {/* Scanner Aim Overlay & Laser Beam */}
          {status === "scanning" && (
            <div className="barcode-scanner-overlay absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="barcode-scanner-frame relative w-[85%] h-[46%] rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Laser animation */}
                <div className="barcode-scanner-laser" />
              </div>
            </div>
          )}

          {/* Success state flash */}
          {status === "success" && (
            <div className="absolute inset-0 bg-emerald-600/40 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-full bg-emerald-500 p-3 shadow-lg mb-2">
                <ScanLine size={32} className="text-white" />
              </div>
              <p className="text-sm font-bold tracking-wide">Đã nhận diện mã</p>
              <p className="text-lg font-black tracking-widest text-emerald-200 mt-1 font-mono bg-black/50 px-3 py-1 rounded-lg">
                {scannedCode}
              </p>
            </div>
          )}

          {/* Loading state */}
          {status === "requesting" && (
            <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center text-white z-10">
              <Camera size={36} className="animate-pulse text-emerald-400 mb-2" />
              <p className="text-sm font-semibold">Đang khởi động máy ảnh…</p>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="absolute inset-0 bg-neutral-950 p-6 flex flex-col items-center justify-center text-center text-white z-10">
              <div className="rounded-full bg-red-500/20 p-3 mb-3 text-red-400">
                <TriangleAlert size={32} />
              </div>
              <p className="font-bold text-sm text-red-200 mb-1">Không thể dùng máy ảnh</p>
              <p className="text-xs text-white/70 max-w-xs leading-relaxed mb-4">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  className="h-9 px-4 text-xs font-bold"
                  onClick={() => {
                    void startScanning(selectedDeviceId || undefined);
                  }}
                >
                  <RefreshCw size={14} className="mr-1.5" />
                  Thử lại
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="barcode-scanner-footer bg-neutral-900 px-4 py-3 flex items-center justify-between gap-2 border-t border-neutral-800">
          <div className="flex items-center gap-1.5">
            {torchAvailable && (
              <button
                type="button"
                className={`inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${torchOn ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "text-white/80 hover:bg-white/10"}`}
                onClick={() => {
                  void toggleTorch();
                }}
                title={torchOn ? "Tắt đèn pin" : "Bật đèn pin"}
              >
                {torchOn ? <FlashlightOff size={16} className="mr-1.5" /> : <Flashlight size={16} className="mr-1.5" />}
                <span>{torchOn ? "Tắt đèn" : "Bật đèn"}</span>
              </button>
            )}

            {cameras.length > 1 && (
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
                onClick={switchCamera}
                title="Đổi camera"
              >
                <SwitchCamera size={16} className="mr-1.5" />
                <span>Đổi camera</span>
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="h-9 px-4 text-xs font-bold ml-auto border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
            onClick={() => onOpenChange(false)}
          >
            Nhập mã thủ công
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  Eye,
  Focus,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  ScanFace,
  ScanLine,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { Thumb, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/vision-camera")({
  head: () => ({
    meta: [
      { title: "Vision & Camera — JANUARY perception suite" },
      {
        name: "description",
        content:
          "Live camera feed, object detection, OCR and image analysis powered by JANUARY vision models.",
      },
      { property: "og:title", content: "Vision & Camera — JANUARY" },
      {
        property: "og:description", content: "Real-time detection overlays, capture library and vision model settings." },
    ],
  }),
  component: VisionPage,
});

type CameraState = "idle" | "requesting" | "active" | "denied" | "error" | "unavailable";

function VisionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      cameras: cameraState === "active" ? 1 : 0,
      detections: 0,
      tracked: 0,
      inference: "—",
    };
  }, [cameraState]);

  const requestCamera = async () => {
    setCameraState("requesting");
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState("unavailable");
        setErrorMessage("Camera API not available in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraState("active");
        };
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("denied");
        setErrorMessage("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setCameraState("unavailable");
        setErrorMessage("No camera found on this device.");
      } else {
        setCameraState("error");
        setErrorMessage(error.message || "Failed to access camera");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
      }
    }
  };

  const downloadCapture = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = `january-capture-${Date.now()}.png`;
      link.click();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getStatusChip = () => {
    switch (cameraState) {
      case "idle":
        return <Chip tone="amber">Camera Off</Chip>;
      case "requesting":
        return (
          <Chip tone="amber">
            <StatusDot tone="amber" pulse /> Requesting
          </Chip>
        );
      case "active":
        return (
          <Chip tone="ok">
            <StatusDot tone="ok" pulse /> Live
          </Chip>
        );
      case "denied":
        return <Chip tone="danger">Permission Denied</Chip>;
      case "unavailable":
        return <Chip tone="danger">Not Available</Chip>;
      case "error":
        return <Chip tone="danger">Error</Chip>;
      default:
        return <Chip>Unknown</Chip>;
    }
  };

  return (
    <AppShell promptPlaceholder="Ask January about what it sees..." rightPanel={<VisionRail />}>
      <PageHeader
        title="Vision & Camera"
        subtitle="Real-time perception, detection and image analysis"
        actions={
          <>
            <GhostButton>
              <ImageIcon className="size-3.5" /> Upload Image
            </GhostButton>
            {cameraState === "active" ? (
              <>
                <AmberButton onClick={captureFrame}>
                  <Camera className="size-3.5" /> Capture
                </AmberButton>
                <GhostButton onClick={stopCamera}>
                  <X className="size-3.5" /> Stop
                </GhostButton>
              </>
            ) : (
              <AmberButton onClick={requestCamera} disabled={cameraState === "requesting"}>
                {cameraState === "requesting" ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                {cameraState === "requesting" ? "Starting..." : "Start Camera"}
              </AmberButton>
            )}
          </>
        }
      />

      <Panel className="mb-3 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
          {getStatusChip()}
          <h3 className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
            {cameraState === "active" ? "System Camera" : cameraState === "idle" ? "Camera Off" : errorMessage || "Camera Error"}
          </h3>
          <button
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
            disabled={cameraState !== "active"}
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>

        {cameraState === "active" ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-[320px] w-full bg-black object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : cameraState === "idle" || cameraState === "unavailable" || cameraState === "error" || cameraState === "denied" ? (
          <div className="relative">
            <Thumb icon={Camera} seed={3} className="h-[320px] rounded-none border-0" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4 text-center">
              <div>
                <Camera className="mx-auto mb-2 size-8 text-amber" />
                <p className="text-[12px] font-medium text-foreground">
                  {cameraState === "idle" ? "Camera Off" : errorMessage || "Camera Error"}
                </p>
                {cameraState === "idle" && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Click "Start Camera" to begin using your system camera
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-amber" />
          </div>
        )}

        {capturedImage ? (
          <div className="border-t border-hairline p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">Last Capture</span>
              <div className="flex gap-1">
                <GhostButton size="sm" onClick={() => setCapturedImage(null)}>
                  <X className="size-3" /> Clear
                </GhostButton>
                <AmberButton size="sm" onClick={downloadCapture}>
                  Download
                </AmberButton>
              </div>
            </div>
            <img src={capturedImage} alt="Captured" className="max-h-[120px] w-auto rounded-md border border-hairline" />
          </div>
        ) : (
          <div className="p-4 text-center text-[11px] text-muted-foreground">
            {cameraState === "active"
              ? "Click Capture to take a photo. Vision features will be available in Phase 2."
              : "Start the camera to capture images."}
          </div>
        )}
      </Panel>

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Camera} label="Cameras" value={stats.cameras} hint={cameraState === "active" ? "Active" : "Not started"} />
        <StatCard icon={Eye} label="Detections" value={stats.detections} hint="Vision engine required" tone="ok" />
        <StatCard icon={ScanFace} label="Objects Tracked" value={stats.tracked} hint="Vision engine required" tone="info" />
        <StatCard icon={Zap} label="Inference" value={stats.inference} hint="Not connected" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search captures..."
        selects={[["All Tasks", "Detect", "OCR", "Track", "Count"]]}
      />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No captures available</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Captured images and detection results will appear here once the camera is active.
        </p>
      </Panel>
    </AppShell>
  );
}

function VisionRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Detected Objects" action="Clear" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No detection results are available yet.</p>
          <p>Object detection will be available in Phase 2.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Vision Pipeline" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Vision pipeline stats will appear once a camera source is active.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Events" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No vision events have been recorded yet.</p>
        </div>
      </Panel>
    </>
  );
}

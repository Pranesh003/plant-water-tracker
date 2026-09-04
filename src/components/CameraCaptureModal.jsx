import { Camera, Check, RefreshCw, SwitchCamera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment"); // "environment" (rear) or "user" (front)
  const [capturedImage, setCapturedImage] = useState(null); // Data URL preview
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
      setCameraError("");
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError("");
    setIsCameraStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported in this browser or context.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. Please grant camera permission or use photo upload.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `plant_camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          setCapturedBlob(file);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedBlob, capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(8px)"
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          background: "#0f172a",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.2)",
                display: "grid",
                placeItems: "center",
                color: "#4ade80"
              }}
            >
              <Camera size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "#ffffff", fontWeight: 800 }}>
                Live Camera Capture
              </h3>
              <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                Position plant or leaf inside viewfinder frame
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#ffffff",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 400,
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          {cameraError ? (
            <div style={{ padding: 24, textAlign: "center", color: "#f87171" }}>
              <p style={{ margin: "0 0 12px", fontSize: "0.94rem", fontWeight: 600 }}>{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.86rem",
                  fontWeight: 700
                }}
              >
                Retry Camera Connection
              </button>
            </div>
          ) : capturedImage ? (
            /* Captured Snapshot Preview */
            <img
              src={capturedImage}
              alt="Captured plant snapshot"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            /* Live Video Stream with Viewfinder Target */
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none"
                }}
              />

              {/* Viewfinder Target Graphic */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 240,
                  height: 240,
                  border: "2px dashed rgba(74, 222, 128, 0.8)",
                  borderRadius: 20,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#4ade80",
                    background: "rgba(15, 23, 42, 0.8)",
                    padding: "4px 10px",
                    borderRadius: 10,
                    fontWeight: 700,
                    border: "1px solid rgba(74, 222, 128, 0.4)"
                  }}
                >
                  🌿 Focus Plant Leaf Here
                </span>
              </div>
            </>
          )}

          {isCameraStarting && (
            <div style={{ position: "absolute", color: "#4ade80", fontWeight: 700, fontSize: "0.9rem" }}>
              Starting Camera Feed...
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div
          style={{
            padding: "20px",
            background: "#0f172a",
            display: "flex",
            justify: "center",
            alignItems: "center",
            gap: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <RefreshCw size={16} /> Retake
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "#ffffff",
                  fontWeight: 850,
                  fontSize: "0.92rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(22, 163, 74, 0.4)"
                }}
              >
                <Check size={18} /> Use This Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch Camera (Front / Back)"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  border: "none",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer"
                }}
              >
                <SwitchCamera size={20} />
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={Boolean(cameraError || isCameraStarting)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  borderRadius: 50,
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#ffffff",
                  fontWeight: 850,
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(34, 197, 94, 0.4)"
                }}
              >
                <Camera size={20} /> Snap Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Permission Requester Component for JANUARY
 *
 * Requests and manages essential permissions for JANUARY's voice and vision features:
 * - Microphone access for voice commands and wake word detection
 * - Camera access for vision control and image capture
 * - System notifications for AI responses and alerts
 */

import { useEffect, useState, useCallback } from "react";
import { Mic, Camera, Bell, Check, X, Shield, Loader2 } from "lucide-react";

export interface PermissionStatus {
  microphone: PermissionState;
  camera: PermissionState;
  notifications: PermissionState;
}

export interface PermissionRequesterProps {
  onPermissionsGranted?: (permissions: PermissionStatus) => void;
  autoRequest?: boolean;
  showUI?: boolean;
}

export function PermissionRequester({
  onPermissionsGranted,
  autoRequest = true,
  showUI = true,
}: PermissionRequesterProps) {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: "prompt",
    camera: "prompt",
    notifications: "prompt",
  });
  const [requesting, setRequesting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Check permission status
  const checkPermissions = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      console.warn("[Permissions] Permissions API not available");
      return;
    }

    const newPermissions: PermissionStatus = {
      microphone: "prompt",
      camera: "prompt",
      notifications: "prompt",
    };

    try {
      // Check microphone permission
      const micResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
      newPermissions.microphone = micResult.state;

      // Listen for changes
      micResult.addEventListener("change", () => {
        setPermissions(prev => ({ ...prev, microphone: micResult.state }));
      });
    } catch (error) {
      console.log("[Permissions] Cannot check microphone permission:", error);
      // Keep default "prompt" state
    }

    try {
      // Check camera permission
      const camResult = await navigator.permissions.query({ name: "camera" as PermissionName });
      newPermissions.camera = camResult.state;

      camResult.addEventListener("change", () => {
        setPermissions(prev => ({ ...prev, camera: camResult.state }));
      });
    } catch (error) {
      console.log("[Permissions] Cannot check camera permission:", error);
      // Keep default "prompt" state
    }

    try {
      // Check notification permission
      const notifResult = await navigator.permissions.query({ name: "notifications" as PermissionName });
      newPermissions.notifications = notifResult.state;

      notifResult.addEventListener("change", () => {
        setPermissions(prev => ({ ...prev, notifications: notifResult.state }));
      });
    } catch (error) {
      console.log("[Permissions] Cannot check notifications permission:", error);
      // Keep default "prompt" state
    }

    try {
      setPermissions(newPermissions);
      onPermissionsGranted?.(newPermissions);
    } catch (error) {
      console.error("[Permissions] Error setting permissions:", error);
    }
  }, [onPermissionsGranted]);

  // Request microphone permission
  const requestMicrophone = async () => {
    setRequesting("microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("[Permissions] Microphone permission granted");
      await checkPermissions();
    } catch (error) {
      console.error("[Permissions] Microphone permission denied:", error);
    } finally {
      setRequesting(null);
    }
  };

  // Request camera permission
  const requestCamera = async () => {
    setRequesting("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("[Permissions] Camera permission granted");
      await checkPermissions();
    } catch (error) {
      console.error("[Permissions] Camera permission denied:", error);
    } finally {
      setRequesting(null);
    }
  };

  // Request notification permission
  const requestNotifications = async () => {
    setRequesting("notifications");
    try {
      const result = await Notification.requestPermission();
      console.log("[Permissions] Notification permission:", result);
      await checkPermissions();
    } catch (error) {
      console.error("[Permissions] Notification permission error:", error);
    } finally {
      setRequesting(null);
    }
  };

  // Request all permissions
  const requestAll = async () => {
    await requestMicrophone();
    await requestCamera();
    await requestNotifications();
  };

  // Check permissions on mount
  useEffect(() => {
    if (!mounted) return;
    checkPermissions();
  }, [checkPermissions, mounted]);

  // Auto-request if enabled and permissions are pending
  useEffect(() => {
    if (autoRequest && !dismissed) {
      const hasPending = Object.values(permissions).some(p => p === "prompt");
      if (hasPending) {
        // Small delay before auto-requesting
        const timer = setTimeout(() => {
          try {
            requestAll();
          } catch (error) {
            console.error("[PermissionRequester] Error auto-requesting permissions:", error);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoRequest, permissions, dismissed]);

  if (!showUI || dismissed) return null;

  const allGranted = Object.values(permissions).every(p => p === "granted");
  const someDenied = Object.values(permissions).some(p => p === "denied");

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${allGranted ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
      <div className="glass-panel rounded-lg p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="size-4 text-amber" />
          <h3 className="text-sm font-semibold text-foreground">January Permissions</h3>
        </div>

        <p className="mb-4 text-[11px] text-muted-foreground">
          January needs access to these features for voice commands and vision control:
        </p>

        {/* Permission items */}
        <div className="space-y-2">
          {/* Microphone */}
          <div className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Mic className={`size-3.5 ${permissions.microphone === "granted" ? "text-green-500" : permissions.microphone === "denied" ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className="text-[11px] font-medium text-foreground">Microphone</p>
                <p className="text-[9px] text-muted-foreground">Voice commands & wake word</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {permissions.microphone === "granted" ? (
                <Check className="size-3.5 text-green-500" />
              ) : permissions.microphone === "denied" ? (
                <X className="size-3.5 text-red-500" />
              ) : requesting === "microphone" ? (
                <Loader2 className="size-3.5 animate-spin text-amber" />
              ) : (
                <button
                  onClick={requestMicrophone}
                  className="text-[9px] text-amber hover:underline"
                >
                  Allow
                </button>
              )}
            </div>
          </div>

          {/* Camera */}
          <div className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Camera className={`size-3.5 ${permissions.camera === "granted" ? "text-green-500" : permissions.camera === "denied" ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className="text-[11px] font-medium text-foreground">Camera</p>
                <p className="text-[9px] text-muted-foreground">Vision control & capture</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {permissions.camera === "granted" ? (
                <Check className="size-3.5 text-green-500" />
              ) : permissions.camera === "denied" ? (
                <X className="size-3.5 text-red-500" />
              ) : requesting === "camera" ? (
                <Loader2 className="size-3.5 animate-spin text-amber" />
              ) : (
                <button
                  onClick={requestCamera}
                  className="text-[9px] text-amber hover:underline"
                >
                  Allow
                </button>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Bell className={`size-3.5 ${permissions.notifications === "granted" ? "text-green-500" : permissions.notifications === "denied" ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className="text-[11px] font-medium text-foreground">Notifications</p>
                <p className="text-[9px] text-muted-foreground">AI alerts & responses</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {permissions.notifications === "granted" ? (
                <Check className="size-3.5 text-green-500" />
              ) : permissions.notifications === "denied" ? (
                <X className="size-3.5 text-red-500" />
              ) : requesting === "notifications" ? (
                <Loader2 className="size-3.5 animate-spin text-amber" />
              ) : (
                <button
                  onClick={requestNotifications}
                  className="text-[9px] text-amber hover:underline"
                >
                  Allow
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={requestAll}
            disabled={requesting !== null || allGranted}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-amber/10 text-[11px] font-medium text-amber transition-colors hover:bg-amber/20 disabled:opacity-50"
          >
            {requesting ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Requesting...
              </>
            ) : (
              "Allow All"
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="h-8 rounded-md border border-hairline bg-secondary/40 px-3 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/60"
          >
            Later
          </button>
        </div>

        {/* Info message */}
        {someDenied && (
          <p className="mt-2 text-[9px] text-amber">
            Some permissions were denied. You can enable them in browser settings.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Permission manager hook
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: "prompt",
    camera: "prompt",
    notifications: "prompt",
  });

  const checkPermissions = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return permissions;
    }

    const newPermissions: PermissionStatus = { ...permissions };

    try {
      const micResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
      newPermissions.microphone = micResult.state;
    } catch (error) {
      console.log("[usePermissions] Cannot check microphone permission");
    }

    try {
      const camResult = await navigator.permissions.query({ name: "camera" as PermissionName });
      newPermissions.camera = camResult.state;
    } catch (error) {
      console.log("[usePermissions] Cannot check camera permission");
    }

    try {
      const notifResult = await navigator.permissions.query({ name: "notifications" as PermissionName });
      newPermissions.notifications = notifResult.state;
    } catch (error) {
      console.log("[usePermissions] Cannot check notifications permission");
    }

    setPermissions(newPermissions);
    return newPermissions;
  }, [permissions]);

  const requestPermission = useCallback(async (type: "microphone" | "camera" | "notifications") => {
    switch (type) {
      case "microphone":
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          return false;
        }
      case "camera":
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          return false;
        }
      case "notifications":
        try {
          const result = await Notification.requestPermission();
          return result === "granted";
        } catch (error) {
          return false;
        }
      default:
        return false;
    }
  }, []);

  return {
    permissions,
    checkPermissions,
    requestPermission,
    allGranted: Object.values(permissions).every(p => p === "granted"),
    someGranted: Object.values(permissions).some(p => p === "granted"),
  };
}

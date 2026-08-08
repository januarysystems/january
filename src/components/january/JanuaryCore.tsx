import { Environment, Float, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, Suspense, type ReactNode, useMemo, useRef } from "react";
import * as THREE from "three";

import coreModel from "@/assets/january-core.glb.asset.json";

export type CoreState = "idle" | "listening" | "thinking" | "speaking" | "success" | "error";

/** Per-state motion + light treatment for the AI core. */
export const CORE_STATES: Record<
  CoreState,
  { label: string; color: string; spin: number; pulse: number; intensity: number }
> = {
  idle: { label: "Idle", color: "#f5a524", spin: 0.12, pulse: 0.015, intensity: 1.1 },
  listening: { label: "Listening", color: "#f5c451", spin: 0.3, pulse: 0.05, intensity: 1.8 },
  thinking: { label: "Thinking", color: "#8b7cf6", spin: 0.75, pulse: 0.035, intensity: 2.2 },
  speaking: { label: "Speaking", color: "#f59e0b", spin: 0.45, pulse: 0.08, intensity: 2.4 },
  success: { label: "Success", color: "#34d399", spin: 0.22, pulse: 0.03, intensity: 2.6 },
  error: { label: "Error", color: "#f87171", spin: 0.9, pulse: 0.09, intensity: 2.6 },
};

function CoreModel({ state }: { state: CoreState }) {
  const { scene } = useGLTF(coreModel.url);
  const group = useRef<THREE.Group>(null);
  const cfg = CORE_STATES[state];

  const model = useMemo(() => scene.clone(true), [scene]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * cfg.spin;
    const t = performance.now() / 1000;
    const s = 1 + Math.sin(t * (state === "thinking" ? 6 : 3)) * cfg.pulse;
    g.scale.setScalar(s * 1.35);
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

function FallbackCoreModel() {
  return (
    <mesh>
      <icosahedronGeometry args={[1.35, 3]} />
      <meshStandardMaterial color="#f5a524" metalness={0.4} roughness={0.2} />
    </mesh>
  );
}

class JanuaryCoreErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("JanuaryCore failed to load", error);
  }

  render() {
    return this.state.hasError ? <FallbackCoreModel /> : this.props.children;
  }
}

export function JanuaryCore({ state = "idle" }: { state?: CoreState }) {
  const cfg = CORE_STATES[state];

  return (
    <Canvas
      camera={{ position: [0, 1.4, 5], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      className="size-full"
    >
      <color attach="background" args={["#070707"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 4]} intensity={cfg.intensity * 12} color={cfg.color} />
      <pointLight position={[-4, -2, -3]} intensity={cfg.intensity * 6} color={cfg.color} />
      <Suspense fallback={<FallbackCoreModel />}>
        <JanuaryCoreErrorBoundary>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
            <CoreModel state={state} />
          </Float>
        </JanuaryCoreErrorBoundary>
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}

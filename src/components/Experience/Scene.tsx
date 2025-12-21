import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { SlotMachine } from "./SlotMachine";
import { Room, SwingingLamp } from "./Room";

const SceneContent = () => {
  // SlotMachine positioned so its center (around reels) is at origin
  const slotMachinePosition: [number, number, number] = [0, 0, 0];

  return (
    <>
      {/* Ambient light for overall visibility */}
      <ambientLight intensity={0.4} color="#c0b0a0" />

      {/* Camera controls - target is the center of the slot machine (reel area) */}
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        target={[0, 0.35, 0]}
      />

      {/* Concrete bunker room */}
      <Room size={[10, 6, 10]} />

      {/* Swinging ceiling lamp */}
      <SwingingLamp position={[0, 3.5, 0.5]} />

      {/* Slot machine */}
      <SlotMachine position={slotMachinePosition} />

      {/* Floor under the machine */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Secondary fill light from back corner */}
      <pointLight
        position={[-3, 2, -3]}
        intensity={1}
        distance={12}
        color="#8899aa"
      />

      {/* Additional front fill light */}
      <pointLight
        position={[2, 1.5, 3]}
        intensity={0.6}
        distance={10}
        color="#aabbcc"
      />
    </>
  );
};

export const Scene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 5], fov: 50 }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#0a0a0a",
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
};

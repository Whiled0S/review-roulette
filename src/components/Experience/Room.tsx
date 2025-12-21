import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RoomProps {
  size?: [number, number, number]; // width, height, depth
}

/**
 * Concrete bunker room with floor, walls and ceiling
 */
export const Room = ({ size = [8, 5, 8] }: RoomProps) => {
  const [width, height, depth] = size;

  // Concrete material settings
  const concreteColor = "#4a4a4a";
  const floorColor = "#3a3a3a";

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={floorColor}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, height - 1.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={concreteColor}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, height / 2 - 1.5, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={concreteColor}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-width / 2, height / 2 - 1.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color={concreteColor}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[width / 2, height / 2 - 1.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color={concreteColor}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
};

interface SwingingLampProps {
  position?: [number, number, number];
}

/**
 * Swinging ceiling lamp with spotlight
 */
export const SwingingLamp = ({ position = [0, 3, 0] }: SwingingLampProps) => {
  const lampRef = useRef<THREE.Group>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const cordLength = 0.8;

  useFrame(({ clock }) => {
    if (!lampRef.current) return;
    const t = clock.getElapsedTime();

    // Gentle swinging motion
    lampRef.current.rotation.x = Math.sin(t * 0.8) * 0.08;
    lampRef.current.rotation.z = Math.cos(t * 0.6) * 0.06;

    // Update spotlight target
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.target = targetRef.current;
    }
  });

  return (
    <group position={position}>
      {/* Spotlight target (on the table below) */}
      <object3D ref={targetRef} position={[0, -5, 0]} />

      {/* Ceiling mount */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Swinging group */}
      <group ref={lampRef}>
        {/* Cord */}
        <mesh position={[0, -cordLength / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, cordLength, 8]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Lamp shade */}
        <mesh position={[0, -cordLength - 0.1, 0]}>
          <coneGeometry args={[0.2, 0.15, 16, 1, true]} />
          <meshStandardMaterial
            color="#2d3a2d"
            metalness={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Lamp cap */}
        <mesh position={[0, -cordLength - 0.02, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.06, 12]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>

        {/* Light bulb */}
        <mesh position={[0, -cordLength - 0.12, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color="#fff8e7"
            emissive="#ffcc66"
            emissiveIntensity={3}
          />
        </mesh>

        {/* Spotlight - main directional light */}
        <spotLight
          ref={spotLightRef}
          position={[0, -cordLength - 0.15, 0]}
          angle={1.1}
          penumbra={0.5}
          intensity={150}
          distance={15}
          color="#ffdd88"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Point light for ambient room glow */}
        <pointLight
          position={[0, -cordLength - 0.12, 0]}
          intensity={8}
          distance={12}
          color="#ffee99"
          decay={2}
        />
      </group>
    </group>
  );
};

interface TableProps {
  position?: [number, number, number];
  size?: [number, number, number]; // width, height, depth
}

/**
 * Simple wooden/metal table
 */
export const Table = ({
  position = [0, 0, 0],
  size = [2.5, 0.9, 1.2],
}: TableProps) => {
  const [width, height, depth] = size;
  const legThickness = 0.08;
  const topThickness = 0.06;
  const tableColor = "#3d3529";
  const legColor = "#2a2a2a";

  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial
          color={tableColor}
          metalness={0.15}
          roughness={0.85}
        />
      </mesh>

      {/* Metal edge trim */}
      <mesh position={[0, height - topThickness / 2, depth / 2]}>
        <boxGeometry args={[width + 0.02, topThickness + 0.02, 0.02]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Legs */}
      {[
        [-(width / 2 - 0.1), height / 2, -(depth / 2 - 0.1)],
        [width / 2 - 0.1, height / 2, -(depth / 2 - 0.1)],
        [-(width / 2 - 0.1), height / 2, depth / 2 - 0.1],
        [width / 2 - 0.1, height / 2, depth / 2 - 0.1],
      ].map(([x, y, z], i) => (
        <mesh key={`leg-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[legThickness, height, legThickness]} />
          <meshStandardMaterial
            color={legColor}
            metalness={0.7}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Cross support beams */}
      <mesh position={[0, height * 0.3, 0]}>
        <boxGeometry args={[width - 0.3, 0.04, 0.04]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.7}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, height * 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depth - 0.3, 0.04, 0.04]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.7}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
};

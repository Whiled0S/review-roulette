import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SparksProps {
  position?: [number, number, number];
  active: boolean;
  count?: number;
}

interface SparkData {
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  life: number;
}

/**
 * Sparks as small rectangles flying from reels
 */
export const Sparks = ({ position = [0, 0, 0], active, count = 12 }: SparksProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const sparkData = useRef<SparkData[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    for (let i = 0; i < count; i++) {
      sparkData.current.push({
        vx: 0,
        vy: 0,
        vz: 0,
        rotSpeed: 0,
        life: (i / count) * 0.5, // staggered start
      });
    }
  }, [count]);

  useFrame((_, delta) => {
    if (!initialized.current) return;

    if (!active) {
      meshRefs.current.forEach((mesh) => {
        if (mesh) mesh.visible = false;
      });
      return;
    }

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const data = sparkData.current[i];
      if (!data) return;

      data.life -= delta * 3; // faster decay

      if (data.life <= 0) {
        // Reset spark
        data.life = 0.4 + (i % 3) * 0.15; // short life 0.4-0.7s

        // Determine side: even index = left, odd = right
        const side = i % 2 === 0 ? -1 : 1;

        // Start at sides of reel
        mesh.position.x = side * 0.12 + ((i % 3) - 1) * 0.02;
        mesh.position.y = ((i % 7) / 7 - 0.5) * 0.25;
        mesh.position.z = 0.05;

        // Velocity at ~30° angle from Z axis
        // sin(30°) ≈ 0.5, cos(30°) ≈ 0.866
        const speed = 0.025 + (i % 4) * 0.008;
        data.vx = side * speed * 0.5; // X component (sin 30°)
        data.vy = ((i % 5) / 5 - 0.3) * 0.012 + 0.008;
        data.vz = speed * 0.866; // Z component (cos 30°)

        // Random rotation speed
        data.rotSpeed = ((i % 7) - 3) * 5;

        mesh.visible = true;
      }

      // Move spark
      mesh.position.x += data.vx;
      mesh.position.y += data.vy;
      mesh.position.z += data.vz;

      // Gravity pulls down
      data.vy -= delta * 0.06;

      // Slow down Z velocity (air resistance)
      data.vz *= 0.98;

      // Rotate the spark
      mesh.rotation.z += data.rotSpeed * delta;
      mesh.rotation.x += data.rotSpeed * 0.5 * delta;

      // Fade out
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(data.life * 2, 0.95);

      // Shrink slightly
      const scale = 0.5 + data.life * 0.5;
      mesh.scale.set(scale, scale, 1);
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <planeGeometry args={[0.04, 0.015]} />
          <meshBasicMaterial
            color="#ffcc44"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

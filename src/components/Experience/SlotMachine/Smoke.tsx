import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SmokeProps {
  position?: [number, number, number];
  active: boolean;
  count?: number;
}

interface SmokeParticle {
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  size: number;
  colorShade: number;
}

/**
 * Realistic smoke particles rising from exhaust pipe
 */
export const Smoke = ({ position = [0, 0, 0], active, count = 25 }: SmokeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const particleData = useRef<SmokeParticle[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    for (let i = 0; i < count; i++) {
      particleData.current.push({
        vx: 0,
        vy: 0,
        vz: 0,
        rotSpeed: 0,
        life: (i / count) * 0.2,
        maxLife: 1,
        size: 1,
        colorShade: 0.3 + (i % 5) * 0.08,
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

    const time = Date.now() * 0.001;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const data = particleData.current[i];
      if (!data) return;

      data.life -= delta * 0.6;

      if (data.life <= 0) {
        // Reset smoke particle
        data.life = 1.2 + (i % 5) * 0.2;
        data.maxLife = data.life;

        // Start at pipe opening with slight spread
        mesh.position.x = ((i % 3) - 1) * 0.015;
        mesh.position.y = 0;
        mesh.position.z = ((i % 5) / 5 - 0.5) * 0.015;

        // Initial velocity - upward with some turbulence
        const turbulence = 0.008;
        data.vx = -0.008 + ((i % 7) / 7 - 0.5) * turbulence;
        data.vy = 0.025 + (i % 4) * 0.006;
        data.vz = ((i % 5) / 5 - 0.5) * turbulence;

        // Rotation
        data.rotSpeed = ((i % 5) - 2) * 0.5;

        // Size variation
        data.size = 0.04 + (i % 4) * 0.02;

        // Color variation (different shades of gray)
        data.colorShade = 0.35 + (i % 6) * 0.06;

        mesh.visible = true;
      }

      // Add turbulence over time
      const turbX = Math.sin(time * 2 + i * 0.5) * 0.002;
      const turbZ = Math.cos(time * 1.5 + i * 0.7) * 0.002;

      data.vx += turbX * delta;
      data.vz += turbZ * delta;

      // Move particle
      mesh.position.x += data.vx;
      mesh.position.y += data.vy;
      mesh.position.z += data.vz;

      // Rotate
      mesh.rotation.x += data.rotSpeed * delta;
      mesh.rotation.z += data.rotSpeed * 0.7 * delta;

      // Slow down and buoyancy effect
      data.vx *= 0.995;
      data.vz *= 0.995;
      data.vy *= 0.998; // Slight slowdown as it rises

      // Calculate life ratio
      const lifeRatio = data.life / data.maxLife;

      // Smooth fade: fast in, slow out
      const fadeIn = Math.min(1, (1 - lifeRatio) * 5);
      const fadeOut = lifeRatio;
      const opacity = fadeIn * fadeOut * 0.45;

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity;

      // Update color to get lighter as it dissipates
      const shade = data.colorShade + (1 - lifeRatio) * 0.15;
      mat.color.setRGB(shade, shade, shade);

      // Grow as it rises (puff expansion)
      const growthFactor = 1 + (1 - lifeRatio) * 3;
      const scale = data.size * growthFactor;
      mesh.scale.setScalar(scale);
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
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#666666"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

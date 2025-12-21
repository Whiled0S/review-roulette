import { useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useGameStore } from "../../../store/gameStore";

interface LeverProps {
  onPull: () => void;
  onImpact?: () => void;
}

export interface LeverHandle {
  pull: () => void;
}

export const Lever = forwardRef<LeverHandle, LeverProps>(
  ({ onPull, onImpact }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const isSpinning = useGameStore((state) => state.isSpinning);

    const animatePull = () => {
      if (isSpinning || !groupRef.current) return;

      let impactTriggered = false;

      gsap.to(groupRef.current.rotation, {
        z: -0.9,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          onPull();
          gsap.to(groupRef.current!.rotation, {
            z: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.5)",
            onUpdate: function () {
              // Trigger impact once when lever first crosses zero
              if (!impactTriggered) {
                const rotation = groupRef.current?.rotation.z ?? -1;
                if (rotation > -0.1) {
                  impactTriggered = true;
                  onImpact?.();
                }
              }
            },
          });
        },
      });
    };

    // Expose pull method to parent
    useImperativeHandle(ref, () => ({
      pull: animatePull,
    }));

    const handleClick = () => {
      animatePull();
    };

    // Bigger lever dimensions
    const armRadius = 0.065;
    const armHeight = 1.5;
    const handleRadius = 0.11;
    const gripRadius = 0.085;

    return (
      <group ref={groupRef}>
        {/* Lever base housing - bigger */}
        <mesh position={[0, -0.82, 0]} castShadow>
          <boxGeometry args={[0.22, 0.1, 0.22]} />
          <meshStandardMaterial
            color="#2b2f2a"
            metalness={0.8}
            roughness={0.55}
          />
        </mesh>

        {/* Base bolts */}
        {[
          [-0.08, -0.77, 0.08],
          [0.08, -0.77, 0.08],
          [-0.08, -0.77, -0.08],
          [0.08, -0.77, -0.08],
        ].map(([x, y, z], i) => (
          <mesh
            key={`bolt-${i}`}
            position={[x, y, z]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.015, 0.025, 10]} />
            <meshStandardMaterial
              color="#0d0f0d"
              metalness={1}
              roughness={0.35}
            />
          </mesh>
        ))}

        {/* Lever arm - thicker and taller */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[armRadius, armRadius, armHeight, 16]} />
          <meshStandardMaterial
            color="#3a3f3a"
            metalness={0.9}
            roughness={0.35}
          />
        </mesh>

        {/* Grip sleeve - bigger */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[gripRadius, gripRadius, 0.32, 16]} />
          <meshStandardMaterial
            color="#151716"
            metalness={0.2}
            roughness={0.95}
          />
        </mesh>

        {/* Lever handle cap (click target) - bigger */}
        <mesh
          position={[0, 0.9, 0]}
          onClick={handleClick}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
          castShadow
        >
          <cylinderGeometry args={[handleRadius, handleRadius, 0.15, 18]} />
          <meshStandardMaterial
            color={isSpinning ? "#3a3f3a" : "#b1121a"}
            metalness={0.35}
            roughness={0.45}
            emissive={isSpinning ? "#000000" : "#ff2b2b"}
            emissiveIntensity={isSpinning ? 0 : 0.5}
          />
        </mesh>

        {/* Glow when active */}
        {!isSpinning && (
          <pointLight
            position={[0, 0.9, 0.15]}
            intensity={0.25}
            distance={0.5}
            color="#ff3333"
          />
        )}
      </group>
    );
  },
);

Lever.displayName = "Lever";

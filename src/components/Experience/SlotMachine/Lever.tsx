import { useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useGameStore } from "../../../store/gameStore";

interface LeverProps {
  onPull: () => void;
}

export const Lever = ({ onPull }: LeverProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const isSpinning = useGameStore((state) => state.isSpinning);

  const handleClick = () => {
    if (isSpinning || !groupRef.current) return;

    gsap.to(groupRef.current.rotation, {
      z: -0.8,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        onPull();
        gsap.to(groupRef.current!.rotation, {
          z: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)",
        });
      },
    });
  };

  return (
    <group ref={groupRef}>
      {/* Lever base plate */}
      <mesh position={[0, -0.7, 0]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lever arm */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.3, 16]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lever handle */}
      <mesh
        position={[0, 0.75, 0]}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
        castShadow
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial
          color={isSpinning ? "#4a4a4a" : "#e74c3c"}
          metalness={0.7}
          roughness={0.2}
          emissive={isSpinning ? "#000000" : "#e74c3c"}
          emissiveIntensity={isSpinning ? 0 : 0.5}
        />
      </mesh>
    </group>
  );
};

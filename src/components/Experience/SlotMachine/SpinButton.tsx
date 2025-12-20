import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

interface SpinButtonProps {
  enabled: boolean;
  onPress: () => void;
  position?: [number, number, number];
  width?: number;
}

export const SpinButton = ({
  enabled,
  onPress,
  position = [0, 0, 0],
  width = 0.8,
}: SpinButtonProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Mesh>(null);

  // Adaptive sizing based on width
  const buttonWidth = width * 0.85;
  const buttonHeight = Math.max(0.18, width * 0.15);
  const buttonDepth = 0.08;
  const housingPadding = 0.08;

  useFrame(({ clock }) => {
    if (!capRef.current) return;
    const t = clock.getElapsedTime();

    const pulse = enabled ? 0.6 + Math.sin(t * 5) * 0.4 : 0;
    const mat = capRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = pulse;
  });

  const handleClick = () => {
    if (!enabled || !groupRef.current) return;

    gsap.to(groupRef.current.position, {
      z: position[2],
      duration: 0.08,
      ease: "power2.out",
      onComplete: () => {
        onPress();
        gsap.to(groupRef.current!.position, {
          z: position[2],
          duration: 0.2,
          ease: "elastic.out(1, 0.55)",
        });
      },
    });
  };

  const capColor = enabled ? "#a00d14" : "#3d3d3d";
  const capEmissive = enabled ? "#ff1a1a" : "#000000";

  return (
    <group ref={groupRef} position={position}>
      {/* Button housing */}
      <RoundedBox
        args={[
          buttonWidth + housingPadding,
          buttonHeight + housingPadding,
          buttonDepth,
        ]}
        radius={0.025}
        smoothness={4}
      >
        <meshStandardMaterial color="#1f241e" metalness={0.8} roughness={0.5} />
      </RoundedBox>

      {/* Button cap */}
      <RoundedBox
        ref={capRef}
        args={[buttonWidth, buttonHeight, buttonDepth * 0.7]}
        radius={0.02}
        smoothness={4}
        position={[0, 0, buttonDepth * 0.45]}
        onClick={handleClick}
        onPointerOver={() =>
          (document.body.style.cursor = enabled ? "pointer" : "default")
        }
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <meshStandardMaterial
          color={capColor}
          metalness={0.25}
          roughness={0.45}
          emissive={capEmissive}
          emissiveIntensity={0}
        />
      </RoundedBox>

      {/* Button label */}
      <Text
        position={[0, 0, buttonDepth * 0.9]}
        fontSize={Math.max(0.065, buttonWidth * 0.09)}
        color="#f8f4e3"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.005}
        outlineColor="#0a0a0a"
      >
        РЕВЬЮ
      </Text>

      {/* Glow when enabled */}
      {enabled && (
        <pointLight
          position={[0, 0, 0.15]}
          intensity={0.4}
          distance={0.6}
          color="#ff3333"
        />
      )}
    </group>
  );
};

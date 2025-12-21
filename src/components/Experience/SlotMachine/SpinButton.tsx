import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
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

  // Button states: raised (enabled) vs pressed (spinning)
  const raisedZ = buttonDepth * 0.8; // Выпуклая - готова к нажатию
  const pressedZ = buttonDepth * 0.35; // Вжата в корпус

  // Animate button state when enabled changes
  useEffect(() => {
    if (!capRef.current) return;

    gsap.to(capRef.current.position, {
      z: enabled ? raisedZ : pressedZ,
      duration: 0.3,
      ease: enabled ? "back.out(2)" : "power2.out",
    });
  }, [enabled, raisedZ, pressedZ]);

  useFrame(({ clock }) => {
    if (!capRef.current) return;
    const t = clock.getElapsedTime();

    const pulse = enabled ? 0.6 + Math.sin(t * 5) * 0.4 : 0;
    const mat = capRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = pulse;
  });

  const handleClick = () => {
    if (!enabled || !capRef.current) return;

    // Quick press animation
    gsap.to(capRef.current.position, {
      z: pressedZ,
      duration: 0.08,
      ease: "power2.out",
      onComplete: () => {
        onPress();
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

      {/* Button cap - starts raised when enabled */}
      <RoundedBox
        ref={capRef}
        args={[buttonWidth, buttonHeight, buttonDepth * 0.7]}
        radius={0.02}
        smoothness={4}
        position={[0, 0, enabled ? raisedZ : pressedZ]}
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

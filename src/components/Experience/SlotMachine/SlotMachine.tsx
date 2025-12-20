import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../../../store/gameStore";
import { Reel } from "./Reel";
import { Lever } from "./Lever";

interface SlotMachineProps {
  position?: [number, number, number];
}

export const SlotMachine = ({ position = [0, 0, 0] }: SlotMachineProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const spin = useGameStore((state) => state.spin);
  const developers = useGameStore((state) => state.developers);
  const winnerCount = useGameStore((state) => state.winnerCount);
  const pendingWinners = useGameStore((state) => state.pendingWinners);

  const basePositionRef = useRef(new THREE.Vector3(...position));
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1));

  const reelPositions = useMemo(() => {
    const reelSpacing = 0.62;
    const positions: [number, number, number][] = [];

    for (let i = 0; i < winnerCount; i++) {
      const offset = (i - (winnerCount - 1) / 2) * reelSpacing;
      positions.push([offset, 0.5, 0.4]);
    }

    return positions;
  }, [winnerCount]);

  const dividerPositions = useMemo(() => {
    if (winnerCount <= 1) return [];

    const positions: number[] = [];
    const reelSpacing = 0.62;

    for (let i = 0; i < winnerCount - 1; i++) {
      const leftReel = (i - (winnerCount - 1) / 2) * reelSpacing;
      const rightReel = (i + 1 - (winnerCount - 1) / 2) * reelSpacing;
      positions.push((leftReel + rightReel) / 2);
    }

    return positions;
  }, [winnerCount]);

  const machineWidth = 0.9 + winnerCount * 0.55;
  const screenWidth = 0.4 + winnerCount * 0.48;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isSpinning) {
      const time = state.clock.elapsedTime;
      const shakeIntensity = 0.01;
      const pulseIntensity = 0.01;

      groupRef.current.position.x =
        basePositionRef.current.x + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.y =
        basePositionRef.current.y + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.z =
        basePositionRef.current.z +
        (Math.random() - 0.5) * shakeIntensity * 0.5;

      const pulse = 1 + Math.sin(time * 15) * pulseIntensity;
      groupRef.current.scale.setScalar(pulse);
    } else {
      groupRef.current.position.copy(basePositionRef.current);
      groupRef.current.scale.copy(baseScaleRef.current);
    }
  });

  const leverXPosition = (machineWidth + 0.75) / 2 + 0.1;

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <RoundedBox
        args={[machineWidth + 0.75, 2.5, 1.3]}
        radius={0.1}
        smoothness={4}
        position={[0, 0.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* Screen area - recessed dark area */}
      <mesh position={[0, 0.5, 0.56]}>
        <boxGeometry args={[screenWidth + 0.15, 0.75, 0.1]} />
        <meshStandardMaterial color="#0a0a12" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Dynamic reels */}
      {reelPositions.map((pos, index) => (
        <Reel
          key={index}
          position={pos}
          developers={developers}
          targetDeveloper={pendingWinners[index] || null}
          stopDelay={index * 400}
        />
      ))}

      {/* Dividers between reels */}
      {dividerPositions.map((xPos, index) => (
        <mesh key={index} position={[xPos, 0.5, 0.58]}>
          <boxGeometry args={[0.03, 0.65, 0.08]} />
          <meshStandardMaterial
            color="#0a0a12"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Win line indicators */}
      <mesh
        position={[-(screenWidth / 2 + 0.15), 0.5, 0.62]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>
      <mesh
        position={[screenWidth / 2 + 0.15, 0.5, 0.62]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>

      {/* Base */}
      <RoundedBox
        args={[machineWidth + 0.85, 0.2, 1.4]}
        radius={0.04}
        smoothness={4}
        position={[0, -1.15, 0]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Top marquee */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[machineWidth + 0.15, 0.3, 0.85]} />
        <meshStandardMaterial
          color="#c41e3a"
          metalness={0.5}
          roughness={0.4}
          emissive="#c41e3a"
          emissiveIntensity={isSpinning ? 0.6 : 0.25}
        />
      </mesh>

      {/* Marquee text */}
      <Text
        position={[0, 1.6, 0.45]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.004}
        outlineColor="#000000"
      >
        REVIEW ROULETTE
      </Text>

      {/* Top lights */}
      {Array.from({ length: Math.min(5, winnerCount + 2) }).map((_, i) => {
        const spacing = machineWidth / (Math.min(5, winnerCount + 2) + 1);
        const xPos = (i + 1) * spacing - machineWidth / 2;
        return (
          <mesh key={i} position={[xPos, 1.78, 0.28]} castShadow>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={isSpinning ? "#ffeb3b" : "#ff6b6b"}
              emissive={isSpinning ? "#ffeb3b" : "#ff6b6b"}
              emissiveIntensity={isSpinning ? 1.5 : 0.5}
            />
          </mesh>
        );
      })}

      {/* Screen lighting */}
      <pointLight
        position={[0, 0.5, 0.9]}
        intensity={isSpinning ? 0.8 : 0.4}
        distance={1.5}
        color="#ffffff"
      />

      {/* Lever */}
      <group position={[leverXPosition, 0.3, 0]}>
        <Lever onPull={spin} />
      </group>

      {/* Coin slot */}
      <mesh position={[0, -0.35, 0.68]} castShadow>
        <boxGeometry args={[0.35, 0.05, 0.03]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Payout tray */}
      <RoundedBox
        args={[Math.max(0.9, machineWidth * 0.45), 0.3, 0.25]}
        radius={0.02}
        smoothness={4}
        position={[0, -0.8, 0.75]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </RoundedBox>
    </group>
  );
};

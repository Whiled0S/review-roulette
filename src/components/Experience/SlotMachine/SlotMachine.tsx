import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../../../store/gameStore";
import { Reel } from "./Reel";
import { Lever } from "./Lever";
import { SpinButton } from "./SpinButton";

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

  // Dynamic sizing based on winner count
  const machineWidth = 0.9 + winnerCount * 0.55;
  const reelWindowWidth = 0.35 + winnerCount * 0.5;
  const consoleWidth = machineWidth + 0.4;

  const reelPositions = useMemo(() => {
    const reelSpacing = 0.62;
    const positions: [number, number, number][] = [];

    for (let i = 0; i < winnerCount; i++) {
      const offset = (i - (winnerCount - 1) / 2) * reelSpacing;
      positions.push([offset, 0.35, 0.3]);
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

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isSpinning) {
      const time = state.clock.elapsedTime;
      const shakeIntensity = 0.008;
      const pulseIntensity = 0.008;

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

  // Lever closer to the body
  const leverXPosition = (machineWidth + 0.5) / 2 + 0.12;

  return (
    <group ref={groupRef} position={position}>
      {/* ========== MAIN CHASSIS (back body) ========== */}
      <RoundedBox
        args={[machineWidth + 0.5, 2.4, 0.9]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.2, -0.15]}
        castShadow
      >
        <meshStandardMaterial
          color="#2a332a"
          metalness={0.5}
          roughness={0.85}
        />
      </RoundedBox>

      {/* ========== TOP SECTION: CRT SCREEN (attached to chassis) ========== */}
      {/* Screen housing - extends from chassis front */}
      <RoundedBox
        args={[machineWidth + 0.2, 0.5, 0.18]}
        radius={0.035}
        smoothness={4}
        position={[0, 1.15, 0.4]}
        castShadow
      >
        <meshStandardMaterial color="#1a211a" metalness={0.75} roughness={0.55} />
      </RoundedBox>

      {/* Screen bezel */}
      <RoundedBox
        args={[machineWidth + 0.08, 0.4, 0.06]}
        radius={0.025}
        smoothness={4}
        position={[0, 1.15, 0.52]}
      >
        <meshStandardMaterial color="#0d120d" metalness={0.85} roughness={0.4} />
      </RoundedBox>

      {/* Screen display (glowing) */}
      <mesh position={[0, 1.15, 0.56]}>
        <planeGeometry args={[machineWidth - 0.05, 0.3]} />
        <meshStandardMaterial
          color="#031208"
          metalness={0.05}
          roughness={0.4}
          emissive="#00ff55"
          emissiveIntensity={isSpinning ? 0.65 : 0.35}
        />
      </mesh>

      {/* Glass overlay effect */}
      <mesh position={[0, 1.15, 0.565]}>
        <planeGeometry args={[machineWidth - 0.03, 0.32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0.05}
          transparent
          opacity={0.08}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Screen text */}
      <Text
        position={[0, 1.15, 0.57]}
        fontSize={0.09}
        fontWeight="bold"
        color="#b3ffc6"
        anchorX="center"
        anchorY="middle"
        font="/courier-prime.ttf"
        outlineWidth={0.002}
        outlineColor="#001a05"
      >
        {isSpinning ? "...ВЫБИРАЕМ..." : "РЕВЬЮ РУЛЕТКА"}
      </Text>

      {/* Screen glow */}
      <pointLight
        position={[0, 1.15, 0.8]}
        intensity={isSpinning ? 0.9 : 0.5}
        distance={1.8}
        color="#55ff88"
      />

      {/* ========== MIDDLE SECTION: REEL WINDOW ========== */}
      {/* Window frame (dark recessed area for reels) */}
      <RoundedBox
        args={[reelWindowWidth + 0.12, 0.75, 0.15]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.35, 0.28]}
      >
        <meshStandardMaterial color="#080a08" metalness={0.6} roughness={0.5} />
      </RoundedBox>

      {/* Side panels around reel window */}
      <mesh position={[-(reelWindowWidth / 2 + 0.18), 0.35, 0.3]}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
        <meshStandardMaterial
          color="#252d25"
          metalness={0.55}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[reelWindowWidth / 2 + 0.18, 0.35, 0.3]}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
        <meshStandardMaterial
          color="#252d25"
          metalness={0.55}
          roughness={0.8}
        />
      </mesh>

      {/* Win line indicators */}
      <mesh
        position={[-(reelWindowWidth / 2 + 0.08), 0.35, 0.38]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[0.035, 0.08, 3]} />
        <meshStandardMaterial
          color="#ffc800"
          emissive="#ffaa00"
          emissiveIntensity={isSpinning ? 0.9 : 0.25}
        />
      </mesh>
      <mesh
        position={[reelWindowWidth / 2 + 0.08, 0.35, 0.38]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[0.035, 0.08, 3]} />
        <meshStandardMaterial
          color="#ffc800"
          emissive="#ffaa00"
          emissiveIntensity={isSpinning ? 0.9 : 0.25}
        />
      </mesh>

      {/* Reel window lighting */}
      <pointLight
        position={[0, 0.35, 0.7]}
        intensity={isSpinning ? 0.6 : 0.35}
        distance={1.2}
        color="#fffaf0"
      />

      {/* ========== REELS ========== */}
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
        <mesh key={`div-${index}`} position={[xPos, 0.35, 0.42]}>
          <boxGeometry args={[0.025, 0.6, 0.06]} />
          <meshStandardMaterial
            color="#0a0c0a"
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* ========== BOTTOM SECTION: CONSOLE WITH KEYBOARD LEDGE ========== */}
      <group position={[0, -0.55, 0.35]}>
        {/* Main console block */}
        <RoundedBox
          args={[consoleWidth, 0.45, 0.55]}
          radius={0.04}
          smoothness={4}
          position={[0, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#2a332a"
            metalness={0.5}
            roughness={0.85}
          />
        </RoundedBox>

        {/* Angled keyboard ledge */}
        <group position={[0, 0.2, 0.28]} rotation={[-0.3, 0, 0]}>
          <RoundedBox
            args={[consoleWidth - 0.1, 0.1, 0.45]}
            radius={0.025}
            smoothness={4}
            castShadow
          >
            <meshStandardMaterial
              color="#1e251e"
              metalness={0.6}
              roughness={0.7}
            />
          </RoundedBox>

          {/* SPIN BUTTON - raised higher */}
          <SpinButton
            enabled={!isSpinning}
            onPress={spin}
            position={[0, 0.2, 0]}
            width={consoleWidth * 0.55}
          />
        </group>

        {/* Vents on console front */}
        {Array.from({ length: Math.min(10, Math.floor(consoleWidth * 5)) }).map(
          (_, i) => {
            const ventCount = Math.min(10, Math.floor(consoleWidth * 5));
            const ventSpacing = (consoleWidth - 0.3) / ventCount;
            const x = (i - (ventCount - 1) / 2) * ventSpacing;
            return (
              <mesh key={`vent-${i}`} position={[x, -0.08, 0.28]}>
                <boxGeometry args={[0.04, 0.15, 0.015]} />
                <meshStandardMaterial
                  color="#0a0d0a"
                  metalness={0.85}
                  roughness={0.5}
                />
              </mesh>
            );
          },
        )}

        {/* Console edge trim */}
        <mesh position={[0, 0.22, 0.275]}>
          <boxGeometry args={[consoleWidth - 0.05, 0.02, 0.02]} />
          <meshStandardMaterial
            color="#3a4238"
            metalness={0.7}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* ========== BASE PLATE ========== */}
      <RoundedBox
        args={[consoleWidth + 0.15, 0.12, 1.1]}
        radius={0.03}
        smoothness={4}
        position={[0, -0.95, 0.08]}
        castShadow
      >
        <meshStandardMaterial
          color="#1a201a"
          metalness={0.75}
          roughness={0.6}
        />
      </RoundedBox>

      {/* Base feet */}
      {[
        [-(consoleWidth / 2 + 0.02), -1.02, -0.35],
        [consoleWidth / 2 + 0.02, -1.02, -0.35],
        [-(consoleWidth / 2 + 0.02), -1.02, 0.45],
        [consoleWidth / 2 + 0.02, -1.02, 0.45],
      ].map(([fx, fy, fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, fy, fz]}>
          <cylinderGeometry args={[0.06, 0.05, 0.04, 12]} />
          <meshStandardMaterial
            color="#0d100d"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* ========== LEVER (closer and bigger) ========== */}
      <group position={[leverXPosition, 0.1, 0.1]}>
        <Lever onPull={spin} />
      </group>

      {/* ========== DECORATIVE DETAILS ========== */}
      {/* Side rivets/bolts */}
      {[-1, 1].map((side) =>
        [0.9, 0.4, -0.1].map((yPos, i) => (
          <mesh
            key={`rivet-${side}-${i}`}
            position={[side * (machineWidth / 2 + 0.28), yPos, 0.1]}
            rotation={[0, (side * Math.PI) / 2, 0]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.04, 6]} />
            <meshStandardMaterial
              color="#2a2f2a"
              metalness={0.95}
              roughness={0.3}
            />
          </mesh>
        )),
      )}

      {/* Warning label on side */}
      <Text
        position={[machineWidth / 2 + 0.27, 0.6, 0.12]}
        fontSize={0.035}
        color="#8b8b6a"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI / 2, 0]}
        font="/courier-prime.ttf"
      >
        VAULT-TEC
      </Text>
    </group>
  );
};

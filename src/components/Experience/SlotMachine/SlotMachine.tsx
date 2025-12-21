import { useRef, useMemo, useCallback, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useGameStore } from "../../../store/gameStore";
import { Reel } from "./Reel";
import { Lever, type LeverHandle } from "./Lever";
import { SpinButton } from "./SpinButton";
import { Sparks } from "./Sparks";
import { Smoke } from "./Smoke";

interface SlotMachineProps {
  position?: [number, number, number];
}

const getTitleFontSize = (winnerCount: number): number => {
  if (winnerCount === 1) return 0.22;
  if (winnerCount === 2) return 0.28;

  return 0.32;
};

export const SlotMachine = ({ position = [0, 0, 0] }: SlotMachineProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const leverRef = useRef<LeverHandle>(null);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const spin = useGameStore((state) => state.spin);
  const developers = useGameStore((state) => state.developers);
  const winnerCount = useGameStore((state) => state.winnerCount);
  const pendingWinners = useGameStore((state) => state.pendingWinners);

  const basePositionRef = useRef(new THREE.Vector3(...position));
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const [isShaking, setIsShaking] = useState(false);

  // Shake animation when clicking the lamp
  const shakeMachine = useCallback(() => {
    if (!groupRef.current) return;

    // Kill any existing shake animation
    gsap.killTweensOf(groupRef.current.rotation);
    gsap.killTweensOf(groupRef.current.position);

    // Reset first
    groupRef.current.rotation.set(0, 0, 0);

    // Enable smoke during shake
    setIsShaking(true);

    // Create funny shake sequence
    const tl = gsap.timeline({
      onComplete: () => setIsShaking(false),
    });

    tl.to(groupRef.current.rotation, {
      z: 0.05,
      x: 0.02,
      duration: 0.05,
      ease: "power2.out",
    })
      .to(groupRef.current.rotation, {
        z: -0.06,
        x: -0.03,
        duration: 0.07,
        ease: "power2.inOut",
      })
      .to(groupRef.current.rotation, {
        z: 0.04,
        x: 0.02,
        duration: 0.06,
        ease: "power2.inOut",
      })
      .to(groupRef.current.rotation, {
        z: -0.03,
        x: -0.01,
        duration: 0.05,
        ease: "power2.inOut",
      })
      .to(groupRef.current.rotation, {
        z: 0.02,
        x: 0.01,
        duration: 0.04,
        ease: "power2.inOut",
      })
      .to(groupRef.current.rotation, {
        z: 0,
        x: 0,
        duration: 0.08,
        ease: "power2.out",
      });

    // Also do a little hop
    gsap.to(groupRef.current.position, {
      y: position[1] + 0.03,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
  }, [position]);

  // Dynamic sizing based on winner count
  const machineWidth = 0.9 + winnerCount * 0.55;
  const reelWindowWidth = 0.35 + winnerCount * 0.5;
  const consoleWidth = machineWidth + 0.4;

  // Font size based on winner count
  const titleFontSize = getTitleFontSize(winnerCount);

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

      {/* ========== TOP SECTION: TITLE SIGN ========== */}
      {/* Sign frame (outer) */}
      <RoundedBox
        args={[machineWidth + 0.5, 0.55, 0.1]}
        radius={0.04}
        smoothness={4}
        position={[0, 1.12, 0.22]}
        castShadow
      >
        <meshStandardMaterial color="#2a2f2a" metalness={0.8} roughness={0.4} />
      </RoundedBox>

      {/* Title text - "Review roulette" */}
      <Text
        position={[0, 1.05, 0.32]}
        fontSize={titleFontSize}
        color="#ffc107"
        anchorX="center"
        anchorY="middle"
        font="/LasEnter.ttf"
        letterSpacing={0.02}
      >
        Review roulette
        <meshStandardMaterial
          color="#ffc107"
          emissive="#ff8800"
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </Text>

      {/* Title glow */}
      <pointLight
        position={[0, 1.12, 0.5]}
        intensity={0.8}
        distance={1.5}
        color="#ffaa00"
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
          reelIndex={index}
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

      {/* Sparks flying from reels */}
      {reelPositions.map((pos, index) => (
        <Sparks
          key={`sparks-${index}`}
          position={[pos[0], pos[1], pos[2] + 0.15]}
          active={isSpinning}
          count={25}
        />
      ))}

      {/* ========== BOTTOM SECTION: CONSOLE WITH KEYBOARD LEDGE ========== */}
      <group position={[0, -0.65, 0.35]}>
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
        <group position={[0, 0.25, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* SPIN BUTTON - raised higher */}
          <SpinButton
            enabled={!isSpinning}
            onPress={() => {
              leverRef.current?.pull();
            }}
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
        <Lever ref={leverRef} onPull={spin} onImpact={shakeMachine} />
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

      {/* ========== SIDE LAMP (left side, opposite to lever) ========== */}
      <group position={[-(machineWidth / 2 + 0.35), 0.5, 0.15]}>
        {/* Lamp socket (патрон) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.04, 0.08, 12]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {/* Bulb base (цоколь) */}
        <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.035, 0.04, 12]} />
          <meshStandardMaterial
            color="#888888"
            metalness={0.95}
            roughness={0.2}
          />
        </mesh>
        {/* Bulb glass (колба лампочки) - clickable */}
        <mesh
          position={[-0.14, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          onClick={(e) => {
            e.stopPropagation();
            shakeMachine();
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#ffffcc"
            emissive="#ffcc00"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Inner filament glow */}
        <mesh position={[-0.14, 0, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Lamp light */}
        <pointLight
          position={[-0.18, 0, 0]}
          intensity={6}
          distance={5}
          color="#ffdd55"
        />
      </group>

      {/* ========== EXHAUST PIPE (left side, bottom) ========== */}
      <group position={[-(machineWidth / 2 + 0.28), -0.6, 0.1]}>
        {/* Pipe mount flange */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.07, 0.04, 12]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.85}
            roughness={0.4}
          />
        </mesh>
        {/* Main pipe */}
        <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.05, 0.2, 12]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.8}
            roughness={0.5}
          />
        </mesh>
        {/* Pipe elbow (going up) */}
        <mesh position={[-0.22, 0.06, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.04, 0.045, 0.1, 12]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.8}
            roughness={0.5}
          />
        </mesh>
        {/* Pipe tip */}
        <mesh position={[-0.26, 0.14, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.08, 12]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.9}
            roughness={0.35}
          />
        </mesh>
        {/* Smoke particles */}
        <Smoke
          position={[-0.26, 0.22, 0]}
          active={isSpinning || isShaking}
          count={20}
        />
      </group>
    </group>
  );
};

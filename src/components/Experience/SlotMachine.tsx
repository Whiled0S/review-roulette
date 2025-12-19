import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGameStore } from '../../store/gameStore';

interface SlotMachineProps {
  position?: [number, number, number];
}

// Simple symbols that work well with default fonts
const REEL_SYMBOLS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['1', '2', '3', '4', '5', '6'],
  ['X', 'Y', 'Z', 'W', 'V', 'U'],
];

const REEL_COLORS = [
  ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#a29bfe'],
  ['#fd79a8', '#00b894', '#e17055', '#74b9ff', '#55efc4', '#fab1a0'],
  ['#81ecec', '#ff7675', '#fdcb6e', '#6c5ce7', '#00cec9', '#e84393'],
];

const Reel = ({
  position,
  reelIndex,
  stopDelay = 0,
}: {
  position: [number, number, number];
  reelIndex: number;
  stopDelay?: number;
}) => {
  const spinGroupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const wasSpinningRef = useRef(false);
  const stopTimerRef = useRef<number | null>(null);
  const shouldStopRef = useRef(false);

  const segmentCount = 6;
  const segmentAngle = (Math.PI * 2) / segmentCount;
  const symbols = REEL_SYMBOLS[reelIndex];
  const colors = REEL_COLORS[reelIndex];
  const radius = 0.32;
  const reelWidth = 0.5;

  // Create colored cylinder geometry with vertex colors
  const cylinderGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, reelWidth, 64, 1, false);
    const positionAttr = geo.attributes.position;
    const colorArray = new Float32Array(positionAttr.count * 3);

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);
      
      // Calculate angle around cylinder axis (when cylinder is in default orientation)
      const angle = Math.atan2(z, x);
      // Shift so segment 0 is at front (positive Z after rotation)
      const shiftedAngle = angle + Math.PI + segmentAngle / 2;
      const normalizedAngle = ((shiftedAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % segmentCount;

      const color = new THREE.Color(colors[segmentIndex]);
      
      // Darken the caps
      if (Math.abs(y) > reelWidth / 2 - 0.01) {
        color.multiplyScalar(0.4);
      }
      
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    return geo;
  }, [colors, radius, reelWidth, segmentAngle]);

  useFrame((_, delta) => {
    if (!spinGroupRef.current) return;

    if (isSpinning) {
      velocityRef.current = Math.min(velocityRef.current + delta * 15, 25);
      spinGroupRef.current.rotation.x += velocityRef.current * delta;
      wasSpinningRef.current = true;
      shouldStopRef.current = false;
      
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    } else if (wasSpinningRef.current) {
      // Start stop timer if not already started
      if (stopTimerRef.current === null && !shouldStopRef.current) {
        stopTimerRef.current = window.setTimeout(() => {
          shouldStopRef.current = true;
          stopTimerRef.current = null;
        }, stopDelay);
      }
      
      if (shouldStopRef.current) {
        velocityRef.current *= 0.92;
        
        if (velocityRef.current < 0.5) {
          velocityRef.current = 0;
          wasSpinningRef.current = false;
          shouldStopRef.current = false;
          
          // Snap to nearest segment - ensure we land on a symbol facing forward
          const currentRotation = spinGroupRef.current.rotation.x;
          const targetRotation = Math.round(currentRotation / segmentAngle) * segmentAngle;
          
          gsap.to(spinGroupRef.current.rotation, {
            x: targetRotation,
            duration: 0.3,
            ease: 'back.out(1.7)',
          });
        } else {
          spinGroupRef.current.rotation.x += velocityRef.current * delta;
        }
      } else {
        // Keep spinning while waiting for stop delay
        spinGroupRef.current.rotation.x += velocityRef.current * delta;
      }
    }
  });

  return (
    <group position={position}>
      {/* Static frame elements - don't rotate */}
      
      {/* Side caps to hide text overflow */}
      <mesh position={[reelWidth / 2 + 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.04, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-reelWidth / 2 - 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.04, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Spinning parts */}
      <group ref={spinGroupRef}>
        {/* Main cylinder with colored segments */}
        <mesh rotation={[0, 0, Math.PI / 2]} geometry={cylinderGeometry} castShadow>
          <meshStandardMaterial vertexColors metalness={0.3} roughness={0.6} />
        </mesh>

        {/* Text labels on cylinder surface - positioned to align with color segments */}
        {symbols.map((symbol, i) => {
          // Each segment is segmentAngle apart, starting at 0
          const angle = i * segmentAngle;
          const textRadius = radius + 0.005;
          
          return (
            <group key={i} rotation={[angle, 0, 0]}>
              <Text
                position={[0, 0, textRadius]}
                fontSize={0.13}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.008}
                outlineColor="#000000"
                maxWidth={reelWidth * 0.85}
                textAlign="center"
              >
                {symbol}
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
};

const Lever = ({ onPull }: { onPull: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isSpinning = useGameStore((state) => state.isSpinning);

  const handleClick = () => {
    if (isSpinning || !groupRef.current) return;

    gsap.to(groupRef.current.rotation, {
      z: -0.8,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => {
        onPull();
        gsap.to(groupRef.current!.rotation, {
          z: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });
      },
    });
  };

  return (
    <group ref={groupRef} position={[1.5, 0.3, 0]}>
      {/* Lever arm */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
        <meshStandardMaterial color="#636e72" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lever base */}
      <mesh position={[0, -0.65, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Lever handle (ball) */}
      <mesh
        position={[0, 0.7, 0]}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
        castShadow
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={isSpinning ? '#636e72' : '#e74c3c'}
          metalness={0.6}
          roughness={0.3}
          emissive={isSpinning ? '#000000' : '#e74c3c'}
          emissiveIntensity={isSpinning ? 0 : 0.4}
        />
      </mesh>
    </group>
  );
};

export const SlotMachine = ({ position = [0, 0, 0] }: SlotMachineProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const spin = useGameStore((state) => state.spin);

  const basePositionRef = useRef(new THREE.Vector3(...position));
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1));

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isSpinning) {
      const time = state.clock.elapsedTime;
      const shakeIntensity = 0.015;
      const pulseIntensity = 0.015;

      groupRef.current.position.x =
        basePositionRef.current.x + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.y =
        basePositionRef.current.y + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.z =
        basePositionRef.current.z + (Math.random() - 0.5) * shakeIntensity * 0.5;

      const pulse = 1 + Math.sin(time * 15) * pulseIntensity;
      groupRef.current.scale.setScalar(pulse);
    } else {
      groupRef.current.position.copy(basePositionRef.current);
      groupRef.current.scale.copy(baseScaleRef.current);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <RoundedBox
        args={[2.8, 2.6, 1.4]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* Screen bezel */}
      <RoundedBox
        args={[2.3, 0.95, 0.2]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.5, 0.62]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Screen background */}
      <mesh position={[0, 0.5, 0.52]}>
        <boxGeometry args={[2.1, 0.8, 0.02]} />
        <meshStandardMaterial color="#050510" />
      </mesh>

      {/* Reels - with staggered stop delays */}
      <Reel position={[-0.7, 0.5, 0.4]} reelIndex={0} stopDelay={0} />
      <Reel position={[0, 0.5, 0.4]} reelIndex={1} stopDelay={300} />
      <Reel position={[0.7, 0.5, 0.4]} reelIndex={2} stopDelay={600} />

      {/* Reel window frame dividers */}
      <mesh position={[-0.35, 0.5, 0.58]}>
        <boxGeometry args={[0.06, 0.85, 0.12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.35, 0.5, 0.58]}>
        <boxGeometry args={[0.06, 0.85, 0.12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Win line indicators */}
      <mesh position={[-1.1, 0.5, 0.65]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>
      <mesh position={[1.1, 0.5, 0.65]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>

      {/* Base/stand */}
      <RoundedBox
        args={[2.9, 0.25, 1.5]}
        radius={0.05}
        smoothness={4}
        position={[0, -1.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Top marquee */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[2.2, 0.35, 0.9]} />
        <meshStandardMaterial
          color="#e74c3c"
          metalness={0.5}
          roughness={0.4}
          emissive="#e74c3c"
          emissiveIntensity={isSpinning ? 0.6 : 0.25}
        />
      </mesh>

      {/* Marquee text */}
      <Text
        position={[0, 1.65, 0.5]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        REVIEW ROULETTE
      </Text>

      {/* Decorative lights on top */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 1.85, 0.3]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={isSpinning ? '#ffeb3b' : '#ff6b6b'}
            emissive={isSpinning ? '#ffeb3b' : '#ff6b6b'}
            emissiveIntensity={isSpinning ? 1.5 : 0.5}
          />
        </mesh>
      ))}

      {/* Point lights for glow effect */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <pointLight
          key={i}
          position={[x, 0.5, 1]}
          intensity={isSpinning ? 1.5 : 0.3}
          distance={2}
          color={isSpinning ? '#ffeb3b' : '#ff6b6b'}
        />
      ))}

      {/* Lever */}
      <Lever onPull={spin} />

      {/* Coin slot decoration */}
      <mesh position={[0, -0.4, 0.72]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.05]} />
        <meshStandardMaterial color="#c0a000" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Payout tray */}
      <mesh position={[0, -0.85, 0.8]} castShadow>
        <boxGeometry args={[1.2, 0.4, 0.3]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
};

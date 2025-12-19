import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGameStore, type Developer } from '../../store/gameStore';

interface SlotMachineProps {
  position?: [number, number, number];
}

// Generate a color based on developer name for consistent coloring
const getColorFromName = (name: string): string => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#a29bfe',
    '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#55efc4', '#fab1a0',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name (first letter of first name + first letter of last name)
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface DeveloperSegmentProps {
  developer: Developer;
  angle: number;
  radius: number;
  reelWidth: number;
}

const DeveloperSegment = ({ developer, angle, radius, reelWidth }: DeveloperSegmentProps) => {
  const initials = getInitials(developer.name);
  const bgColor = getColorFromName(developer.name);
  
  return (
    <group rotation={[angle, 0, 0]}>
      <Html
        position={[0, 0, radius + 0.01]}
        center
        distanceFactor={2.5}
        style={{
          width: `${reelWidth * 100}px`,
          height: '60px',
          pointerEvents: 'none',
        }}
        transform
        occlude={false}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: developer.avatarUrl ? '#1a1a2e' : bgColor,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {developer.avatarUrl ? (
            <img
              src={developer.avatarUrl}
              alt={developer.name}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#2d3436',
              }}
            />
          ) : (
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

const Reel = ({
  position,
  developers,
  targetDeveloper,
  stopDelay = 0,
}: {
  position: [number, number, number];
  developers: Developer[];
  targetDeveloper: Developer | null;
  stopDelay?: number;
}) => {
  const spinGroupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const wasSpinningRef = useRef(false);
  const stopTimerRef = useRef<number | null>(null);
  const shouldStopRef = useRef(false);
  const hasStoppedRef = useRef(false);

  const segmentCount = developers.length;
  const segmentAngle = (Math.PI * 2) / segmentCount;
  const radius = 0.32;
  const reelWidth = 0.55;

  // Find target developer index
  const targetIndex = useMemo(() => {
    if (!targetDeveloper) return 0;
    const index = developers.findIndex(d => d.id === targetDeveloper.id);
    return index >= 0 ? index : 0;
  }, [developers, targetDeveloper]);

  // Create colored cylinder geometry with vertex colors
  const cylinderGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, reelWidth, 64, 1, false);
    const positionAttr = geo.attributes.position;
    const colorArray = new Float32Array(positionAttr.count * 3);

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);
      
      // Calculate angle around cylinder axis
      const angle = Math.atan2(z, x);
      const shiftedAngle = angle + Math.PI + segmentAngle / 2;
      const normalizedAngle = ((shiftedAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % segmentCount;

      const developer = developers[segmentIndex];
      const color = new THREE.Color(getColorFromName(developer.name));
      
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
  }, [developers, radius, reelWidth, segmentAngle, segmentCount]);

  useFrame((_, delta) => {
    if (!spinGroupRef.current) return;

    if (isSpinning) {
      // Reset all stop flags when spinning starts
      hasStoppedRef.current = false;
      shouldStopRef.current = false;
      wasSpinningRef.current = true;
      
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      
      velocityRef.current = Math.min(velocityRef.current + delta * 15, 25);
      spinGroupRef.current.rotation.x += velocityRef.current * delta;
    } else if (wasSpinningRef.current && !hasStoppedRef.current) {
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
          hasStoppedRef.current = true;
          
          // Calculate target rotation to land on specific developer
          // When group rotates by θ, developer at index i (at angle i*segmentAngle) 
          // ends up at angle (θ + i*segmentAngle). For it to face forward (angle 0),
          // we need: θ + i*segmentAngle ≡ 0 (mod 2π)
          // So: θ ≡ -i*segmentAngle (mod 2π)
          const targetAngle = ((Math.PI * 2) - (targetIndex * segmentAngle)) % (Math.PI * 2);
          const currentRotation = spinGroupRef.current.rotation.x;
          
          // Find the nearest rotation that lands on target (going forward)
          const fullRotations = Math.floor(currentRotation / (Math.PI * 2));
          let finalTarget = fullRotations * Math.PI * 2 + targetAngle;
          
          // Make sure we're going forward, not backward
          while (finalTarget < currentRotation) {
            finalTarget += Math.PI * 2;
          }
          
          gsap.to(spinGroupRef.current.rotation, {
            x: finalTarget,
            duration: 0.4,
            ease: 'back.out(1.7)',
          });
        } else {
          spinGroupRef.current.rotation.x += velocityRef.current * delta;
        }
      } else {
        spinGroupRef.current.rotation.x += velocityRef.current * delta;
      }
    }
  });

  return (
    <group position={position}>
      {/* Static frame elements - don't rotate */}
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

        {/* Developer segments */}
        {developers.map((developer, i) => {
          const angle = i * segmentAngle;
          return (
            <DeveloperSegment
              key={developer.id}
              developer={developer}
              angle={angle}
              radius={radius}
              reelWidth={reelWidth}
            />
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
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
        <meshStandardMaterial color="#636e72" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, -0.65, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>

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
  const developers = useGameStore((state) => state.developers);
  const winnerCount = useGameStore((state) => state.winnerCount);
  const pendingWinners = useGameStore((state) => state.pendingWinners);

  const basePositionRef = useRef(new THREE.Vector3(...position));
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1));

  // Calculate reel positions based on number of reels
  const reelPositions = useMemo(() => {
    const reelSpacing = 0.75;
    const positions: [number, number, number][] = [];
    
    for (let i = 0; i < winnerCount; i++) {
      const offset = (i - (winnerCount - 1) / 2) * reelSpacing;
      positions.push([offset, 0.5, 0.4]);
    }
    
    return positions;
  }, [winnerCount]);

  // Calculate divider positions
  const dividerPositions = useMemo(() => {
    if (winnerCount <= 1) return [];
    
    const positions: number[] = [];
    const reelSpacing = 0.75;
    
    for (let i = 0; i < winnerCount - 1; i++) {
      const leftReel = (i - (winnerCount - 1) / 2) * reelSpacing;
      const rightReel = (i + 1 - (winnerCount - 1) / 2) * reelSpacing;
      positions.push((leftReel + rightReel) / 2);
    }
    
    return positions;
  }, [winnerCount]);

  // Dynamic width based on number of reels
  const machineWidth = 1.2 + winnerCount * 0.6;
  const screenWidth = 0.6 + winnerCount * 0.55;

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

  // Fixed lever position - always on the right side of the machine body
  const leverXPosition = (machineWidth + 0.8) / 2 + 0.15;

  return (
    <group ref={groupRef} position={position}>
      {/* Main body - dynamic width */}
      <RoundedBox
        args={[machineWidth + 0.8, 2.6, 1.4]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* Screen bezel - dynamic width */}
      <RoundedBox
        args={[screenWidth + 0.3, 0.95, 0.2]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.5, 0.62]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Screen background */}
      <mesh position={[0, 0.5, 0.52]}>
        <boxGeometry args={[screenWidth + 0.1, 0.8, 0.02]} />
        <meshStandardMaterial color="#050510" />
      </mesh>

      {/* Dynamic reels - each with its target winner */}
      {reelPositions.map((pos, index) => (
        <Reel
          key={index}
          position={pos}
          developers={developers}
          targetDeveloper={pendingWinners[index] || null}
          stopDelay={index * 400}
        />
      ))}

      {/* Dynamic dividers between reels */}
      {dividerPositions.map((xPos, index) => (
        <mesh key={index} position={[xPos, 0.5, 0.58]}>
          <boxGeometry args={[0.06, 0.85, 0.12]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Win line indicators */}
      <mesh position={[-(screenWidth / 2 + 0.25), 0.5, 0.65]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>
      <mesh position={[(screenWidth / 2 + 0.25), 0.5, 0.65]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>

      {/* Base/stand - dynamic width */}
      <RoundedBox
        args={[machineWidth + 0.9, 0.25, 1.5]}
        radius={0.05}
        smoothness={4}
        position={[0, -1.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Top marquee - dynamic width */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[machineWidth + 0.2, 0.35, 0.9]} />
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

      {/* Decorative lights on top - dynamic positions */}
      {Array.from({ length: Math.min(5, winnerCount + 2) }).map((_, i) => {
        const spacing = machineWidth / (Math.min(5, winnerCount + 2) + 1);
        const xPos = (i + 1) * spacing - machineWidth / 2;
        return (
          <mesh key={i} position={[xPos, 1.85, 0.3]} castShadow>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color={isSpinning ? '#ffeb3b' : '#ff6b6b'}
              emissive={isSpinning ? '#ffeb3b' : '#ff6b6b'}
              emissiveIntensity={isSpinning ? 1.5 : 0.5}
            />
          </mesh>
        );
      })}

      {/* Point lights for glow effect */}
      {reelPositions.map((pos, i) => (
        <pointLight
          key={i}
          position={[pos[0], 0.5, 1]}
          intensity={isSpinning ? 1.5 : 0.3}
          distance={2}
          color={isSpinning ? '#ffeb3b' : '#ff6b6b'}
        />
      ))}

      {/* Lever - fixed position relative to machine body */}
      <group position={[leverXPosition, 0.3, 0]}>
        <Lever onPull={spin} />
      </group>

      {/* Coin slot decoration */}
      <mesh position={[0, -0.4, 0.72]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.05]} />
        <meshStandardMaterial color="#c0a000" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Payout tray */}
      <mesh position={[0, -0.85, 0.8]} castShadow>
        <boxGeometry args={[Math.max(1.2, machineWidth * 0.5), 0.4, 0.3]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
};

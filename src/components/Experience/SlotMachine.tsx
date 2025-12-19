import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGameStore, type Developer } from '../../store/gameStore';

// Texture cache to avoid reloading
const textureCache = new Map<string, THREE.Texture>();
const loadingTextures = new Map<string, Promise<THREE.Texture>>();

const loadTexture = (url: string): Promise<THREE.Texture> => {
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }
  
  if (loadingTextures.has(url)) {
    return loadingTextures.get(url)!;
  }
  
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  
  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        textureCache.set(url, texture);
        loadingTextures.delete(url);
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error('Failed to load texture:', url, error);
        loadingTextures.delete(url);
        reject(error);
      }
    );
  });
  
  loadingTextures.set(url, promise);
  return promise;
};

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

// Get initials from name
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
  segmentWidth: number;
}

const DeveloperSegment = ({ developer, angle, radius, segmentWidth }: DeveloperSegmentProps) => {
  const initials = getInitials(developer.name);
  const bgColor = getColorFromName(developer.name);
  const segmentHeight = 0.25;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const avatarSize = 0.09;
  
  // Load texture if avatar URL exists
  useEffect(() => {
    if (developer.avatarUrl) {
      setLoadFailed(false);
      loadTexture(developer.avatarUrl)
        .then((tex) => {
          setTexture(tex);
        })
        .catch(() => {
          setTexture(null);
          setLoadFailed(true);
        });
    }
  }, [developer.avatarUrl]);
  
  const showInitials = !texture || loadFailed;
  
  return (
    <group rotation={[angle, 0, 0]}>
      {/* Segment background panel */}
      <mesh position={[0, 0, radius]}>
        <planeGeometry args={[segmentWidth, segmentHeight]} />
        <meshStandardMaterial 
          color={bgColor} 
          metalness={0.2} 
          roughness={0.6}
        />
      </mesh>
      
      {/* Avatar with texture or initials background */}
      <mesh position={[0, 0, radius + 0.005]}>
        <circleGeometry args={[avatarSize, 32]} />
        {texture && !loadFailed ? (
          <meshBasicMaterial map={texture} />
        ) : (
          <meshStandardMaterial 
            color="#1a1a2e"
            metalness={0.2} 
            roughness={0.8}
          />
        )}
      </mesh>
      
      {/* Initials text - only show if no texture */}
      {showInitials && (
        <Text
          position={[0, 0, radius + 0.01]}
          fontSize={0.07}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {initials}
        </Text>
      )}
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
  const radius = 0.28;
  const reelWidth = 0.48;

  // Find target developer index
  const targetIndex = useMemo(() => {
    if (!targetDeveloper) return 0;
    const index = developers.findIndex(d => d.id === targetDeveloper.id);
    return index >= 0 ? index : 0;
  }, [developers, targetDeveloper]);

  useFrame((_, delta) => {
    if (!spinGroupRef.current) return;

    if (isSpinning) {
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
          
          const targetAngle = ((Math.PI * 2) - (targetIndex * segmentAngle)) % (Math.PI * 2);
          const currentRotation = spinGroupRef.current.rotation.x;
          
          const fullRotations = Math.floor(currentRotation / (Math.PI * 2));
          let finalTarget = fullRotations * Math.PI * 2 + targetAngle;
          
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
      {/* Static frame - gold rings on sides */}
      <mesh position={[reelWidth / 2 + 0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius + 0.02, 0.02, 12, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-reelWidth / 2 - 0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius + 0.02, 0.02, 12, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Side caps */}
      <mesh position={[reelWidth / 2 + 0.015, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.02, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-reelWidth / 2 - 0.015, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.02, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Spinning group */}
      <group ref={spinGroupRef}>
        {/* Central drum/axis - smaller inner cylinder */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.3, radius * 0.3, reelWidth, 16]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Spokes connecting center to segments */}
        {developers.map((_, i) => {
          const spokeAngle = i * segmentAngle;
          return (
            <mesh 
              key={`spoke-${i}`} 
              position={[0, 0, 0]}
              rotation={[spokeAngle, 0, 0]}
            >
              <mesh position={[0, 0, radius * 0.5]}>
                <boxGeometry args={[reelWidth * 0.8, 0.02, radius * 0.4]} />
                <meshStandardMaterial color="#2d3436" metalness={0.6} roughness={0.4} />
              </mesh>
            </mesh>
          );
        })}

        {/* Developer segments on the outside */}
        {developers.map((developer, i) => (
          <DeveloperSegment
            key={developer.id}
            developer={developer}
            angle={i * segmentAngle}
            radius={radius}
            segmentWidth={reelWidth - 0.06}
          />
        ))}
      </group>

      {/* Inner glow */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.3}
        distance={0.6}
        color="#fffaf0"
      />
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
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
        castShadow
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial
          color={isSpinning ? '#4a4a4a' : '#e74c3c'}
          metalness={0.7}
          roughness={0.2}
          emissive={isSpinning ? '#000000' : '#e74c3c'}
          emissiveIntensity={isSpinning ? 0 : 0.5}
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
        basePositionRef.current.z + (Math.random() - 0.5) * shakeIntensity * 0.5;

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
          <meshStandardMaterial color="#0a0a12" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Win line indicators */}
      <mesh position={[-(screenWidth / 2 + 0.15), 0.5, 0.62]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 3]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={isSpinning ? 1 : 0.3}
        />
      </mesh>
      <mesh position={[(screenWidth / 2 + 0.15), 0.5, 0.62]} rotation={[0, 0, Math.PI / 2]}>
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
              color={isSpinning ? '#ffeb3b' : '#ff6b6b'}
              emissive={isSpinning ? '#ffeb3b' : '#ff6b6b'}
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

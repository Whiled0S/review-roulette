import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useGameStore, type Developer } from "../../../store/gameStore";
import { DeveloperSegment } from "./DeveloperSegment";

interface ReelProps {
  position: [number, number, number];
  developers: Developer[];
  targetDeveloper: Developer | null;
  stopDelay?: number;
}

export const Reel = ({
  position,
  developers,
  targetDeveloper,
  stopDelay = 0,
}: ReelProps) => {
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
    const index = developers.findIndex((d) => d.id === targetDeveloper.id);
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

          const targetAngle =
            (Math.PI * 2 - targetIndex * segmentAngle) % (Math.PI * 2);
          const currentRotation = spinGroupRef.current.rotation.x;

          const fullRotations = Math.floor(currentRotation / (Math.PI * 2));
          let finalTarget = fullRotations * Math.PI * 2 + targetAngle;

          while (finalTarget < currentRotation) {
            finalTarget += Math.PI * 2;
          }

          gsap.to(spinGroupRef.current.rotation, {
            x: finalTarget,
            duration: 0.4,
            ease: "back.out(1.7)",
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
      <mesh
        position={[reelWidth / 2 + 0.01, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <torusGeometry args={[radius + 0.02, 0.02, 12, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh
        position={[-reelWidth / 2 - 0.01, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <torusGeometry args={[radius + 0.02, 0.02, 12, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Side caps */}
      <mesh
        position={[reelWidth / 2 + 0.015, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.02, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh
        position={[-reelWidth / 2 - 0.015, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.02, 32]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Spinning group */}
      <group ref={spinGroupRef}>
        {/* Central drum/axis - smaller inner cylinder */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry
            args={[radius * 0.3, radius * 0.3, reelWidth, 16]}
          />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.8}
            roughness={0.2}
          />
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
                <meshStandardMaterial
                  color="#2d3436"
                  metalness={0.6}
                  roughness={0.4}
                />
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

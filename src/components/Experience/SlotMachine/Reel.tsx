import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import emojiData from "unicode-emoji-json";
import { useGameStore, type Developer } from "../../../store/gameStore";
import { DeveloperSegment } from "./DeveloperSegment";
import { EmojiSegment } from "./EmojiSegment";

// Get all emojis from the unicode-emoji-json library
const ALL_EMOJIS = Object.keys(emojiData);

// Fixed number of segments
const TOTAL_SEGMENTS = 6;
const DEV_SLOTS = 3;
const EMOJI_SLOTS = 3;

// Speed threshold at which randomization happens (reel is spinning fast enough)
const RANDOMIZATION_SPEED_THRESHOLD = 18;

// Get N random items from array using seed
const getRandomItems = <T,>(arr: T[], count: number, seed: number): T[] => {
  // Use a portion of the array to avoid shuffling thousands of items
  const startIndex = Math.floor(
    (((seed * 9301 + 49297) % 233280) / 233280) * Math.max(0, arr.length - 100),
  );
  const portion = arr.slice(startIndex, startIndex + 100);

  const shuffled = [...portion];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(
      (((seed * (i + 1) * 9301 + 49297) % 233280) / 233280) * (i + 1),
    );
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

interface ReelProps {
  position: [number, number, number];
  developers: Developer[];
  targetDeveloper: Developer | null;
  stopDelay?: number;
  reelIndex: number; // Index of this reel for unique randomization
}

type SegmentItem =
  | { type: "developer"; developer: Developer; slotIndex: number }
  | { type: "emoji"; emoji: string; slotIndex: number };

// Create segments helper function
const createSegments = (
  developers: Developer[],
  targetDeveloper: Developer | null,
  seed: number,
  reelIndex: number,
): SegmentItem[] => {
  // Use reelIndex to create unique seed for each reel
  const reelSeed = seed + reelIndex * 12345;

  // Get 3 random developers (or fill with available if less)
  let randomDevs = getRandomItems(developers, DEV_SLOTS, reelSeed);

  // Force target developer into the first visible slot.
  if (targetDeveloper) {
    randomDevs = [
      targetDeveloper,
      ...randomDevs
        .filter((developer) => developer.id !== targetDeveloper.id)
        .slice(0, DEV_SLOTS - 1),
    ];
  }

  // Get 3 random emojis - unique per reel
  const randomEmojis = getRandomItems(ALL_EMOJIS, EMOJI_SLOTS, reelSeed + 9999);

  // Create interleaved segments: dev, emoji, dev, emoji, dev, emoji
  const result: SegmentItem[] = [];
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    if (i % 2 === 0) {
      // Developer slot (indices 0, 2, 4)
      const devIndex = Math.floor(i / 2);
      if (devIndex < randomDevs.length) {
        result.push({
          type: "developer",
          developer: randomDevs[devIndex],
          slotIndex: i,
        });
      }
    } else {
      // Emoji slot (indices 1, 3, 5)
      const emojiIndex = Math.floor(i / 2);
      if (emojiIndex < randomEmojis.length) {
        result.push({
          type: "emoji",
          emoji: randomEmojis[emojiIndex],
          slotIndex: i,
        });
      }
    }
  }

  return result;
};

export const Reel = ({
  position,
  developers,
  targetDeveloper,
  stopDelay = 0,
  reelIndex,
}: ReelProps) => {
  const spinGroupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const wasSpinningRef = useRef(false);
  const stopTimerRef = useRef<number | null>(null);
  const shouldStopRef = useRef(false);
  const hasStoppedRef = useRef(false);

  // Track if randomization has occurred for this spin
  const hasRandomizedRef = useRef(false);

  // Pending target developer - will be applied when reel reaches speed threshold
  const pendingTargetRef = useRef<Developer | null>(null);
  // Last target that was actually visible in idle state
  const lastVisibleTargetRef = useRef<Developer | null>(targetDeveloper);

  // Store frozen segments - these don't change until speed threshold is reached
  const [frozenSeed, setFrozenSeed] = useState(() => Date.now());
  const [frozenTarget, setFrozenTarget] = useState<Developer | null>(null);

  const segmentTarget = isSpinning ? frozenTarget : targetDeveloper;

  // Create segments based on frozen state while spinning and live targets in idle state.
  const segments = useMemo<SegmentItem[]>(
    () => createSegments(developers, segmentTarget, frozenSeed, reelIndex),
    [developers, segmentTarget, frozenSeed, reelIndex],
  );

  // When targetDeveloper changes, store it as pending (don't apply yet)
  useEffect(() => {
    pendingTargetRef.current = targetDeveloper;
  }, [targetDeveloper]);

  useEffect(() => {
    if (isSpinning) return;

    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.x = 0;
    }
  }, [isSpinning, targetDeveloper]);

  // Randomize segments callback - called when reel reaches speed threshold
  const applyPendingChanges = useCallback(() => {
    setFrozenSeed(Date.now());
    setFrozenTarget(pendingTargetRef.current);
  }, []);

  const segmentCount = TOTAL_SEGMENTS;
  const segmentAngle = (Math.PI * 2) / segmentCount;
  const radius = 0.28;
  const reelWidth = 0.48;

  // Find target developer index in current segments
  const targetIndex = segments.findIndex(
    (s) => s.type === "developer" && s.developer?.id === frozenTarget?.id,
  );
  const finalTargetIndex = targetIndex >= 0 ? targetIndex : 0;

  useFrame((_, delta) => {
    if (!spinGroupRef.current) return;

    if (isSpinning) {
      if (!wasSpinningRef.current) {
        // Start spin from what the user just saw, not from freshly assigned winner.
        setFrozenSeed(Date.now());
        setFrozenTarget(lastVisibleTargetRef.current);
      }

      hasStoppedRef.current = false;
      shouldStopRef.current = false;
      wasSpinningRef.current = true;

      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }

      velocityRef.current = Math.min(velocityRef.current + delta * 15, 25);
      spinGroupRef.current.rotation.x += velocityRef.current * delta;

      // Apply pending changes when speed threshold is reached
      if (
        velocityRef.current >= RANDOMIZATION_SPEED_THRESHOLD &&
        !hasRandomizedRef.current
      ) {
        hasRandomizedRef.current = true;
        applyPendingChanges();
      }
    } else if (wasSpinningRef.current && !hasStoppedRef.current) {
      // Reset randomization flag when spin ends (for next spin)
      hasRandomizedRef.current = false;

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
          setFrozenTarget(null);

          const targetAngle =
            (Math.PI * 2 - finalTargetIndex * segmentAngle) % (Math.PI * 2);
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
    } else {
      lastVisibleTargetRef.current = targetDeveloper;
    }
  });

  return (
    <group position={position}>
      {/* Static frame - gold rings on sides */}
      <mesh
        position={[reelWidth / 2 + 0.01, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[radius + 0.02, 0.018, 12, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh
        position={[-reelWidth / 2 - 0.01, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[radius + 0.02, 0.018, 12, 32]} />
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
        {/* Central drum/axis */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.3, radius * 0.3, reelWidth, 16]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Spokes */}
        {Array.from({ length: segmentCount }).map((_, i) => {
          const spokeAngle = i * segmentAngle;
          return (
            <mesh key={`spoke-${i}`} rotation={[spokeAngle, 0, 0]}>
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

        {/* Segments */}
        {segments.map((segment, i) =>
          segment.type === "developer" ? (
            <DeveloperSegment
              key={`dev-${segment.developer.id}-${i}-${frozenSeed}`}
              developer={segment.developer}
              angle={segment.slotIndex * segmentAngle}
              radius={radius}
              segmentWidth={reelWidth - 0.06}
            />
          ) : (
            <EmojiSegment
              key={`emoji-${segment.slotIndex}-${frozenSeed}`}
              emoji={segment.emoji}
              angle={segment.slotIndex * segmentAngle}
              radius={radius}
              segmentWidth={reelWidth - 0.06}
            />
          ),
        )}
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

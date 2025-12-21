import { useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Developer } from "../../../store/gameStore";
import { getColorFromName, getInitials, loadTexture } from "../../shared";

interface DeveloperSegmentProps {
  developer: Developer;
  angle: number;
  radius: number;
  segmentWidth: number;
}

export const DeveloperSegment = ({
  developer,
  angle,
  radius,
  segmentWidth,
}: DeveloperSegmentProps) => {
  const initials = getInitials(developer.name);
  const bgColor = getColorFromName(developer.name);
  const segmentHeight = 0.25;
  const [textureState, setTextureState] = useState<{
    texture: THREE.Texture | null;
    failed: boolean;
    url: string | undefined;
  }>({ texture: null, failed: false, url: undefined });

  const avatarSize = 0.09;
  const avatarUrl = developer.avatarUrl;

  // Load texture if avatar URL exists
  useEffect(() => {
    if (!avatarUrl) return;

    let cancelled = false;

    loadTexture(avatarUrl)
      .then((tex) => {
        if (!cancelled) {
          setTextureState({ texture: tex, failed: false, url: avatarUrl });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTextureState({ texture: null, failed: true, url: avatarUrl });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);

  // Derive current texture state - reset if URL changed
  const texture = textureState.url === avatarUrl ? textureState.texture : null;
  const loadFailed =
    textureState.url === avatarUrl ? textureState.failed : false;

  const showInitials = !texture || loadFailed;

  return (
    <group rotation={[angle, 0, 0]}>
      {/* Segment background panel */}
      <mesh position={[0, 0, radius]}>
        <planeGeometry args={[segmentWidth, segmentHeight]} />
        <meshStandardMaterial color={bgColor} metalness={0.2} roughness={0.6} />
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
          renderOrder={0}
          material-depthTest={true}
          material-depthWrite={true}
          material-side={THREE.FrontSide}
        >
          {initials}
        </Text>
      )}
    </group>
  );
};

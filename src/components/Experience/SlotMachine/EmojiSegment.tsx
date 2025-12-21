import { Text } from "@react-three/drei";
import * as THREE from "three";

interface EmojiSegmentProps {
  emoji: string;
  angle: number;
  radius: number;
  segmentWidth: number;
}

export const EmojiSegment = ({
  emoji,
  angle,
  radius,
  segmentWidth,
}: EmojiSegmentProps) => {
  const segmentHeight = 0.25;

  return (
    <group rotation={[angle, 0, 0]}>
      {/* Segment background panel - same style as developer */}
      <mesh position={[0, 0, radius]}>
        <planeGeometry args={[segmentWidth, segmentHeight]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Emoji text - larger to match avatar size */}
      <Text
        position={[0, 0, radius + 0.01]}
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
        renderOrder={0}
        material-depthTest={true}
        material-depthWrite={true}
        material-side={THREE.FrontSide}
      >
        {emoji}
      </Text>
    </group>
  );
};

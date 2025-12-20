import type { Developer } from "../../../store/gameStore";
import { getColorFromName, getInitials } from "../../shared";

interface AvatarProps {
  developer: Developer;
  size?: number;
  className?: string;
}

/**
 * Reusable Avatar component
 * Shows developer's avatar image or fallback to colored initials
 */
export const Avatar = ({
  developer,
  size = 48,
  className = "",
}: AvatarProps) => {
  const initials = getInitials(developer.name);
  const bgColor = getColorFromName(developer.name);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
  };

  if (developer.avatarUrl) {
    return (
      <img
        src={developer.avatarUrl}
        alt={developer.name}
        className={className}
        style={{
          ...baseStyle,
          objectFit: "cover",
          background: "#374151",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "white",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
      }}
    >
      {initials}
    </div>
  );
};

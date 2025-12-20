import { AVATAR_COLORS } from "../constants/colors";

/**
 * Generate a consistent color based on developer name
 * Uses simple hash function to ensure same name always gets same color
 */
export const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * Get initials from a developer's name
 * For "John Doe" returns "JD", for "Alex" returns "AL"
 */
export const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

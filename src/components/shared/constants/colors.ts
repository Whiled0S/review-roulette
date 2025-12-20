/**
 * Color palette for developer avatars
 * Used to generate consistent colors based on developer names
 */
export const AVATAR_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#a29bfe",
  "#fd79a8",
  "#00b894",
  "#e17055",
  "#74b9ff",
  "#55efc4",
  "#fab1a0",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

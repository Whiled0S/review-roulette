import { z } from "zod";
import type { Developer } from "./gameStore";

const STORAGE_KEY = "review-roulette:state";

export const MAX_WINNER_SLOTS = 3;
export const MIN_AVAILABLE_DEVELOPERS = 2;

export interface PersistedRouletteState {
  excludedDeveloperIds: string[];
  winnerCount: number;
}

const persistedRouletteStateSchema = z.object({
  excludedDeveloperIds: z.array(z.string()),
  winnerCount: z.number().int(),
});

export const getAvailableDevelopers = (
  allDevelopers: Developer[],
  excludedDeveloperIds: string[],
): Developer[] => {
  const excludedSet = new Set(excludedDeveloperIds);
  return allDevelopers.filter((developer) => !excludedSet.has(developer.id));
};

export const getMaxWinnerCountFromDevelopers = (
  developers: Developer[],
): number => {
  return Math.max(1, Math.min(MAX_WINNER_SLOTS, developers.length - 1));
};

export const getDefaultPersistedRouletteState = (
  allDevelopers: Developer[],
): PersistedRouletteState => ({
  excludedDeveloperIds: [],
  winnerCount: getMaxWinnerCountFromDevelopers(allDevelopers),
});

const validatePersistedState = (
  value: unknown,
  allDevelopers: Developer[],
): PersistedRouletteState | null => {
  const parsed = persistedRouletteStateSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }

  const knownDeveloperIds = new Set(allDevelopers.map((developer) => developer.id));
  const excludedIdsSet = new Set(parsed.data.excludedDeveloperIds);

  if (excludedIdsSet.size !== parsed.data.excludedDeveloperIds.length) {
    return null;
  }

  const hasUnknownDeveloper = parsed.data.excludedDeveloperIds.some(
    (developerId) => !knownDeveloperIds.has(developerId),
  );
  if (hasUnknownDeveloper) {
    return null;
  }

  const availableDevelopers = getAvailableDevelopers(
    allDevelopers,
    parsed.data.excludedDeveloperIds,
  );

  if (availableDevelopers.length < MIN_AVAILABLE_DEVELOPERS) {
    return null;
  }

  const maxWinnerCount = getMaxWinnerCountFromDevelopers(availableDevelopers);
  if (parsed.data.winnerCount < 1 || parsed.data.winnerCount > maxWinnerCount) {
    return null;
  }

  return {
    excludedDeveloperIds: parsed.data.excludedDeveloperIds,
    winnerCount: parsed.data.winnerCount,
  };
};

export const savePersistedRouletteState = (
  value: PersistedRouletteState,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const loadPersistedRouletteState = (
  allDevelopers: Developer[],
): PersistedRouletteState => {
  const fallbackState = getDefaultPersistedRouletteState(allDevelopers);

  if (typeof window === "undefined") {
    return fallbackState;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return fallbackState;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawValue) as unknown;
  } catch {
    savePersistedRouletteState(fallbackState);
    return fallbackState;
  }

  const validatedState = validatePersistedState(parsedJson, allDevelopers);
  if (!validatedState) {
    savePersistedRouletteState(fallbackState);
    return fallbackState;
  }

  return validatedState;
};

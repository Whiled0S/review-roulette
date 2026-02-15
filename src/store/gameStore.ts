import { create } from "zustand";

export interface Developer {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface GameState {
  isSpinning: boolean;
  allDevelopers: Developer[];
  developers: Developer[];
  excludedDeveloperIds: string[];
  previewWinners: Developer[];
  winners: Developer[];
  pendingWinners: Developer[];
  winnerCount: number;
  spin: () => void;
  reset: () => void;
  setWinnerCount: (count: number) => void;
  toggleDeveloperExclusion: (developerId: string) => void;
}

const mockDevelopers: Developer[] = [
  {
    id: "1",
    name: "Артем Кукуруза",
    avatarUrl: "/img/Artem.jpg",
  },
  {
    id: "2",
    name: "Илья Доронин",
    avatarUrl: "/img/Ilya.jpg",
  },
  {
    id: "3",
    name: "Алиса Абдеева",
    avatarUrl: "/img/Alice.jpg",
  },
  {
    id: "4",
    name: "Михаил Власов",
    avatarUrl: "/img/Michael.jpg",
  },
];

const selectRandomWinners = (
  developers: Developer[],
  count: number,
): Developer[] => {
  const shuffled = [...developers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, developers.length));
};

const MAX_WINNER_SLOTS = 3;
const MIN_AVAILABLE_DEVELOPERS = 2;

const getMaxWinnerCountFromDevelopers = (developers: Developer[]): number => {
  return Math.max(1, Math.min(MAX_WINNER_SLOTS, developers.length - 1));
};

const getPreviewWinners = (
  developers: Developer[],
  winnerCount: number,
): Developer[] => {
  return selectRandomWinners(developers, winnerCount);
};

export const useGameStore = create<GameState>((set, get) => ({
  isSpinning: false,
  allDevelopers: mockDevelopers,
  developers: mockDevelopers,
  excludedDeveloperIds: [],
  previewWinners: getPreviewWinners(mockDevelopers, 2),
  winners: [],
  pendingWinners: [],
  winnerCount: 2,

  spin: () => {
    const { isSpinning, developers, winnerCount } = get();
    if (isSpinning) return;

    const pendingWinners = selectRandomWinners(developers, winnerCount);

    set({ isSpinning: true, winners: [], pendingWinners });

    const spinDuration = 3000 + Math.random() * 1000;

    setTimeout(() => {
      set({ isSpinning: false, winners: pendingWinners });
    }, spinDuration);
  },

  reset: () => {
    const { developers, winnerCount } = get();
    set({
      winners: [],
      pendingWinners: [],
      previewWinners: getPreviewWinners(developers, winnerCount),
      isSpinning: false,
    });
  },

  setWinnerCount: (count: number) => {
    const { developers } = get();
    const maxWinnerCount = getMaxWinnerCountFromDevelopers(developers);
    const nextWinnerCount = Math.max(1, Math.min(count, maxWinnerCount));

    set({
      winnerCount: nextWinnerCount,
      winners: [],
      pendingWinners: [],
      previewWinners: getPreviewWinners(developers, nextWinnerCount),
    });
  },

  toggleDeveloperExclusion: (developerId: string) => {
    const { isSpinning, excludedDeveloperIds, allDevelopers } = get();
    if (isSpinning) return;

    const isExcluded = excludedDeveloperIds.includes(developerId);
    const nextExcludedDeveloperIds = isExcluded
      ? excludedDeveloperIds.filter((id) => id !== developerId)
      : [...excludedDeveloperIds, developerId];

    const nextDevelopers = allDevelopers.filter(
      (developer) => !nextExcludedDeveloperIds.includes(developer.id),
    );

    if (nextDevelopers.length < MIN_AVAILABLE_DEVELOPERS) {
      return;
    }

    const nextMaxWinnerCount = getMaxWinnerCountFromDevelopers(nextDevelopers);
    const nextWinnerCount = Math.max(
      1,
      Math.min(get().winnerCount, nextMaxWinnerCount),
    );

    set({
      excludedDeveloperIds: nextExcludedDeveloperIds,
      developers: nextDevelopers,
      winnerCount: nextWinnerCount,
      previewWinners: getPreviewWinners(nextDevelopers, nextWinnerCount),
      winners: [],
      pendingWinners: [],
    });
  },
}));

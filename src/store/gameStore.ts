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

export const useGameStore = create<GameState>((set, get) => ({
  isSpinning: false,
  allDevelopers: mockDevelopers,
  developers: mockDevelopers,
  excludedDeveloperIds: [],
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
    set({ winners: [], pendingWinners: [], isSpinning: false });
  },

  setWinnerCount: (count: number) => {
    const { developers } = get();
    const maxWinnerCount = getMaxWinnerCountFromDevelopers(developers);
    set({ winnerCount: Math.max(1, Math.min(count, maxWinnerCount)) });
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

    set({
      excludedDeveloperIds: nextExcludedDeveloperIds,
      developers: nextDevelopers,
      winnerCount: Math.max(1, Math.min(get().winnerCount, nextMaxWinnerCount)),
      winners: [],
      pendingWinners: [],
    });
  },
}));

import { create } from "zustand";

export interface Developer {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface GameState {
  isSpinning: boolean;
  developers: Developer[];
  winners: Developer[];
  pendingWinners: Developer[];
  winnerCount: number;
  spin: () => void;
  reset: () => void;
  setWinnerCount: (count: number) => void;
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

export const useGameStore = create<GameState>((set, get) => ({
  isSpinning: false,
  developers: mockDevelopers,
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
    set({ winnerCount: Math.max(1, Math.min(count, 3)) });
  },
}));

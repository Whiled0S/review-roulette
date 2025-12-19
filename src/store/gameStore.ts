import { create } from 'zustand';

export interface Developer {
  id: string;
  name: string;
  avatarUrl: string;
}

interface GameState {
  isSpinning: boolean;
  developers: Developer[];
  winners: Developer[];
  winnerCount: number;
  spin: () => void;
  reset: () => void;
  setWinnerCount: (count: number) => void;
}

const mockDevelopers: Developer[] = [
  {
    id: '1',
    name: 'Alex Chen',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
  },
  {
    id: '2',
    name: 'Sarah Miller',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mike',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Emma',
  },
  {
    id: '5',
    name: 'David Park',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David',
  },
  {
    id: '6',
    name: 'Lisa Zhang',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lisa',
  },
];

const selectRandomWinners = (
  developers: Developer[],
  count: number
): Developer[] => {
  const shuffled = [...developers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, developers.length));
};

export const useGameStore = create<GameState>((set, get) => ({
  isSpinning: false,
  developers: mockDevelopers,
  winners: [],
  winnerCount: 2,

  spin: () => {
    const { isSpinning, developers, winnerCount } = get();
    if (isSpinning) return;

    set({ isSpinning: true, winners: [] });

    const spinDuration = 3000 + Math.random() * 1000;

    setTimeout(() => {
      const winners = selectRandomWinners(developers, winnerCount);
      set({ isSpinning: false, winners });
    }, spinDuration);
  },

  reset: () => {
    set({ winners: [], isSpinning: false });
  },

  setWinnerCount: (count: number) => {
    set({ winnerCount: Math.max(1, Math.min(count, get().developers.length)) });
  },
}));


import { create } from 'zustand';

export interface Developer {
  id: string;
  name: string;
  avatarUrl?: string; // Optional - some developers may not have avatars
}

interface GameState {
  isSpinning: boolean;
  developers: Developer[];
  winners: Developer[];
  pendingWinners: Developer[]; // Pre-selected winners during spin
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
    // No avatar - will show initials "SM"
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mike',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    // No avatar - will show initials "EW"
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

// Select unique random winners
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
  pendingWinners: [],
  winnerCount: 2,

  spin: () => {
    const { isSpinning, developers, winnerCount } = get();
    if (isSpinning) return;

    // Pre-select unique winners before spinning
    const pendingWinners = selectRandomWinners(developers, winnerCount);
    
    set({ isSpinning: true, winners: [], pendingWinners });

    const spinDuration = 3000 + Math.random() * 1000;

    setTimeout(() => {
      // Use the pre-selected winners
      set({ isSpinning: false, winners: pendingWinners });
    }, spinDuration);
  },

  reset: () => {
    set({ winners: [], pendingWinners: [], isSpinning: false });
  },

  setWinnerCount: (count: number) => {
    // Limit to max 3 reels
    set({ winnerCount: Math.max(1, Math.min(count, 3)) });
  },
}));

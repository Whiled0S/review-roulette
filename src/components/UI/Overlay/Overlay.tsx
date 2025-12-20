import { useGameStore } from "../../../store/gameStore";
import { Header } from "./Header";
import { Controls } from "./Controls";
import { WinnersPanel } from "./WinnersPanel";
import "./Overlay.css";

/**
 * Main UI overlay component
 * Composes Header, Controls, and WinnersPanel
 */
export const Overlay = () => {
  const isSpinning = useGameStore((state) => state.isSpinning);
  const winners = useGameStore((state) => state.winners);
  const reset = useGameStore((state) => state.reset);

  const showWinners = winners.length > 0 && !isSpinning;

  return (
    <>
      <Header />
      <Controls />
      {showWinners && <WinnersPanel winners={winners} onClose={reset} />}
    </>
  );
};

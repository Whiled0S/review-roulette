import { useGameStore } from "../../../store/gameStore";

/**
 * Controls with reviewer count selector
 */
export const Controls = () => {
  const isSpinning = useGameStore((state) => state.isSpinning);
  const winnerCount = useGameStore((state) => state.winnerCount);
  const setWinnerCount = useGameStore((state) => state.setWinnerCount);

  return (
    <div className="overlay-controls">
      {/* Winner count selector */}
      <div className="reviewer-selector">
        <span className="reviewer-label">Reviewers:</span>
        <button
          onClick={() => setWinnerCount(winnerCount - 1)}
          disabled={winnerCount <= 1 || isSpinning}
          className="reviewer-btn"
        >
          −
        </button>
        <span className="reviewer-count">{winnerCount}</span>
        <button
          onClick={() => setWinnerCount(winnerCount + 1)}
          disabled={winnerCount >= 3 || isSpinning}
          className="reviewer-btn"
        >
          +
        </button>
      </div>
    </div>
  );
};

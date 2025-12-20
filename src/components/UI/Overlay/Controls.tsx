import { useGameStore } from "../../../store/gameStore";

/**
 * Spin controls with reviewer count selector and spin button
 */
export const Controls = () => {
  const isSpinning = useGameStore((state) => state.isSpinning);
  const spin = useGameStore((state) => state.spin);
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

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className={`spin-btn ${isSpinning ? "spin-btn--disabled" : ""}`}
      >
        {isSpinning ? (
          <span className="spin-btn-content">
            <svg className="spin-icon" viewBox="0 0 24 24" fill="none">
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Spinning...
          </span>
        ) : (
          "Spin!"
        )}
      </button>
    </div>
  );
};

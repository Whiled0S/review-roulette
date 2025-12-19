import { useGameStore } from '../../store/gameStore';
import './Overlay.css';

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Generate a color based on developer name
const getColorFromName = (name: string): string => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#a29bfe',
    '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#55efc4', '#fab1a0',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Overlay = () => {
  const { isSpinning, winners, spin, reset, winnerCount, setWinnerCount } =
    useGameStore();

  return (
    <>
      {/* Header */}
      <div className="overlay-header">
        <h1 className="overlay-title">REVIEW ROULETTE</h1>
        <p className="overlay-subtitle">
          Pull the lever to select your code reviewers
        </p>
      </div>

      {/* Controls */}
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
          className={`spin-btn ${isSpinning ? 'spin-btn--disabled' : ''}`}
        >
          {isSpinning ? (
            <span className="spin-btn-content">
              <svg
                className="spin-icon"
                viewBox="0 0 24 24"
                fill="none"
              >
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
            'Spin!'
          )}
        </button>
      </div>

      {/* Winners panel */}
      {winners.length > 0 && !isSpinning && (
        <div className="winners-panel">
          <div className="winners-content">
            <div className="winners-header">
              <h2 className="winners-title">🎉 Selected Reviewers</h2>
              <button onClick={reset} className="winners-close">
                ✕
              </button>
            </div>

            <div className="winners-list">
              {winners.map((winner, index) => (
                <div
                  key={winner.id}
                  className="winner-card"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="winner-avatar-wrapper">
                    {winner.avatarUrl ? (
                      <img
                        src={winner.avatarUrl}
                        alt={winner.name}
                        className="winner-avatar"
                      />
                    ) : (
                      <div
                        className="winner-avatar winner-avatar--initials"
                        style={{ backgroundColor: getColorFromName(winner.name) }}
                      >
                        {getInitials(winner.name)}
                      </div>
                    )}
                    <div className="winner-badge">{index + 1}</div>
                  </div>
                  <div className="winner-info">
                    <p className="winner-name">{winner.name}</p>
                    <p className="winner-status">Ready to review</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={spin} className="spin-again-btn">
              🎰 Spin Again
            </button>
          </div>
        </div>
      )}
    </>
  );
};

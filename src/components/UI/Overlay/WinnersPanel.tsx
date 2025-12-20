import type { Developer } from "../../../store/gameStore";
import { Avatar } from "../common";

interface WinnersPanelProps {
  winners: Developer[];
  onClose: () => void;
  onSpinAgain: () => void;
}

/**
 * Panel showing selected reviewers after spin completes
 */
export const WinnersPanel = ({
  winners,
  onClose,
  onSpinAgain,
}: WinnersPanelProps) => {
  return (
    <div className="winners-panel">
      <div className="winners-content">
        <div className="winners-header">
          <h2 className="winners-title">🎉 Selected Reviewers</h2>
          <button onClick={onClose} className="winners-close">
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
                <Avatar developer={winner} size={48} />
                <div className="winner-badge">{index + 1}</div>
              </div>
              <div className="winner-info">
                <p className="winner-name">{winner.name}</p>
                <p className="winner-status">Ready to review</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onSpinAgain} className="spin-again-btn">
          🎰 Spin Again
        </button>
      </div>
    </div>
  );
};

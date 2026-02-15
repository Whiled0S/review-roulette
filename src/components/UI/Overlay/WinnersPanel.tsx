import { XMarkIcon } from "@heroicons/react/24/solid";
import type { Developer } from "../../../store/gameStore";
import { Avatar } from "../common";

interface WinnersPanelProps {
  winners: Developer[];
  onClose: () => void;
}

/**
 * Panel showing selected reviewers after spin completes
 */
export const WinnersPanel = ({ winners, onClose }: WinnersPanelProps) => {
  return (
    <div className="winners-panel">
      <div className="winners-content">
        <div className="winners-header">
          <h2 className="winners-title">Selected Reviewers</h2>
          <button
            onClick={onClose}
            className="winners-close"
            aria-label="Close selected reviewers"
          >
            <XMarkIcon />
          </button>
        </div>

        <div className="winners-list">
          {winners.map((winner) => (
            <div
              key={winner.id}
              className="winner-card"
            >
              <div className="winner-avatar-wrapper">
                <Avatar developer={winner} size={48} />
              </div>
              <div className="winner-info">
                <p className="winner-name">{winner.name}</p>
                <p className="winner-status">Ready to review</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

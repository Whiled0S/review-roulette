import { useState } from "react";
import {
  Bars3Icon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useGameStore } from "../../../store/gameStore";

/**
 * Controls with reviewer count selector
 */
export const Controls = () => {
  const [isDeveloperMenuOpen, setIsDeveloperMenuOpen] = useState(false);
  const isSpinning = useGameStore((state) => state.isSpinning);
  const allDevelopers = useGameStore((state) => state.allDevelopers);
  const availableDevelopers = useGameStore((state) => state.developers);
  const excludedDeveloperIds = useGameStore((state) => state.excludedDeveloperIds);
  const winnerCount = useGameStore((state) => state.winnerCount);
  const setWinnerCount = useGameStore((state) => state.setWinnerCount);
  const toggleDeveloperExclusion = useGameStore(
    (state) => state.toggleDeveloperExclusion,
  );

  const availableDevelopersCount = availableDevelopers.length;
  const maxWinnerCount = Math.max(1, availableDevelopersCount - 1);

  return (
    <>
      <div className="overlay-controls">
        {/* Winner count selector */}
        <div className="reviewer-selector">
          <span className="reviewer-label">Slots:</span>
          <button
            onClick={() => setWinnerCount(winnerCount - 1)}
            disabled={winnerCount <= 1 || isSpinning}
            className="reviewer-btn"
            aria-label="Decrease slots"
          >
            <MinusIcon />
          </button>
          <span className="reviewer-count">{winnerCount}</span>
          <button
            onClick={() => setWinnerCount(winnerCount + 1)}
            disabled={winnerCount >= maxWinnerCount || isSpinning}
            className="reviewer-btn"
            aria-label="Increase slots"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <button
        className="developer-menu-btn"
        onClick={() => setIsDeveloperMenuOpen(true)}
        aria-label="Open developer filters"
      >
        <Bars3Icon aria-hidden="true" />
      </button>

      {isDeveloperMenuOpen && (
        <div className="developer-filter-panel">
          <div className="developer-filter-header">
            <p className="developer-filter-title">Developers in roulette</p>
            <button
              className="developer-filter-close"
              onClick={() => setIsDeveloperMenuOpen(false)}
              aria-label="Close developer filters"
            >
              <XMarkIcon />
            </button>
          </div>
          <div className="developer-list">
            {allDevelopers.map((developer) => {
              const isExcluded = excludedDeveloperIds.includes(developer.id);
              const isDisabled =
                isSpinning || (!isExcluded && availableDevelopersCount <= 2);

              return (
                <label
                  key={developer.id}
                  className={`developer-toggle ${isExcluded ? "developer-toggle--excluded" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    disabled={isDisabled}
                    onChange={() => toggleDeveloperExclusion(developer.id)}
                  />
                  <span>{developer.name}</span>
                </label>
              );
            })}
          </div>
          <p className="developer-filter-hint">
            Keep at least 2 developers available.
          </p>
        </div>
      )}
    </>
  );
};

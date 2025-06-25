import React, { useState } from 'react';
import type { TournamentMatch } from '../../types/database';

interface MatchResultModalProps {
  match: TournamentMatch;
  onClose: () => void;
  onSubmit: (result: {
    team1Score: number;
    team2Score: number;
    winnerId?: string;
    loserId?: string;
  }) => Promise<boolean>;
}

export default function MatchResultModal({ match, onClose, onSubmit }: MatchResultModalProps) {
  const [team1Score, setTeam1Score] = useState(match.team1_score || 0);
  const [team2Score, setTeam2Score] = useState(match.team2_score || 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let winnerId: string | undefined;
      let loserId: string | undefined;

      if (team1Score > team2Score) {
        winnerId = match.team1_id;
        loserId = match.team2_id;
      } else if (team2Score > team1Score) {
        winnerId = match.team2_id;
        loserId = match.team1_id;
      } else {
        setError('Matches cannot end in a draw. Please enter different scores.');
        setSubmitting(false);
        return;
      }

      const success = await onSubmit({
        team1Score,
        team2Score,
        winnerId,
        loserId
      });

      if (success) {
        onClose();
      } else {
        setError('Failed to update match result');
      }
    } catch (err) {
      setError('An error occurred while updating the match');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Update Match Result</h2>
        
        {error && (
          <div className="error-message mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team 1 Score */}
          <div className="card-team">
            <label className="block mb-2">
              <span className="text-sm text-gray-600">Team 1</span>
              <div className="font-semibold">
                {match.team1?.team?.name || 'Unknown Team'}
              </div>
            </label>
            <input
              type="number"
              min="0"
              value={team1Score}
              onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none"
              required
            />
          </div>

          {/* VS Separator */}
          <div className="text-center text-lg font-bold text-gray-400">VS</div>

          {/* Team 2 Score */}
          <div className="card-team">
            <label className="block mb-2">
              <span className="text-sm text-gray-600">Team 2</span>
              <div className="font-semibold">
                {match.team2?.team?.name || 'Unknown Team'}
              </div>
            </label>
            <input
              type="number"
              min="0"
              value={team2Score}
              onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none"
              required
            />
          </div>

          {/* Preview */}
          {(team1Score !== 0 || team2Score !== 0) && (
            <div className="bg-electric-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-2">Result Preview</div>
              <div className="flex items-center justify-center gap-4">
                <div className={`font-bold ${team1Score > team2Score ? 'text-energy-green text-xl' : 'text-gray-500'}`}>
                  {match.team1?.team?.name?.substring(0, 15)}
                  {team1Score > team2Score && ' 🏆'}
                </div>
                <div className="text-2xl font-bold">
                  {team1Score} - {team2Score}
                </div>
                <div className={`font-bold ${team2Score > team1Score ? 'text-energy-green text-xl' : 'text-gray-500'}`}>
                  {match.team2?.team?.name?.substring(0, 15)}
                  {team2Score > team1Score && ' 🏆'}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-game-primary flex-1"
            >
              {submitting ? 'Updating...' : 'Update Result'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-game-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useScheduledGames, useScheduledGame } from '../../hooks/useScheduledGames';
import { useAuth } from '../../hooks/useAuth';
import type { ScheduledGameParticipant } from '../../types/database';

interface GameRsvpFormProps {
  gameId: string;
  onSuccess?: () => void;
}

export function GameRsvpForm({ gameId, onSuccess }: GameRsvpFormProps) {
  const { user } = useAuth();
  const { updateRsvpStatus } = useScheduledGames();
  const { game, participants, loading, refetch } = useScheduledGame(gameId);
  const [teamPreference, setTeamPreference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Find current user's participation record
  const userParticipation = participants.find(p => p.user_id === user?.id);
  const acceptedCount = participants.filter(p => p.rsvp_status === 'accepted').length;
  const isFull = game && acceptedCount >= game.max_players;

  const handleRsvp = async (status: 'accepted' | 'declined' | 'tentative') => {
    if (!game || !user) return;

    setSubmitting(true);
    try {
      await updateRsvpStatus(gameId, status, teamPreference || undefined);
      await refetch();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  // Game has already started or ended
  if (game.status !== 'scheduled') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          This game has {game.status === 'in_progress' ? 'already started' : 'ended'}.
        </p>
      </div>
    );
  }

  const gameDate = new Date(game.scheduled_for);
  const isHost = user?.id === game.host_id;

  return (
    <div className="space-y-6">
      {/* Game Details */}
      <div className="bg-electric-50 rounded-lg p-4">
        <h3 className="font-semibold text-electric-700 mb-2">{game.title}</h3>
        {game.description && (
          <p className="text-sm text-gray-600 mb-3">{game.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Date & Time:</span>
            <p className="font-medium">
              {gameDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <p className="font-medium">{game.duration_minutes} minutes</p>
          </div>
        </div>
      </div>

      {/* Attendance Status */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Attendance</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {acceptedCount} of {game.max_players} spots filled
          </span>
          {isFull && !userParticipation?.rsvp_status?.includes('accepted') && (
            <span className="text-energy-red font-medium">Game is full</span>
          )}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-energy-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${(acceptedCount / game.max_players) * 100}%` }}
          />
        </div>
      </div>

      {/* RSVP Actions */}
      {isHost ? (
        <div className="text-center py-4 bg-plasma-50 rounded-lg">
          <p className="text-plasma-700 font-medium">You are hosting this game</p>
        </div>
      ) : userParticipation ? (
        <div className="space-y-4">
          {/* Current Status */}
          {userParticipation.rsvp_status !== 'invited' && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">
                Your current response: 
                <span className={`ml-2 font-semibold capitalize
                  ${userParticipation.rsvp_status === 'accepted' ? 'text-energy-green' : ''}
                  ${userParticipation.rsvp_status === 'declined' ? 'text-energy-red' : ''}
                  ${userParticipation.rsvp_status === 'tentative' ? 'text-energy-yellow' : ''}
                `}>
                  {userParticipation.rsvp_status}
                </span>
              </p>
            </div>
          )}

          {/* Team Preference */}
          {userParticipation.rsvp_status !== 'declined' && (
            <div>
              <label htmlFor="teamPreference" className="block text-sm font-medium text-gray-700 mb-1">
                Team Preference (Optional)
              </label>
              <input
                id="teamPreference"
                type="text"
                value={teamPreference}
                onChange={(e) => setTeamPreference(e.target.value)}
                placeholder="e.g., 'With friends' or 'Team name'"
                className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                disabled={submitting}
              />
            </div>
          )}

          {/* RSVP Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRsvp('accepted')}
              disabled={submitting || (isFull && userParticipation.rsvp_status !== 'accepted')}
              className={`
                py-2 px-4 rounded-lg font-medium transition-all
                ${userParticipation.rsvp_status === 'accepted'
                  ? 'bg-energy-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-energy-green hover:text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Accept
            </button>
            <button
              onClick={() => handleRsvp('tentative')}
              disabled={submitting}
              className={`
                py-2 px-4 rounded-lg font-medium transition-all
                ${userParticipation.rsvp_status === 'tentative'
                  ? 'bg-energy-yellow text-electric-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-energy-yellow hover:text-electric-900'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRsvp('declined')}
              disabled={submitting}
              className={`
                py-2 px-4 rounded-lg font-medium transition-all
                ${userParticipation.rsvp_status === 'declined'
                  ? 'bg-energy-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-energy-red hover:text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600">You have not been invited to this game.</p>
        </div>
      )}

      {/* Participant List */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Who's Coming</h4>
        <div className="space-y-2">
          {['accepted', 'tentative', 'declined'].map(status => {
            const statusParticipants = participants.filter(p => p.rsvp_status === status);
            if (statusParticipants.length === 0) return null;

            return (
              <div key={status} className="text-sm">
                <span className={`font-medium capitalize
                  ${status === 'accepted' ? 'text-energy-green' : ''}
                  ${status === 'tentative' ? 'text-energy-yellow' : ''}
                  ${status === 'declined' ? 'text-gray-400' : ''}
                `}>
                  {status} ({statusParticipants.length})
                </span>
                {status === 'accepted' && statusParticipants.map(p => p.team_preference).filter(Boolean).length > 0 && (
                  <div className="mt-1 ml-4 text-xs text-gray-500">
                    Team preferences: {statusParticipants.map(p => p.team_preference).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
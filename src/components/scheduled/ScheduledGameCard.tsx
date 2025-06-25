import React from 'react';
import type { ScheduledGame } from '../../types/database';

interface ScheduledGameCardProps {
  game: ScheduledGame;
  onClick?: () => void;
  showDate?: boolean;
}

export function ScheduledGameCard({ game, onClick, showDate = false }: ScheduledGameCardProps) {
  const gameDate = new Date(game.scheduled_for);
  const now = new Date();
  const isUpcoming = gameDate > now;
  const timeUntilGame = gameDate.getTime() - now.getTime();
  const hoursUntilGame = Math.floor(timeUntilGame / (1000 * 60 * 60));
  const isStartingSoon = isUpcoming && hoursUntilGame < 24;

  const getStatusBadge = () => {
    switch (game.status) {
      case 'scheduled':
        if (isStartingSoon) {
          return (
            <span className="badge badge--new">
              Starting Soon
            </span>
          );
        }
        return (
          <span className="px-2 py-1 bg-electric-100 text-electric-700 text-xs font-semibold rounded-md">
            Scheduled
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 bg-energy-green text-white text-xs font-semibold rounded-md animate-pulse">
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-energy-red text-white text-xs font-semibold rounded-md">
            Cancelled
          </span>
        );
    }
  };

  const formatTime = () => {
    return gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`
        card-game p-4 cursor-pointer transition-all duration-200
        ${game.status === 'cancelled' ? 'opacity-60' : ''}
        ${isStartingSoon ? 'border-energy-yellow shadow-lg' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title and Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-electric-700">
              {game.title}
            </h3>
            {getStatusBadge()}
          </div>

          {/* Description */}
          {game.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {game.description}
            </p>
          )}

          {/* Game Details */}
          <div className="flex flex-wrap gap-4 text-sm">
            {/* Time */}
            <div className="flex items-center gap-1 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="font-medium">{formatTime()}</span>
              {showDate && <span className="text-gray-500">• {formatDate()}</span>}
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span>{game.duration_minutes} min</span>
            </div>

            {/* Players */}
            <div className="flex items-center gap-1 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              <span>Max {game.max_players}</span>
            </div>

            {/* Recurring */}
            {game.recurring_pattern && game.recurring_pattern !== 'none' && (
              <div className="flex items-center gap-1 text-electric-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="font-medium capitalize">{game.recurring_pattern}</span>
              </div>
            )}
          </div>

          {/* Game Settings Preview */}
          {game.settings && (
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {game.settings.rounds} rounds
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {game.settings.time_per_question}s per question
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">
                {game.settings.difficulty}
              </span>
            </div>
          )}
        </div>

        {/* Action Icon */}
        <div className="ml-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
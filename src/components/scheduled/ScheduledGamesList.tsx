import React, { useEffect, useState } from 'react';
import { useScheduledGames } from '../../hooks/useScheduledGames';
import { ScheduledGameCard } from './ScheduledGameCard';
import type { ScheduledGame } from '../../types/database';

interface ScheduledGamesListProps {
  filter?: 'hosting' | 'participating' | 'all';
  onGameSelect?: (game: ScheduledGame) => void;
}

export function ScheduledGamesList({ filter = 'all', onGameSelect }: ScheduledGamesListProps) {
  const { scheduledGames, fetchScheduledGames, loading, error } = useScheduledGames();
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchScheduledGames(filter);
  }, [filter, fetchScheduledGames]);

  // Filter games based on view mode
  const filteredGames = scheduledGames.filter(game => {
    const gameDate = new Date(game.scheduled_for);
    const now = new Date();
    
    if (viewMode === 'upcoming') {
      return gameDate >= now && game.status !== 'cancelled';
    } else {
      return gameDate < now || game.status === 'completed' || game.status === 'cancelled';
    }
  });

  // Group games by date
  const groupedGames = filteredGames.reduce((groups, game) => {
    const date = new Date(game.scheduled_for).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(game);
    return groups;
  }, {} as Record<string, ScheduledGame[]>);

  const sortedDates = Object.keys(groupedGames).sort((a, b) => {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return viewMode === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message m-6">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-electric-700">Scheduled Games</h2>
        <div className="flex bg-electric-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              ${viewMode === 'upcoming' 
                ? 'bg-white text-electric-700 shadow-sm' 
                : 'text-electric-600 hover:text-electric-700'}
            `}
          >
            Upcoming
          </button>
          <button
            onClick={() => setViewMode('past')}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              ${viewMode === 'past' 
                ? 'bg-white text-electric-700 shadow-sm' 
                : 'text-electric-600 hover:text-electric-700'}
            `}
          >
            Past
          </button>
        </div>
      </div>

      {/* Games List */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No {viewMode} games
          </h3>
          <p className="text-sm text-gray-500">
            {viewMode === 'upcoming' 
              ? "You don't have any scheduled games coming up." 
              : "You don't have any past games to show."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateString => {
            const date = new Date(dateString);
            const isToday = date.toDateString() === new Date().toDateString();
            const formattedDate = isToday 
              ? 'Today' 
              : date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                });

            return (
              <div key={dateString}>
                <h3 className="text-lg font-semibold text-electric-700 mb-3 flex items-center">
                  {formattedDate}
                  {isToday && (
                    <span className="ml-2 px-2 py-1 bg-energy-yellow text-electric-900 text-xs font-bold rounded-md">
                      TODAY
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {groupedGames[dateString].map(game => (
                    <ScheduledGameCard
                      key={game.id}
                      game={game}
                      onClick={() => onGameSelect?.(game)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
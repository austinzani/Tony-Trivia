import React, { useState } from 'react';
import { CreateScheduledGameForm } from './CreateScheduledGameForm';
import { ScheduledGamesList } from './ScheduledGamesList';
import { ScheduledGamesCalendar } from './ScheduledGamesCalendar';
import { GameRsvpForm } from './GameRsvpForm';
import { useAuth } from '../../hooks/useAuth';
import type { ScheduledGame } from '../../types/database';

export function ScheduledGamesManager() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ScheduledGame | null>(null);
  const [filter, setFilter] = useState<'all' | 'hosting' | 'participating'>('all');

  const handleGameCreated = (gameId: string) => {
    setShowCreateForm(false);
    // Could optionally navigate to the new game or refresh the list
  };

  const handleGameSelect = (game: ScheduledGame) => {
    setSelectedGame(game);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-electric-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-electric-700">Scheduled Games</h1>
              <p className="text-sm text-gray-600 mt-1">
                Plan and manage your upcoming trivia games
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-game-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              Schedule Game
            </button>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* View Toggle */}
          <div className="flex bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setView('list')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${view === 'list' 
                  ? 'bg-electric-500 text-white' 
                  : 'text-electric-600 hover:text-electric-700'}
              `}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${view === 'calendar' 
                  ? 'bg-electric-500 text-white' 
                  : 'text-electric-600 hover:text-electric-700'}
              `}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              Calendar
            </button>
          </div>

          {/* Filter (List view only) */}
          {view === 'list' && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-electric-200 rounded-lg text-sm font-medium text-electric-700 focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            >
              <option value="all">All Games</option>
              <option value="hosting">Games I'm Hosting</option>
              <option value="participating">Games I'm In</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm">
          {view === 'list' ? (
            <ScheduledGamesList 
              filter={filter} 
              onGameSelect={handleGameSelect}
            />
          ) : (
            <ScheduledGamesCalendar />
          )}
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CreateScheduledGameForm
              onSuccess={handleGameCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Game Details/RSVP Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-electric-700">Game Details</h2>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <GameRsvpForm
                gameId={selectedGame.id}
                onSuccess={() => {
                  // Optionally refresh the list or show a success message
                }}
              />

              {/* Host Actions */}
              {user?.id === selectedGame.host_id && selectedGame.status === 'scheduled' && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <button className="w-full btn-game-secondary">
                    Edit Game
                  </button>
                  <button className="w-full text-energy-red hover:bg-red-50 py-2 rounded-lg transition-colors">
                    Cancel Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
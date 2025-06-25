import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentService } from '../services/tournamentService';
import type { Tournament } from '../types/database';
import { useAuth } from '../hooks/useAuth';

export default function TournamentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed' | 'mine'>('all');

  useEffect(() => {
    loadTournaments();
  }, [filter, user]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      let filters: any = {};
      
      switch (filter) {
        case 'active':
          filters.status = 'in_progress';
          break;
        case 'upcoming':
          filters.status = 'registration_open';
          break;
        case 'completed':
          filters.status = 'completed';
          break;
        case 'mine':
          if (user) {
            filters.hostId = user.id;
          }
          break;
      }

      const data = await TournamentService.listTournaments(filters);
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'registration_open':
        return 'bg-energy-yellow text-electric-900';
      case 'in_progress':
        return 'bg-energy-green text-white';
      case 'completed':
        return 'bg-electric-600 text-white';
      case 'cancelled':
        return 'bg-energy-red text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getFormatIcon = (format: Tournament['format']) => {
    switch (format) {
      case 'single_elimination':
        return '🏆';
      case 'double_elimination':
        return '🎯';
      case 'round_robin':
        return '🔄';
      case 'swiss':
        return '♟️';
      default:
        return '🎮';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Tournaments' },
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'mine', label: 'My Tournaments' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-display">Tournaments</h1>
        <button
          onClick={() => navigate('/tournament/create')}
          className="btn-game-primary"
        >
          Create Tournament
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === option.value
                ? 'bg-electric-500 text-white'
                : 'bg-white text-gray-700 hover:bg-electric-50 border border-electric-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-game animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-100 rounded mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="card-game text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No tournaments found</p>
          <p className="text-gray-500">
            {filter === 'mine' 
              ? "You haven't created any tournaments yet."
              : "Be the first to create a tournament!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tournament => (
            <div
              key={tournament.id}
              onClick={() => navigate(`/tournament/${tournament.id}`)}
              className="card-game hover:scale-[1.02] cursor-pointer"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex-1 pr-2">
                  {tournament.name}
                </h3>
                <div className={`badge ${getStatusColor(tournament.status)}`}>
                  {tournament.status.replace('_', ' ')}
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {tournament.description}
                </p>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getFormatIcon(tournament.format)}</span>
                  <div>
                    <div className="text-xs text-gray-500">Format</div>
                    <div className="font-medium">
                      {tournament.format.replace('_', ' ').split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Teams</div>
                  <div className="font-medium">
                    {tournament.current_round > 0 ? `Round ${tournament.current_round}` : `Max ${tournament.max_teams}`}
                  </div>
                </div>

                {tournament.start_date && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Starts</div>
                    <div className="font-medium">
                      {new Date(tournament.start_date).toLocaleDateString()} at{' '}
                      {new Date(tournament.start_date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar for Active Tournaments */}
              {tournament.status === 'in_progress' && tournament.total_rounds && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>Round {tournament.current_round}/{tournament.total_rounds}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar__fill"
                      style={{ 
                        width: `${(tournament.current_round / tournament.total_rounds) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Host Badge */}
              {user && tournament.host_id === user.id && (
                <div className="mt-4 flex items-center gap-2 text-sm text-electric-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">You're the host</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
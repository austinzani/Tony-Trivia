import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TournamentService } from '../../services/tournamentService';
import type { Tournament, TournamentParticipant, TournamentMatch } from '../../types/database';
import BracketVisualization from './BracketVisualization';
import TournamentStandings from './TournamentStandings';
import MatchResultModal from './MatchResultModal';
import { useAuth } from '../../hooks/useAuth';

export default function TournamentManagement() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'participants' | 'matches'>('overview');
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
      
      // Subscribe to real-time updates
      const subscription = TournamentService.subscribeTournamentUpdates(
        tournamentId,
        () => loadTournamentData()
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const [tournamentData, participantsData, matchesData] = await Promise.all([
        TournamentService.getTournament(tournamentId),
        TournamentService.getParticipants(tournamentId),
        TournamentService.getMatches(tournamentId)
      ]);

      setTournament(tournamentData);
      setParticipants(participantsData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Tournament['status']) => {
    if (!tournament || !tournamentId) return;
    
    const success = await TournamentService.updateTournamentStatus(tournamentId, newStatus);
    if (success) {
      setTournament({ ...tournament, status: newStatus });
      
      // Generate brackets/schedule when moving to in_progress
      if (newStatus === 'in_progress') {
        if (tournament.format === 'single_elimination') {
          await TournamentService.generateSingleEliminationBracket(tournamentId);
        } else if (tournament.format === 'round_robin') {
          await TournamentService.generateRoundRobinSchedule(tournamentId);
        }
        loadTournamentData();
      }
    }
  };

  const handleMatchUpdate = async (match: TournamentMatch) => {
    setSelectedMatch(match);
  };

  const handleMatchResultSubmit = async (result: {
    team1Score: number;
    team2Score: number;
    winnerId?: string;
    loserId?: string;
  }) => {
    if (!selectedMatch) return false;
    
    const success = await TournamentService.updateMatchResult(selectedMatch.id, result);
    if (success) {
      await loadTournamentData();
    }
    return success;
  };

  const isHost = user?.id === tournament?.host_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Tournament not found</div>
      </div>
    );
  }

  const statusBadgeClass = {
    draft: 'badge bg-gray-200 text-gray-800',
    registration_open: 'badge bg-energy-yellow text-electric-900',
    in_progress: 'badge bg-energy-green text-white',
    completed: 'badge bg-electric-600 text-white',
    cancelled: 'badge bg-energy-red text-white'
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="card-game mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-display mb-2">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-gray-600">{tournament.description}</p>
            )}
          </div>
          <div className={statusBadgeClass[tournament.status]}>
            {tournament.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Tournament Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Format:</span>
            <span className="ml-2 font-medium">
              {tournament.format.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Teams:</span>
            <span className="ml-2 font-medium">
              {participants.length} / {tournament.max_teams}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Round:</span>
            <span className="ml-2 font-medium">
              {tournament.current_round} / {tournament.total_rounds || '?'}
            </span>
          </div>
          {tournament.start_date && (
            <div>
              <span className="text-gray-500">Start:</span>
              <span className="ml-2 font-medium">
                {new Date(tournament.start_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Host Actions */}
        {isHost && (
          <div className="mt-6 flex gap-3">
            {tournament.status === 'draft' && (
              <>
                <button
                  onClick={() => handleStatusChange('registration_open')}
                  className="btn-game-primary"
                  disabled={participants.length < tournament.min_teams}
                >
                  Open Registration
                </button>
                <button
                  onClick={() => navigate(`/tournament/${tournamentId}/edit`)}
                  className="btn-game-secondary"
                >
                  Edit Settings
                </button>
              </>
            )}
            {tournament.status === 'registration_open' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                className="btn-game-primary"
                disabled={participants.length < tournament.min_teams}
              >
                Start Tournament ({participants.length} teams)
              </button>
            )}
            {tournament.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="btn-game-secondary"
              >
                End Tournament
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'bracket', 'participants', 'matches'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-electric-500 text-white'
                : 'bg-white text-gray-700 hover:bg-electric-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-game">
        {activeTab === 'overview' && (
          <div>
            {tournament.format === 'single_elimination' && tournament.status === 'in_progress' && (
              <BracketVisualization
                matches={matches}
                totalRounds={tournament.total_rounds || 0}
                onMatchClick={isHost ? handleMatchUpdate : undefined}
              />
            )}
            {tournament.format === 'round_robin' && tournament.status === 'in_progress' && (
              <TournamentStandings tournamentId={tournamentId!} />
            )}
            {tournament.status === 'draft' && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">
                  Tournament is in draft mode. Open registration to allow teams to join.
                </p>
                {isHost && participants.length < tournament.min_teams && (
                  <p className="text-sm text-gray-500">
                    Need at least {tournament.min_teams - participants.length} more teams to start.
                  </p>
                )}
              </div>
            )}
            {tournament.status === 'registration_open' && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">
                  Registration is open! Teams can now join the tournament.
                </p>
                <div className="text-3xl font-bold text-electric-600">
                  {participants.length} / {tournament.max_teams}
                </div>
                <p className="text-sm text-gray-500 mt-2">Teams registered</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bracket' && tournament.format === 'single_elimination' && (
          <BracketVisualization
            matches={matches}
            totalRounds={tournament.total_rounds || 0}
            onMatchClick={isHost ? handleMatchUpdate : undefined}
          />
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Registered Teams</h3>
              {isHost && tournament.status === 'registration_open' && (
                <button className="btn-game-secondary">
                  Add Team
                </button>
              )}
            </div>
            <div className="grid gap-3">
              {participants.map((participant) => (
                <div key={participant.id} className="card-team">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">
                        {participant.team?.name || 'Unknown Team'}
                      </h4>
                      {participant.seed && (
                        <span className="text-sm text-gray-500">
                          Seed #{participant.seed}
                        </span>
                      )}
                    </div>
                    <div className={`badge ${
                      participant.status === 'active' ? 'bg-energy-green text-white' :
                      participant.status === 'eliminated' ? 'bg-energy-red text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {participant.status}
                    </div>
                  </div>
                  {participant.stats && (
                    <div className="mt-2 text-sm text-gray-600">
                      W: {participant.stats.matches_won} - L: {participant.stats.matches_lost}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">All Matches</h3>
            {Array.from({ length: tournament.total_rounds || 0 }, (_, i) => i + 1).map(round => {
              const roundMatches = matches.filter(m => m.round === round);
              if (roundMatches.length === 0) return null;

              return (
                <div key={round} className="mb-6">
                  <h4 className="font-semibold mb-3">Round {round}</h4>
                  <div className="grid gap-3">
                    {roundMatches.map(match => (
                      <div
                        key={match.id}
                        className={`card-team cursor-pointer ${
                          match.status === 'in_progress' ? 'border-energy-green' : ''
                        }`}
                        onClick={() => isHost && handleMatchUpdate(match)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-medium ${
                                match.winner_id === match.team1_id ? 'text-energy-green' : ''
                              }`}>
                                {match.team1?.team?.name || 'TBD'}
                              </span>
                              {match.status === 'completed' && (
                                <span className="font-bold">{match.team1_score}</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${
                                match.winner_id === match.team2_id ? 'text-energy-green' : ''
                              }`}>
                                {match.team2?.team?.name || 'TBD'}
                              </span>
                              {match.status === 'completed' && (
                                <span className="font-bold">{match.team2_score}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className={`badge ${
                              match.status === 'completed' ? 'bg-gray-200 text-gray-700' :
                              match.status === 'in_progress' ? 'bg-energy-green text-white' :
                              'bg-energy-yellow text-electric-900'
                            }`}>
                              {match.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Match Result Modal */}
      {selectedMatch && isHost && (
        <MatchResultModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSubmit={handleMatchResultSubmit}
        />
      )}
    </div>
  );
}
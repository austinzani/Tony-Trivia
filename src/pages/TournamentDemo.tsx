import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateTournamentForm from '../components/tournament/CreateTournamentForm';
import BracketVisualization from '../components/tournament/BracketVisualization';
import TournamentStandings from '../components/tournament/TournamentStandings';
import type { TournamentMatch, TournamentParticipant } from '../types/database';

export default function TournamentDemo() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'overview' | 'create' | 'bracket' | 'standings'>('overview');

  // Demo data for bracket visualization
  const demoMatches: TournamentMatch[] = [
    // Round 1
    {
      id: '1',
      tournament_id: 'demo',
      round: 1,
      match_number: 1,
      bracket_position: 'R1M1',
      team1_id: 'p1',
      team2_id: 'p2',
      team1_score: 850,
      team2_score: 720,
      winner_id: 'p1',
      loser_id: 'p2',
      status: 'completed',
      game_room_id: null,
      match_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team1: {
        id: 'p1',
        tournament_id: 'demo',
        team_id: 't1',
        status: 'active',
        stats: { matches_played: 1, matches_won: 1, matches_lost: 0, points_scored: 850, points_conceded: 720 },
        registered_at: new Date().toISOString(),
        team: { id: 't1', room_id: 'r1', name: 'Quiz Masters', score: 0, created_at: new Date().toISOString(), members: [] }
      },
      team2: {
        id: 'p2',
        tournament_id: 'demo',
        team_id: 't2',
        status: 'eliminated',
        stats: { matches_played: 1, matches_won: 0, matches_lost: 1, points_scored: 720, points_conceded: 850 },
        registered_at: new Date().toISOString(),
        team: { id: 't2', room_id: 'r1', name: 'Brain Storm', score: 0, created_at: new Date().toISOString(), members: [] }
      }
    },
    {
      id: '2',
      tournament_id: 'demo',
      round: 1,
      match_number: 2,
      bracket_position: 'R1M2',
      team1_id: 'p3',
      team2_id: 'p4',
      team1_score: 920,
      team2_score: 880,
      winner_id: 'p3',
      loser_id: 'p4',
      status: 'completed',
      game_room_id: null,
      match_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team1: {
        id: 'p3',
        tournament_id: 'demo',
        team_id: 't3',
        status: 'active',
        stats: { matches_played: 1, matches_won: 1, matches_lost: 0, points_scored: 920, points_conceded: 880 },
        registered_at: new Date().toISOString(),
        team: { id: 't3', room_id: 'r1', name: 'Trivia Titans', score: 0, created_at: new Date().toISOString(), members: [] }
      },
      team2: {
        id: 'p4',
        tournament_id: 'demo',
        team_id: 't4',
        status: 'eliminated',
        stats: { matches_played: 1, matches_won: 0, matches_lost: 1, points_scored: 880, points_conceded: 920 },
        registered_at: new Date().toISOString(),
        team: { id: 't4', room_id: 'r1', name: 'Know It Alls', score: 0, created_at: new Date().toISOString(), members: [] }
      }
    },
    // Finals
    {
      id: '3',
      tournament_id: 'demo',
      round: 2,
      match_number: 3,
      bracket_position: 'F',
      team1_id: 'p1',
      team2_id: 'p3',
      team1_score: 0,
      team2_score: 0,
      status: 'in_progress',
      game_room_id: null,
      match_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team1: {
        id: 'p1',
        tournament_id: 'demo',
        team_id: 't1',
        status: 'active',
        stats: { matches_played: 1, matches_won: 1, matches_lost: 0, points_scored: 850, points_conceded: 720 },
        registered_at: new Date().toISOString(),
        team: { id: 't1', room_id: 'r1', name: 'Quiz Masters', score: 0, created_at: new Date().toISOString(), members: [] }
      },
      team2: {
        id: 'p3',
        tournament_id: 'demo',
        team_id: 't3',
        status: 'active',
        stats: { matches_played: 1, matches_won: 1, matches_lost: 0, points_scored: 920, points_conceded: 880 },
        registered_at: new Date().toISOString(),
        team: { id: 't3', room_id: 'r1', name: 'Trivia Titans', score: 0, created_at: new Date().toISOString(), members: [] }
      }
    }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: '📋' },
    { value: 'create', label: 'Create Tournament', icon: '✨' },
    { value: 'bracket', label: 'Bracket Demo', icon: '🏆' },
    { value: 'standings', label: 'Standings Demo', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-display mb-4">Tournament System Demo</h1>
          <p className="text-lg text-gray-600">
            Create and manage exciting tournament-style competitions for Tony Trivia
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {viewOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setActiveView(option.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeView === option.value
                  ? 'bg-electric-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-electric-50 border border-electric-200'
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="card-game">
              <h2 className="text-xl font-bold mb-4">Tournament Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-electric-600">Tournament Formats</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <div>
                        <strong>Single Elimination:</strong> Classic bracket format where teams are eliminated after one loss
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <div>
                        <strong>Round Robin:</strong> Every team plays every other team, with standings based on points
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-yellow">⏳</span>
                      <div>
                        <strong>Double Elimination:</strong> Teams get a second chance in a losers bracket (Coming Soon)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-yellow">⏳</span>
                      <div>
                        <strong>Swiss System:</strong> Teams are paired based on performance (Coming Soon)
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-electric-600">Key Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <span>Visual bracket display with live updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <span>Automatic advancement and standings calculation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <span>Customizable match settings and categories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <span>Real-time tournament progression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-energy-green">✓</span>
                      <span>Tournament history and statistics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-game text-center">
                <div className="text-3xl mb-2">🏅</div>
                <h3 className="font-semibold mb-1">Host Tournaments</h3>
                <p className="text-sm text-gray-600">
                  Create and manage tournaments with full control over format and settings
                </p>
              </div>
              <div className="card-game text-center">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold mb-1">Team Registration</h3>
                <p className="text-sm text-gray-600">
                  Teams can register and track their progress throughout the tournament
                </p>
              </div>
              <div className="card-game text-center">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-semibold mb-1">Live Tracking</h3>
                <p className="text-sm text-gray-600">
                  Real-time updates on matches, scores, and tournament progression
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/tournaments')}
                className="btn-game-primary"
              >
                View All Tournaments
              </button>
              <button
                onClick={() => setActiveView('create')}
                className="btn-game-secondary"
              >
                Create a Tournament
              </button>
            </div>
          </div>
        )}

        {activeView === 'create' && (
          <div>
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                Fill out the form below to create a new tournament
              </p>
            </div>
            <CreateTournamentForm />
          </div>
        )}

        {activeView === 'bracket' && (
          <div className="space-y-6">
            <div className="card-game">
              <h2 className="text-xl font-bold mb-4">Single Elimination Bracket Demo</h2>
              <p className="text-gray-600 mb-6">
                Interactive bracket visualization showing tournament progression
              </p>
              <BracketVisualization
                matches={demoMatches}
                totalRounds={2}
                onMatchClick={(match) => {
                  console.log('Match clicked:', match);
                  alert(`Match clicked: ${match.team1?.team?.name} vs ${match.team2?.team?.name}`);
                }}
              />
            </div>
          </div>
        )}

        {activeView === 'standings' && (
          <div className="space-y-6">
            <div className="card-game">
              <h2 className="text-xl font-bold mb-4">Round Robin Standings Demo</h2>
              <p className="text-gray-600 mb-6">
                Live standings table for round-robin tournaments
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-center text-gray-500">
                  Standings will be displayed here when a round-robin tournament is active
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
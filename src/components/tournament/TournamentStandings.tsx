import React, { useState, useEffect } from 'react';
import { TournamentService } from '../../services/tournamentService';
import type { TournamentStanding } from '../../types/database';

interface TournamentStandingsProps {
  tournamentId: string;
  compact?: boolean;
}

export default function TournamentStandings({ 
  tournamentId, 
  compact = false 
}: TournamentStandingsProps) {
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [tournamentId]);

  const loadStandings = async () => {
    setLoading(true);
    try {
      const data = await TournamentService.getStandings(tournamentId);
      setStandings(data);
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No standings available yet
      </div>
    );
  }

  const columns = compact 
    ? ['Pos', 'Team', 'Pts', 'W-L']
    : ['Position', 'Team', 'Played', 'Won', 'Lost', 'Drawn', 'Points For', 'Points Against', '+/-', 'Points'];

  return (
    <div className={`${compact ? '' : 'overflow-x-auto'}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-electric-200">
            {columns.map(col => (
              <th key={col} className="text-left py-3 px-2 font-semibold text-sm">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => {
            const isTop3 = standing.position <= 3;
            const positionBadgeClass = 
              standing.position === 1 ? 'bg-energy-yellow text-electric-900' :
              standing.position === 2 ? 'bg-gray-300 text-gray-800' :
              standing.position === 3 ? 'bg-orange-400 text-white' : '';

            return (
              <tr 
                key={standing.id}
                className={`border-b hover:bg-electric-50 transition-colors ${
                  isTop3 ? 'font-medium' : ''
                }`}
              >
                {compact ? (
                  <>
                    <td className="py-3 px-2">
                      {isTop3 ? (
                        <span className={`badge ${positionBadgeClass}`}>
                          {standing.position}
                        </span>
                      ) : (
                        standing.position
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {standing.participant?.team?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-2 font-bold text-electric-600">
                      {standing.tournament_points}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {standing.matches_won}-{standing.matches_lost}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-2">
                      {isTop3 ? (
                        <span className={`badge ${positionBadgeClass}`}>
                          {standing.position}
                        </span>
                      ) : (
                        standing.position
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">
                          {standing.participant?.team?.name || 'Unknown'}
                        </div>
                        {standing.participant?.status === 'eliminated' && (
                          <span className="text-xs text-energy-red">Eliminated</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{standing.matches_played}</td>
                    <td className="py-3 px-2 text-center text-energy-green font-medium">
                      {standing.matches_won}
                    </td>
                    <td className="py-3 px-2 text-center text-energy-red font-medium">
                      {standing.matches_lost}
                    </td>
                    <td className="py-3 px-2 text-center">{standing.matches_drawn}</td>
                    <td className="py-3 px-2 text-center">{standing.points_for}</td>
                    <td className="py-3 px-2 text-center">{standing.points_against}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={standing.points_difference > 0 ? 'text-energy-green' : 
                                     standing.points_difference < 0 ? 'text-energy-red' : ''}>
                        {standing.points_difference > 0 ? '+' : ''}{standing.points_difference}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-electric-600 text-lg">
                        {standing.tournament_points}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {!compact && standings.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Tiebreaker Rules:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Total Points</li>
            <li>Head-to-Head Record</li>
            <li>Points Difference</li>
            <li>Points Scored</li>
          </ol>
        </div>
      )}
    </div>
  );
}
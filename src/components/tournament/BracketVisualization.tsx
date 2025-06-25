import React, { useMemo } from 'react';
import type { TournamentMatch, TournamentParticipant } from '../../types/database';

interface BracketVisualizationProps {
  matches: TournamentMatch[];
  totalRounds: number;
  onMatchClick?: (match: TournamentMatch) => void;
}

interface BracketMatch extends TournamentMatch {
  roundName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function BracketVisualization({ 
  matches, 
  totalRounds,
  onMatchClick 
}: BracketVisualizationProps) {
  const bracketData = useMemo(() => {
    const matchHeight = 80;
    const matchWidth = 200;
    const roundGap = 250;
    const matchGap = 20;

    const rounds: BracketMatch[][] = [];
    
    // Group matches by round
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches
        .filter(m => m.round === round)
        .sort((a, b) => a.match_number - b.match_number);
      
      rounds.push(roundMatches as BracketMatch[]);
    }

    // Calculate positions
    rounds.forEach((roundMatches, roundIndex) => {
      const round = roundIndex + 1;
      const x = roundIndex * roundGap + 20;
      const totalHeight = rounds[0].length * (matchHeight + matchGap) - matchGap;
      const roundHeight = roundMatches.length * (matchHeight + matchGap) - matchGap;
      const yOffset = (totalHeight - roundHeight) / 2;

      roundMatches.forEach((match, matchIndex) => {
        const bracketMatch = match as BracketMatch;
        bracketMatch.x = x;
        bracketMatch.y = yOffset + matchIndex * (matchHeight + matchGap) * Math.pow(2, roundIndex);
        bracketMatch.width = matchWidth;
        bracketMatch.height = matchHeight;
        
        // Set round names
        if (round === totalRounds) {
          bracketMatch.roundName = 'Final';
        } else if (round === totalRounds - 1) {
          bracketMatch.roundName = 'Semifinals';
        } else if (round === totalRounds - 2) {
          bracketMatch.roundName = 'Quarterfinals';
        } else {
          bracketMatch.roundName = `Round ${round}`;
        }
      });
    });

    return rounds;
  }, [matches, totalRounds]);

  const svgWidth = totalRounds * 250 + 40;
  const svgHeight = Math.pow(2, totalRounds - 1) * 100 + 40;

  const renderMatch = (match: BracketMatch) => {
    const team1 = match.team1;
    const team2 = match.team2;
    const isComplete = match.status === 'completed';
    const isBye = match.status === 'bye';
    const isLive = match.status === 'in_progress';

    return (
      <g key={match.id}>
        {/* Match box */}
        <rect
          x={match.x}
          y={match.y}
          width={match.width}
          height={match.height}
          rx={8}
          className={`
            fill-white stroke-2 cursor-pointer transition-all
            ${isLive ? 'stroke-energy-green animate-pulse' : 
              isComplete ? 'stroke-electric-500' : 'stroke-electric-200'}
            hover:stroke-electric-600 hover:shadow-lg
          `}
          onClick={() => onMatchClick?.(match)}
        />

        {/* Team 1 */}
        <g>
          <rect
            x={match.x}
            y={match.y}
            width={match.width}
            height={match.height / 2}
            rx={8}
            className={`
              ${team1 && match.winner_id === team1.id ? 'fill-electric-100' : 'fill-transparent'}
            `}
          />
          <text
            x={match.x + 10}
            y={match.y + match.height / 4 + 5}
            className="text-sm font-medium fill-gray-900"
          >
            {team1?.team?.name || (isBye ? 'BYE' : 'TBD')}
          </text>
          {isComplete && (
            <text
              x={match.x + match.width - 30}
              y={match.y + match.height / 4 + 5}
              className="text-sm font-bold fill-electric-600"
            >
              {match.team1_score}
            </text>
          )}
        </g>

        {/* Divider */}
        <line
          x1={match.x}
          y1={match.y + match.height / 2}
          x2={match.x + match.width}
          y2={match.y + match.height / 2}
          className="stroke-electric-200"
        />

        {/* Team 2 */}
        <g>
          <rect
            x={match.x}
            y={match.y + match.height / 2}
            width={match.width}
            height={match.height / 2}
            rx={8}
            className={`
              ${team2 && match.winner_id === team2.id ? 'fill-electric-100' : 'fill-transparent'}
            `}
          />
          <text
            x={match.x + 10}
            y={match.y + 3 * match.height / 4 + 5}
            className="text-sm font-medium fill-gray-900"
          >
            {team2?.team?.name || 'TBD'}
          </text>
          {isComplete && (
            <text
              x={match.x + match.width - 30}
              y={match.y + 3 * match.height / 4 + 5}
              className="text-sm font-bold fill-electric-600"
            >
              {match.team2_score}
            </text>
          )}
        </g>

        {/* Live indicator */}
        {isLive && (
          <circle
            cx={match.x + match.width - 15}
            cy={match.y + 15}
            r={5}
            className="fill-energy-green animate-pulse"
          />
        )}
      </g>
    );
  };

  const renderConnectors = () => {
    const connectors = [];
    
    for (let roundIndex = 0; roundIndex < bracketData.length - 1; roundIndex++) {
      const currentRound = bracketData[roundIndex];
      const nextRound = bracketData[roundIndex + 1];
      
      nextRound.forEach((nextMatch, nextIndex) => {
        const sourceMatches = currentRound.slice(nextIndex * 2, nextIndex * 2 + 2);
        
        sourceMatches.forEach((sourceMatch, sourceIndex) => {
          const startX = sourceMatch.x + sourceMatch.width;
          const startY = sourceMatch.y + sourceMatch.height / 2;
          const endX = nextMatch.x;
          const endY = nextMatch.y + (sourceIndex === 0 ? nextMatch.height / 4 : 3 * nextMatch.height / 4);
          const midX = (startX + endX) / 2;
          
          connectors.push(
            <path
              key={`connector-${sourceMatch.id}-${nextMatch.id}`}
              d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
              fill="none"
              className="stroke-2 stroke-electric-300"
            />
          );
        });
      });
    }
    
    return connectors;
  };

  const renderRoundLabels = () => {
    return bracketData.map((round, index) => {
      if (round.length === 0) return null;
      
      const match = round[0];
      return (
        <text
          key={`round-${index}`}
          x={match.x + match.width / 2}
          y={20}
          textAnchor="middle"
          className="text-lg font-bold fill-electric-700"
        >
          {match.roundName}
        </text>
      );
    });
  };

  return (
    <div className="overflow-auto bg-gray-50 p-4 rounded-lg">
      <svg width={svgWidth} height={svgHeight}>
        {/* Render connectors first (behind matches) */}
        {renderConnectors()}
        
        {/* Render round labels */}
        {renderRoundLabels()}
        
        {/* Render matches */}
        {bracketData.flat().map(renderMatch)}
      </svg>
    </div>
  );
}
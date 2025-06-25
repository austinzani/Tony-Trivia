import React, { useState, useEffect } from 'react';
import { useScheduledGames } from '../../hooks/useScheduledGames';
import type { ScheduledGame } from '../../types/database';

interface CalendarDay {
  date: Date;
  games: ScheduledGame[];
  isCurrentMonth: boolean;
}

export function ScheduledGamesCalendar() {
  const { fetchGamesByDateRange, loading, error } = useScheduledGames();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedGame, setSelectedGame] = useState<ScheduledGame | null>(null);

  // Generate calendar days for the current month view
  const generateCalendarDays = (games: ScheduledGame[]) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of the month and its day of week
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayGames = games.filter(game => {
        const gameDate = new Date(game.scheduled_for);
        return gameDate.toDateString() === currentDate.toDateString();
      });
      
      days.push({
        date: new Date(currentDate),
        games: dayGames,
        isCurrentMonth: currentDate.getMonth() === month
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  // Fetch games for the current month view
  useEffect(() => {
    const fetchMonthGames = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Get wider range to include games from previous/next month visible in calendar
      const startDate = new Date(year, month - 1, 20);
      const endDate = new Date(year, month + 1, 10);
      
      try {
        const games = await fetchGamesByDateRange(startDate, endDate);
        generateCalendarDays(games);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      }
    };
    
    fetchMonthGames();
  }, [currentMonth, fetchGamesByDateRange]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGameStatusColor = (status: ScheduledGame['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-electric-500';
      case 'in_progress': return 'bg-energy-green';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-energy-red';
      default: return 'bg-gray-400';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-electric-700">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-electric-100 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-electric-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium text-electric-700 hover:bg-electric-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-electric-100 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-electric-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message mb-4">
          {error}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-electric-100 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-electric-50 border-b border-electric-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-4 py-3 text-sm font-semibold text-electric-700 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString();
              const isPast = day.date < today;
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-2 border-r border-b border-electric-100
                    ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                    ${isToday ? 'bg-electric-50' : ''}
                    ${index % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                    ${isToday ? 'text-electric-600' : ''}
                    ${isPast && day.isCurrentMonth ? 'text-gray-500' : ''}
                  `}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Games for this day */}
                  <div className="space-y-1">
                    {day.games.slice(0, 3).map(game => (
                      <button
                        key={game.id}
                        onClick={() => setSelectedGame(game)}
                        className={`
                          w-full text-left px-2 py-1 rounded text-xs font-medium text-white
                          ${getGameStatusColor(game.status)}
                          hover:opacity-90 transition-opacity truncate
                        `}
                        title={game.title}
                      >
                        {formatTime(game.scheduled_for)} - {game.title}
                      </button>
                    ))}
                    {day.games.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.games.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Game Details Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-electric-700">{selectedGame.title}</h3>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedGame.description && (
              <p className="text-gray-600 mb-4">{selectedGame.description}</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time:</span>
                <span className="font-medium">
                  {new Date(selectedGame.scheduled_for).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{selectedGame.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max Players:</span>
                <span className="font-medium">{selectedGame.max_players}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`
                  font-medium capitalize
                  ${selectedGame.status === 'scheduled' ? 'text-electric-600' : ''}
                  ${selectedGame.status === 'in_progress' ? 'text-energy-green' : ''}
                  ${selectedGame.status === 'completed' ? 'text-gray-600' : ''}
                  ${selectedGame.status === 'cancelled' ? 'text-energy-red' : ''}
                `}>
                  {selectedGame.status.replace('_', ' ')}
                </span>
              </div>
              {selectedGame.recurring_pattern && selectedGame.recurring_pattern !== 'none' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Repeats:</span>
                  <span className="font-medium capitalize">{selectedGame.recurring_pattern}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedGame(null)}
                className="btn-game-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useScheduledGames } from '../../hooks/useScheduledGames';
import type { GameSettings } from '../../types/database';

interface CreateScheduledGameFormProps {
  onSuccess?: (gameId: string) => void;
  onCancel?: () => void;
}

export function CreateScheduledGameForm({ onSuccess, onCancel }: CreateScheduledGameFormProps) {
  const { createScheduledGame, loading, error } = useScheduledGames();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [recurringPattern, setRecurringPattern] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  
  // Game settings
  const [rounds, setRounds] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [enableChat, setEnableChat] = useState(true);
  const [enableHints, setEnableHints] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !scheduledDate || !scheduledTime) {
      return;
    }

    // Combine date and time into ISO string
    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    
    const settings: GameSettings = {
      rounds,
      time_per_question: timePerQuestion,
      categories: [], // Can be added later
      difficulty,
      enable_chat: enableChat,
      enable_hints: enableHints,
      point_system: 'standard'
    };

    try {
      const game = await createScheduledGame({
        title,
        description,
        scheduled_for: scheduledFor,
        duration_minutes: duration,
        max_players: maxPlayers,
        settings,
        recurring_pattern: recurringPattern,
        recurring_end_date: recurringEndDate || undefined
      });
      
      onSuccess?.(game.id);
    } catch (err) {
      console.error('Failed to create scheduled game:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-electric-700 mb-2">Schedule a Game</h2>
        <p className="text-sm text-gray-600">Plan your trivia game in advance</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Game Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Friday Night Trivia"
            className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Join us for an exciting trivia night!"
            rows={3}
            className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
          />
        </div>
      </div>

      {/* Schedule Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-electric-700">Schedule</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              required
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Time *
            </label>
            <input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
            min="15"
            max="180"
            className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
          />
        </div>
      </div>

      {/* Recurring Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-electric-700">Recurring Game</h3>
        
        <div>
          <label htmlFor="recurring" className="block text-sm font-medium text-gray-700 mb-1">
            Repeat
          </label>
          <select
            id="recurring"
            value={recurringPattern}
            onChange={(e) => setRecurringPattern(e.target.value as any)}
            className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
          >
            <option value="none">Don't repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {recurringPattern !== 'none' && (
          <div>
            <label htmlFor="recurringEnd" className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              id="recurringEnd"
              type="date"
              value={recurringEndDate}
              onChange={(e) => setRecurringEndDate(e.target.value)}
              min={scheduledDate}
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>
        )}
      </div>

      {/* Game Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-electric-700">Game Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-1">
              Max Players
            </label>
            <input
              id="maxPlayers"
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 20)}
              min="2"
              max="100"
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>

          <div>
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Rounds
            </label>
            <input
              id="rounds"
              type="number"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value) || 5)}
              min="1"
              max="20"
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="timePerQuestion" className="block text-sm font-medium text-gray-700 mb-1">
              Time per Question (seconds)
            </label>
            <input
              id="timePerQuestion"
              type="number"
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 30)}
              min="10"
              max="120"
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-4 py-2 border border-electric-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enableChat}
              onChange={(e) => setEnableChat(e.target.checked)}
              className="w-4 h-4 text-electric-600 border-electric-300 rounded focus:ring-electric-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Chat</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enableHints}
              onChange={(e) => setEnableHints(e.target.checked)}
              className="w-4 h-4 text-electric-600 border-electric-300 rounded focus:ring-electric-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Hints</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-game-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-game-primary"
          disabled={loading || !title || !scheduledDate || !scheduledTime}
        >
          {loading ? 'Creating...' : 'Schedule Game'}
        </button>
      </div>
    </form>
  );
}
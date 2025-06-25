import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentService } from '../../services/tournamentService';
import type { Tournament, TournamentSettings } from '../../types/database';

export default function CreateTournamentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'single_elimination' as Tournament['format'],
    maxTeams: 16,
    minTeams: 2,
    startDate: '',
    startTime: '',
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    roundsPerMatch: 1,
    timePerRound: 30,
    categories: [] as string[]
  });

  const formatOptions = [
    { value: 'single_elimination', label: 'Single Elimination', description: 'Win or go home' },
    { value: 'round_robin', label: 'Round Robin', description: 'Everyone plays everyone' },
    { value: 'double_elimination', label: 'Double Elimination', description: 'Second chance bracket (Coming Soon)', disabled: true },
    { value: 'swiss', label: 'Swiss System', description: 'Paired by performance (Coming Soon)', disabled: true }
  ];

  const categoryOptions = [
    'General Knowledge',
    'Science',
    'History',
    'Sports',
    'Music',
    'Movies',
    'TV Shows',
    'Geography',
    'Literature',
    'Technology'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const settings: TournamentSettings = {
        match_settings: {
          rounds_per_match: formData.roundsPerMatch,
          time_per_round: formData.timePerRound,
          categories: formData.categories.length > 0 ? formData.categories : undefined
        }
      };

      if (formData.format === 'round_robin') {
        settings.points_per_win = formData.pointsPerWin;
        settings.points_per_draw = formData.pointsPerDraw;
        settings.points_per_loss = formData.pointsPerLoss;
        settings.tiebreaker_rules = [
          'points',
          'head_to_head',
          'points_difference',
          'points_scored'
        ];
      }

      const startDateTime = formData.startDate && formData.startTime
        ? new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
        : undefined;

      const tournament = await TournamentService.createTournament({
        name: formData.name,
        description: formData.description,
        format: formData.format,
        maxTeams: formData.maxTeams,
        minTeams: formData.minTeams,
        settings,
        startDate: startDateTime
      });

      if (tournament) {
        navigate(`/tournament/${tournament.id}`);
      } else {
        setError('Failed to create tournament');
      }
    } catch (err) {
      setError('An error occurred while creating the tournament');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="card-game">
        <h2 className="text-display mb-6">Create Tournament</h2>
        
        {error && (
          <div className="error-message mb-4">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="Spring Championship 2025"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
              rows={3}
              placeholder="Join us for an exciting trivia tournament..."
            />
          </div>
        </div>

        {/* Tournament Format */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-3">
            Tournament Format
          </label>
          <div className="grid gap-3">
            {formatOptions.map((option) => (
              <label
                key={option.value}
                className={`card-team cursor-pointer ${
                  formData.format === option.value ? 'card-team--selected' : ''
                } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={formData.format === option.value}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as Tournament['format'] })}
                  disabled={option.disabled}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                  {formData.format === option.value && (
                    <div className="text-electric-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Team Settings */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxTeams" className="block text-sm font-medium mb-1">
              Maximum Teams
            </label>
            <input
              type="number"
              id="maxTeams"
              min="2"
              max="128"
              value={formData.maxTeams}
              onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="minTeams" className="block text-sm font-medium mb-1">
              Minimum Teams
            </label>
            <input
              type="number"
              id="minTeams"
              min="2"
              max={formData.maxTeams}
              value={formData.minTeams}
              onChange={(e) => setFormData({ ...formData, minTeams: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-1">
              Start Time (Optional)
            </label>
            <input
              type="time"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Round Robin Specific Settings */}
        {formData.format === 'round_robin' && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Point System</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="pointsPerWin" className="block text-sm font-medium mb-1">
                  Points per Win
                </label>
                <input
                  type="number"
                  id="pointsPerWin"
                  min="0"
                  value={formData.pointsPerWin}
                  onChange={(e) => setFormData({ ...formData, pointsPerWin: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="pointsPerDraw" className="block text-sm font-medium mb-1">
                  Points per Draw
                </label>
                <input
                  type="number"
                  id="pointsPerDraw"
                  min="0"
                  value={formData.pointsPerDraw}
                  onChange={(e) => setFormData({ ...formData, pointsPerDraw: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="pointsPerLoss" className="block text-sm font-medium mb-1">
                  Points per Loss
                </label>
                <input
                  type="number"
                  id="pointsPerLoss"
                  min="0"
                  value={formData.pointsPerLoss}
                  onChange={(e) => setFormData({ ...formData, pointsPerLoss: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Match Settings */}
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Match Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="roundsPerMatch" className="block text-sm font-medium mb-1">
                Rounds per Match
              </label>
              <input
                type="number"
                id="roundsPerMatch"
                min="1"
                max="10"
                value={formData.roundsPerMatch}
                onChange={(e) => setFormData({ ...formData, roundsPerMatch: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="timePerRound" className="block text-sm font-medium mb-1">
                Seconds per Question
              </label>
              <input
                type="number"
                id="timePerRound"
                min="10"
                max="120"
                step="5"
                value={formData.timePerRound}
                onChange={(e) => setFormData({ ...formData, timePerRound: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-electric-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-3">
            Categories (Optional - select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((category) => (
              <label
                key={category}
                className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.categories.includes(category)
                    ? 'border-electric-500 bg-electric-50 text-electric-700'
                    : 'border-gray-200 hover:border-electric-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-game-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Tournament...' : 'Create Tournament'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="btn-game-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
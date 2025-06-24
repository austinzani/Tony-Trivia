import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  SecuritySchemas,
  rateLimiters,
  validateSecurely,
} from '../utils/security';

// Enhanced Zod schema for form validation with security measures
const gameFormSchema = z.object({
  name: SecuritySchemas.gameRoomName,
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .transform(desc => (desc ? SecuritySchemas.chatMessage.parse(desc) : '')),
  maxPlayers: z
    .number()
    .min(2, 'Must allow at least 2 players')
    .max(50, 'Cannot exceed 50 players'),
  rounds: z
    .number()
    .min(1, 'Must have at least 1 round')
    .max(10, 'Cannot exceed 10 rounds'),
  timePerQuestion: z
    .number()
    .min(10, 'Must allow at least 10 seconds per question')
    .max(300, 'Cannot exceed 5 minutes per question'),
  category: z.enum(
    ['general', 'science', 'history', 'sports', 'entertainment'],
    {
      required_error: 'Please select a category',
    }
  ),
  isPrivate: z.boolean(),
});

// Infer TypeScript type from Zod schema
type GameFormData = z.infer<typeof gameFormSchema>;

interface GameFormProps {
  onSubmit: (data: GameFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function GameForm({
  onSubmit,
  isLoading = false,
}: GameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setError,
  } = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: '',
      description: '',
      maxPlayers: 10,
      rounds: 3,
      timePerQuestion: 60,
      category: 'general',
      isPrivate: false,
    },
  });

  const maxPlayers = watch('maxPlayers');
  const timePerQuestion = watch('timePerQuestion');

  const onFormSubmit = async (data: GameFormData) => {
    try {
      // Check rate limiting for game room creation
      const clientId = `game_create_${Date.now() % 1000000}`;
      const rateLimitValidation = validateSecurely(
        z.object({}),
        {},
        clientId,
        rateLimiters.gameRoomCreation
      );

      if (!rateLimitValidation.success) {
        setError('root', {
          type: 'manual',
          message: rateLimitValidation.error,
        });
        return;
      }

      await onSubmit(data);
      reset(); // Reset form after successful submission
    } catch (error) {
      console.error('Form submission error:', error);
      setError('root', {
        type: 'manual',
        message: 'Failed to create game. Please try again.',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Game</h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Root errors (rate limiting, etc.) */}
        {errors.root && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
            {errors.root.message}
          </div>
        )}

        {/* Game Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Game Name *
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter game name"
            maxLength={50}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register('description')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Brief description of your game"
            rows={3}
            maxLength={200}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Max Players */}
        <div>
          <label
            htmlFor="maxPlayers"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Players: {maxPlayers}
          </label>
          <input
            id="maxPlayers"
            type="range"
            min="2"
            max="50"
            {...register('maxPlayers', { valueAsNumber: true })}
            className="w-full"
          />
          {errors.maxPlayers && (
            <p className="text-red-600 text-sm mt-1">
              {errors.maxPlayers.message}
            </p>
          )}
        </div>

        {/* Number of Rounds */}
        <div>
          <label
            htmlFor="rounds"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of Rounds *
          </label>
          <select
            id="rounds"
            {...register('rounds', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.rounds
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>
                {num} Round{num !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          {errors.rounds && (
            <p className="text-red-600 text-sm mt-1">{errors.rounds.message}</p>
          )}
        </div>

        {/* Time per Question */}
        <div>
          <label
            htmlFor="timePerQuestion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time per Question: {timePerQuestion} seconds
          </label>
          <input
            id="timePerQuestion"
            type="range"
            min="10"
            max="300"
            step="10"
            {...register('timePerQuestion', { valueAsNumber: true })}
            className="w-full"
          />
          {errors.timePerQuestion && (
            <p className="text-red-600 text-sm mt-1">
              {errors.timePerQuestion.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category *
          </label>
          <select
            id="category"
            {...register('category')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.category
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="general">General Knowledge</option>
            <option value="science">Science</option>
            <option value="history">History</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
          </select>
          {errors.category && (
            <p className="text-red-600 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Private Game Checkbox */}
        <div className="flex items-center">
          <input
            id="isPrivate"
            type="checkbox"
            {...register('isPrivate')}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isPrivate"
            className="text-sm font-medium text-gray-700"
          >
            Private Game (invite only)
          </label>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          🔒 All game data is protected and filtered for inappropriate content
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || isLoading
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting || isLoading ? 'Creating Game...' : 'Create Game'}
        </button>
      </form>
    </div>
  );
}

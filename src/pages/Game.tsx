import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GameList from '../components/GameList';
import PageTransition from '../components/PageTransition';
import AnimatedButton from '../components/AnimatedButton';

// Zod schema for join game form
const joinGameSchema = z.object({
  gameCode: z
    .string()
    .min(1, 'Game code is required')
    .length(6, 'Game code must be exactly 6 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Game code must contain only uppercase letters and numbers'
    ),
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .min(2, 'Player name must be at least 2 characters')
    .max(30, 'Player name must be less than 30 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Player name can only contain letters and spaces'),
  teamName: z
    .string()
    .max(25, 'Team name must be less than 25 characters')
    .optional(),
});

type JoinGameForm = z.infer<typeof joinGameSchema>;

export default function Game() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JoinGameForm>({
    resolver: zodResolver(joinGameSchema),
  });

  const onSubmit = async (data: JoinGameForm) => {
    try {
      console.log('Join game data:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(
        `Joining game ${data.gameCode} as ${data.playerName}!${data.teamName ? ` Team: ${data.teamName}` : ''}`
      );
      reset();
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              🎮 Join Game
            </h1>
            <p className="text-lg text-gray-600">
              Enter a game code to join a trivia session
            </p>
          </header>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Join Game Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Join with Game Code
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="gameCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Game Code *
                  </label>
                  <input
                    id="gameCode"
                    type="text"
                    placeholder="ABC123"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.gameCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('gameCode')}
                  />
                  {errors.gameCode && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.gameCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="playerName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Name *
                  </label>
                  <input
                    id="playerName"
                    type="text"
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.playerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('playerName')}
                  />
                  {errors.playerName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.playerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Team Name (Optional)
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    placeholder="The Quiz Masters"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.teamName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...register('teamName')}
                  />
                  {errors.teamName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.teamName.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500'
                    }`}
                  >
                    {isSubmitting ? 'Joining...' : 'Join Game'}
                  </button>

                  <Link to="/">
                    <AnimatedButton variant="secondary">
                      Back to Home
                    </AnimatedButton>
                  </Link>
                </div>
              </form>
            </div>

            {/* Available Games List */}
            <div>
              <GameList />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GameList from '../components/GameList';
import PageTransition from '../components/PageTransition';
import AnimatedButton from '../components/AnimatedButton';
import { MobileButton, MobileInput, MobileCard } from '../components/ui';

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
      <div className="min-h-screen bg-gradient-to-br from-electric-50 to-plasma-50 safe-padding-top safe-padding-bottom">
        <div className="container mx-auto mobile-padding py-4 sm:py-6 lg:py-8">
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-electric-900 mb-2">
              🎮 Join Game
            </h1>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              Enter a game code to join a trivia session
            </p>
          </header>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Join Game Form */}
            <MobileCard className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                Join with Game Code
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <MobileInput
                    id="gameCode"
                    type="text"
                    placeholder="ABC123"
                    label="Game Code *"
                    error={!!errors.gameCode}
                    errorMessage={errors.gameCode?.message}
                    {...register('gameCode')}
                  />
                </div>

                <div>
                  <MobileInput
                    id="playerName"
                    type="text"
                    placeholder="John Doe"
                    label="Your Name *"
                    error={!!errors.playerName}
                    errorMessage={errors.playerName?.message}
                    {...register('playerName')}
                  />
                </div>

                <div>
                  <MobileInput
                    id="teamName"
                    type="text"
                    placeholder="The Quiz Masters"
                    label="Team Name (Optional)"
                    error={!!errors.teamName}
                    errorMessage={errors.teamName?.message}
                    {...register('teamName')}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <MobileButton
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="sm:flex-1"
                    loading={isSubmitting}
                  >
                    {isSubmitting ? 'Joining...' : 'Join Game'}
                  </MobileButton>

                  <Link to="/" className="sm:flex-1">
                    <MobileButton
                      variant="secondary"
                      size="lg"
                      fullWidth
                    >
                      Back to Home
                    </MobileButton>
                  </Link>
                </div>
              </form>
            </MobileCard>

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

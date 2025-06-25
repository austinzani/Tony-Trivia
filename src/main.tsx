import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './styles/mobile.css';

// Import pages
import Home from './pages/Home';
import Game from './pages/Game';
import Host from './pages/Host';
import MobileDemo from './pages/MobileDemo';
import HostDemo from './pages/HostDemo';
import { ScheduledGamesDemo } from './pages/ScheduledGamesDemo';
import { SocialFeaturesDemo } from './pages/SocialFeaturesDemo';
import TournamentList from './pages/TournamentList';
import CreateTournamentForm from './components/tournament/CreateTournamentForm';
import TournamentManagement from './components/tournament/TournamentManagement';
import TournamentDemo from './pages/TournamentDemo';
import { QuestionSetsDemo } from './pages/QuestionSetsDemo';

// Import auth components
import ProtectedRoute from './components/ProtectedRoute';

// Import error boundary, connection status, and error display
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorDisplay from './components/ErrorDisplay';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/game',
    element: (
      <ProtectedRoute>
        <Game />
      </ProtectedRoute>
    ),
  },
  {
    path: '/host',
    element: (
      <ProtectedRoute>
        <Host />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Password Reset
          </h1>
          <p className="text-gray-600">
            This page will handle password reset confirmations from email links.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Implementation coming soon...
          </p>
        </div>
      </div>
    ),
  },
  {
    path: '/mobile-demo',
    element: <MobileDemo />,
  },
  {
    path: '/host-demo',
    element: <HostDemo />,
  },
  {
    path: '/scheduled-games',
    element: (
      <ProtectedRoute>
        <ScheduledGamesDemo />
      </ProtectedRoute>
    ),
  },
  {
    path: '/social-demo',
    element: <SocialFeaturesDemo />,
  },
  {
    path: '/tournaments',
    element: (
      <ProtectedRoute>
        <TournamentList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournament/create',
    element: (
      <ProtectedRoute>
        <CreateTournamentForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournament/:tournamentId',
    element: (
      <ProtectedRoute>
        <TournamentManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournament-demo',
    element: <TournamentDemo />,
  },
  {
    path: '/question-sets-demo',
    element: <QuestionSetsDemo />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ConnectionStatus />
        <ErrorDisplay position="top-right" maxErrors={3} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

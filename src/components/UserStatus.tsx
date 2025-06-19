import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUser, useIsAuthenticated } from '../stores/useAppStore';
import AuthForm from './AuthForm';

export default function UserStatus() {
  const { user: authUser, signOut, loading } = useAuth();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      setShowAuthForm(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthForm(false);
  };

  if (loading) {
    return (
      <div className="card bg-gray-50 border-gray-200 mb-4">
        <div className="flex items-center justify-center py-4">
          <svg
            className="animate-spin h-5 w-5 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showAuthForm) {
      return (
        <div className="mb-4">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Authentication</h3>
            <button
              onClick={() => setShowAuthForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <AuthForm
            mode={authMode}
            onModeChange={setAuthMode}
            onSuccess={handleAuthSuccess}
          />
        </div>
      );
    }

    return (
      <div className="card bg-blue-50 border-blue-200 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-blue-800 font-medium">Not Signed In</h4>
            <p className="text-blue-600 text-sm">
              Sign in to join games and track your progress
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAuthMode('signin');
                setShowAuthForm(true);
              }}
              className="btn-primary"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setShowAuthForm(true);
              }}
              className="btn-secondary"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-green-50 border-green-200 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-green-800 font-medium">Welcome, {user?.name}!</h4>
          <div className="text-green-600 text-sm space-y-1">
            <p>Status: {user?.isHost ? 'Host' : 'Player'}</p>
            {authUser?.email && <p>Email: {authUser.email}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // TODO: Implement profile editing
              alert('Profile editing will be implemented');
            }}
            className="btn-secondary text-sm"
          >
            Edit Profile
          </button>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

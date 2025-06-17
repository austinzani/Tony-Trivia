import {
  useUser,
  useIsAuthenticated,
  useAppActions,
} from '../stores/useAppStore';

export default function UserStatus() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { setUser, logout } = useAppActions();

  const handleLogin = () => {
    const mockUser = {
      id: '1',
      name: 'Demo User',
      isHost: false,
    };
    setUser(mockUser);
  };

  if (!isAuthenticated) {
    return (
      <div className="card bg-blue-50 border-blue-200 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-blue-800 font-medium">Not Logged In</h4>
            <p className="text-blue-600 text-sm">
              Click to simulate user login
            </p>
          </div>
          <button onClick={handleLogin} className="btn-primary">
            Demo Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-green-50 border-green-200 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-green-800 font-medium">Welcome, {user?.name}!</h4>
          <p className="text-green-600 text-sm">
            Status: {user?.isHost ? 'Host' : 'Player'}
          </p>
        </div>
        <button onClick={logout} className="btn-secondary">
          Logout
        </button>
      </div>
    </div>
  );
}

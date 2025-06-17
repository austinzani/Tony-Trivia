import { motion } from 'framer-motion';

export default function EnvDemo() {
  // Access environment variables using import.meta.env (Vite's way)
  const appName = import.meta.env.VITE_APP_NAME || 'Tony Trivia';
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';
  const nodeEnv = import.meta.env.VITE_NODE_ENV || 'development';
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  const mockApi = import.meta.env.VITE_MOCK_API === 'true';
  const maxPlayers = import.meta.env.VITE_MAX_PLAYERS_PER_GAME || '20';
  const questionTime = import.meta.env.VITE_DEFAULT_QUESTION_TIME || '30';

  const envVars = [
    { key: 'App Name', value: appName },
    { key: 'Version', value: appVersion },
    { key: 'Environment', value: nodeEnv },
    { key: 'Debug Mode', value: debugMode ? 'Enabled' : 'Disabled' },
    { key: 'Mock API', value: mockApi ? 'Enabled' : 'Disabled' },
    { key: 'Max Players', value: maxPlayers },
    { key: 'Question Time', value: `${questionTime}s` },
  ];

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        ⚙️ Environment Configuration
      </h3>

      <div className="space-y-2">
        {envVars.map((envVar, index) => (
          <motion.div
            key={envVar.key}
            className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.2 }}
          >
            <span className="text-sm font-medium text-gray-600">
              {envVar.key}:
            </span>
            <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
              {envVar.value}
            </span>
          </motion.div>
        ))}
      </div>

      {debugMode && (
        <motion.div
          className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-yellow-800 text-sm">
            🐛 Debug mode is enabled - additional logging and development
            features are active.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

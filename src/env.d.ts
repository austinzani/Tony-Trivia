/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_NODE_ENV: string;

  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;

  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Game Configuration
  readonly VITE_MAX_PLAYERS_PER_GAME: string;
  readonly VITE_DEFAULT_QUESTION_TIME: string;
  readonly VITE_MAX_GAME_DURATION: string;

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_CHAT: string;
  readonly VITE_ENABLE_LEADERBOARD: string;

  // Development Settings
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_MOCK_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
 
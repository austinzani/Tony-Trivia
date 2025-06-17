# 🎯 Tony Trivia

A modern, real-time web-based trivia platform built with React, TypeScript, and Supabase.

## 📋 Features

- **Real-time Gameplay**: Live trivia sessions with instant updates
- **Team Management**: Create and join teams for collaborative play
- **Multiple Question Types**: Support for various trivia categories and difficulties
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Live Leaderboard**: Real-time scoring and rankings
- **Game Hosting**: Easy game creation and management tools
- **Animations**: Smooth, modern UI animations with Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tony-trivia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Application Configuration
   VITE_APP_NAME=Tony Trivia
   VITE_APP_VERSION=0.1.0
   
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Game Configuration
   VITE_MAX_PLAYERS_PER_GAME=20
   VITE_DEFAULT_QUESTION_TIME=30
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit `http://localhost:5173` to see the application.

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Backend**: Supabase (Database, Auth, Real-time)
- **Deployment**: Ready for Vercel, Netlify, or similar platforms

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnimatedButton.tsx
│   ├── EnvDemo.tsx
│   ├── GameForm.tsx
│   ├── GameList.tsx
│   ├── PageTransition.tsx
│   ├── RouterTest.tsx
│   └── UserStatus.tsx
├── hooks/              # Custom React hooks
│   └── useGameData.ts
├── pages/              # Page components
│   ├── Game.tsx        # Join game page
│   ├── Home.tsx        # Landing page
│   └── Host.tsx        # Game hosting page
├── services/           # External service integrations
│   ├── auth.ts         # Authentication services
│   └── supabase.ts     # Supabase client
├── stores/             # Global state management
│   └── useAppStore.ts  # Zustand store
├── types/              # TypeScript type definitions
│   └── database.ts     # Database schema types
├── utils/              # Utility functions
│   └── gameUtils.ts    # Game-related helpers
├── assets/             # Static assets
└── env.d.ts           # Environment variable types
```

## 🎮 How to Play

### For Hosts

1. **Create a Game**
   - Navigate to `/host`
   - Fill in game details (name, rounds, time limits, etc.)
   - Click "Create Game" to generate a game code

2. **Manage Your Game**
   - Share the game code with players
   - Monitor team registrations
   - Start the game when ready

### For Players

1. **Join a Game**
   - Navigate to `/game`
   - Enter the game code provided by the host
   - Create or join a team
   - Wait for the host to start the game

2. **Play the Game**
   - Answer questions within the time limit
   - Collaborate with your team
   - Track your progress on the leaderboard

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🌍 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `VITE_APP_NAME` | Application name | No | Tony Trivia |
| `VITE_MAX_PLAYERS_PER_GAME` | Max players per game | No | 20 |
| `VITE_DEFAULT_QUESTION_TIME` | Default question time (seconds) | No | 30 |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No | false |
| `VITE_DEBUG_MODE` | Enable debug mode | No | false |

## 🔐 Authentication

The application uses Supabase Auth for user management:

- **Email/Password Authentication**: Standard signup and login
- **Session Management**: Automatic token refresh and persistence
- **Protected Routes**: Authentication-required features
- **User Profiles**: Extended user data storage

## 📊 Database Schema

The application uses the following main tables:

- `game_rooms` - Game session information
- `teams` - Team data and membership
- `questions` - Trivia questions and answers
- `user_profiles` - Extended user information
- `game_stats` - Performance tracking

## 🚀 Deployment

### Vercel (Recommended)

1. Fork/clone this repository
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure environment variables
4. Set up continuous deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the Tony Trivia Team**

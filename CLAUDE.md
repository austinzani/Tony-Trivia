# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Tony Trivia is a real-time web-based trivia platform that replicates the Last Call Trivia experience. It features confidence-based scoring where teams assign point values (1,3,5 then 2,4,6) to their answers.

## Essential Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:5173
npm run build        # Production build with TypeScript checks
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # Check TypeScript types without building
npm run format       # Format code with Prettier
```

### Setup & Environment
```bash
npm run setup        # Install dependencies and create .env file
npm run check-env    # Verify environment configuration
```

### Performance & Testing
```bash
npm run build:perf   # Full build with analysis (clean + type-check + lint + analyze)
npm run preview      # Preview production build locally
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand stores in `src/stores/`
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS + Framer Motion animations
- **Data Fetching**: TanStack Query with custom hooks

### Key Directories
- `src/components/game/` - Core game components (AnswerSubmission, Timer, Leaderboard)
- `src/components/host/` - Host control interfaces
- `src/hooks/` - Business logic hooks (useGameRoom, useTeamManagement, useRealtimeSync)
- `src/services/` - Supabase integration and game logic
- `src/stores/` - Zustand state management (gameStore, teamStore, hostStore)
- `src/types/` - TypeScript type definitions

### Critical Patterns
1. **Real-time Communication**: All game state changes flow through Supabase Realtime channels
2. **Error Handling**: Components use error boundaries and retry logic for resilience
3. **Performance**: Code splitting, lazy loading, and memoization for large game rooms
4. **Security**: Input validation with Zod, sanitization with DOMPurify, rate limiting

### Game Flow Architecture
1. Host creates game room → generates unique 6-character code
2. Players join via code → form/join teams
3. Host starts round → presents questions
4. Teams submit answers with confidence points
5. Host reviews answers → assigns scores
6. Real-time leaderboard updates via WebSocket
7. Game ends → final statistics displayed

### Database Schema (Supabase)
- `game_rooms` - Game session data
- `teams` - Team information
- `players` - User/player data
- `questions` - Question bank
- `answers` - Submitted answers
- `scores` - Scoring records

### Environment Requirements
Must configure in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Common Development Tasks
- New components go in appropriate `src/components/` subdirectory
- Business logic belongs in custom hooks under `src/hooks/`
- Supabase queries/mutations in `src/services/`
- Always run `npm run type-check` and `npm run lint` before committing
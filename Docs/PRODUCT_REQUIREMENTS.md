# Tony Trivia - Product Requirements Document
*Web-Based Live Trivia Platform*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Game Format & Rules](#game-format--rules)
3. [Core Features](#core-features)
4. [User Stories & Flows](#user-stories--flows)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [Real-time Communication](#real-time-communication)
8. [Security & Access Control](#security--access-control)
9. [Scalability Considerations](#scalability-considerations)
10. [Edge Cases & Error Handling](#edge-cases--error-handling)
11. [Development Phases](#development-phases)
12. [Performance Requirements](#performance-requirements)

---

## Project Overview

**Vision:** Create a web-based trivia platform that replicates the engaging Last Call Trivia experience for remote and distributed teams, enabling friends to play together regardless of location.

**Core Value Proposition:**
- Authentic Last Call Trivia format with confidence-based scoring
- Real-time multiplayer experience with live host control
- Cross-platform compatibility (mobile & desktop)
- Low-latency gameplay with immediate feedback

---

## Game Format & Rules

### Last Call Trivia Format
Based on research, the Last Call Trivia format follows these key mechanics:

**Round Structure:**
- **Round 1:** Teams assign point values 1, 3, or 5 to their answers
- **Round 2:** Point values switch to 2, 4, or 6
- **Special Rounds:** Wager-based final questions, picture rounds, theme rounds

**Scoring Rules:**
- Each point value can only be used ONCE per round
- Teams must assign points based on confidence level
- Correct answers earn the assigned points
- Incorrect answers lose no points (risk-free wagering)
- Final question allows teams to wager any amount up to their current score

**Answer Validation:**
- Host manually reviews and approves/rejects each answer
- Flexible spelling rules (phonetic equivalents accepted)
- Last names acceptable for person questions
- Precision required for titles and specific terms

---

## Core Features

### 1. Authentication System
**Registered Users:**
- Sign up/login via Supabase Auth
- Email verification required
- Password reset functionality
- Profile management (username, avatar, stats)

**Guest Users:**
- Join games without registration
- Temporary session-based identity
- Limited to contestant role only
- Optional conversion to registered account

### 2. Game Room Management
**Room Creation (Hosts Only):**
- Generate unique 6-character game codes
- Set room parameters (max teams, round types, time limits)
- Pre-load question sets or add questions during gameplay
- Room privacy settings (public/private)

**Room Joining:**
- Enter game code to join
- Display room info before joining
- Show current participants and game status
- Handle room capacity limits

### 3. Team Formation & Management
**Team Creation:**
- Teams form within game rooms
- Support 1-6 players per team (configurable)
- Team naming with profanity filtering
- Team captain designation for answer submission

**Team Management:**
- Join existing teams or create new ones
- Leave/kick team members (captain only)
- Real-time team member status (online/offline)

### 4. Gameplay Engine
**Question Flow:**
- Display questions to all participants simultaneously
- Support multiple question types (text, image, audio, video)
- Timed answer submission with visual countdown
- Lock/unlock answer submission per round

**Scoring System:**
- Implement Last Call Trivia point allocation (1,3,5 then 2,4,6)
- Prevent duplicate point value usage per round
- Calculate running totals with real-time updates
- Support special round types (wager, picture, bonus)

**Host Controls:**
- Advance to next question/round
- Lock/unlock team answers
- Review and approve/reject answers
- Override scores when necessary
- Pause/resume game functionality

### 5. Answer Review System
**Host Interface:**
- View all team answers in organized grid
- One-click approve/reject with bulk actions
- Add scoring notes for transparency
- Real-time answer submission notifications

**Team Feedback:**
- Show answer status (pending, approved, rejected)
- Display correct answers after review
- Show point awards and running totals

### 6. Leaderboard & Results
**Live Leaderboard:**
- Real-time score updates during gameplay
- Team rankings with tie-breaking logic
- Round-by-round score history
- Final results with winner announcement

**Game History:**
- Persistent storage for registered users
- Detailed game statistics and performance
- Personal and team achievement tracking

---

## User Stories & Flows

### Host User Journey
1. **Setup:**
   - Log in to account
   - Create new game room
   - Configure game settings (rounds, time limits, question set)
   - Share room code with participants

2. **Pre-Game:**
   - Monitor team formation
   - Review participant list
   - Start game when ready

3. **During Game:**
   - Present questions to teams
   - Monitor answer submissions
   - Review and score answers
   - Advance through rounds
   - Handle disputes and edge cases

4. **Post-Game:**
   - Review final results
   - Export game data
   - Schedule future games

### Team/Player User Journey
1. **Joining:**
   - Enter game code (guest) or login first
   - Join existing team or create new one
   - Wait for game to start

2. **Gameplay:**
   - Read questions as presented
   - Discuss with team members
   - Assign point values to answers
   - Submit answers before deadline
   - Monitor scores and leaderboard

3. **Results:**
   - View final rankings
   - See detailed score breakdown
   - Save game history (registered users)

### Mobile-Responsive Considerations
- Touch-friendly interface for mobile players
- Optimized layouts for different screen sizes
- Gesture-based navigation
- Offline-capable for temporary network issues

---

## Technical Architecture

### Frontend Stack
```
React 18+ with TypeScript
├── State Management: Zustand or Redux Toolkit
├── Styling: Tailwind CSS + HeadlessUI or shadcn/ui
├── Data Fetching: React Query (TanStack Query)
├── Real-time: Supabase Realtime subscriptions
├── Routing: React Router v6
├── Forms: React Hook Form + Zod validation
├── Animations: Framer Motion
└── Build Tool: Vite
```

**Component Architecture:**
- Feature-based folder structure
- Shared component library
- Custom hooks for business logic
- Context providers for global state
- Error boundaries for resilience

### Backend Architecture (Supabase)
```
Supabase Services
├── Authentication: Built-in auth with RLS
├── Database: PostgreSQL with real-time subscriptions
├── Edge Functions: Custom business logic (Node.js/Deno)
├── Storage: File uploads for images/media
├── Realtime: WebSocket connections for live updates
└── API: Auto-generated REST and GraphQL endpoints
```

**Edge Functions Use Cases:**
- Game code generation and validation
- Complex scoring calculations
- Answer similarity matching
- Batch operations and cleanup
- External integrations (if needed)

### Infrastructure Considerations
- CDN for static assets and media files
- Database connection pooling
- Horizontal scaling via Supabase's infrastructure
- Global edge deployment for low latency
- Monitoring and alerting setup

---

## Database Schema

### Core Tables

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stats JSONB DEFAULT '{}'::jsonb
);

-- Game rooms
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, finished
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Teams within game rooms
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_name IS NULL) OR 
    (user_id IS NULL AND guest_name IS NOT NULL)
  )
);

-- Game rounds
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_type TEXT NOT NULL DEFAULT 'standard', -- standard, wager, picture, bonus
  point_values INTEGER[] NOT NULL, -- [1,3,5] or [2,4,6]
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_number)
);

-- Questions within rounds
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text', -- text, image, audio, video
  media_url TEXT,
  correct_answer TEXT,
  answer_alternatives TEXT[], -- for flexible answer matching
  time_limit INTEGER DEFAULT 60, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, question_number)
);

-- Team answers
CREATE TABLE team_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  point_value INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  points_awarded INTEGER DEFAULT 0,
  review_notes TEXT,
  UNIQUE(question_id, team_id)
);

-- Point value tracking per round
CREATE TABLE team_point_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  used_point_values INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, round_id)
);

-- Real-time game state
CREATE TABLE game_state (
  room_id UUID REFERENCES game_rooms(id) PRIMARY KEY,
  current_round_id UUID REFERENCES game_rounds(id),
  current_question_id UUID REFERENCES questions(id),
  phase TEXT NOT NULL DEFAULT 'lobby', -- lobby, question, answering, reviewing, results
  phase_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Optimize common queries
CREATE INDEX idx_game_rooms_code ON game_rooms(code);
CREATE INDEX idx_game_rooms_host ON game_rooms(host_id);
CREATE INDEX idx_teams_room ON teams(room_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_answers_question ON team_answers(question_id);
CREATE INDEX idx_team_answers_team ON team_answers(team_id);
CREATE INDEX idx_team_answers_status ON team_answers(status);
```

---

## Real-time Communication

### Supabase Realtime Implementation

**Channel Structure:**
```typescript
// Room-level updates
const roomChannel = supabase
  .channel(`room:${roomId}`)
  .on('broadcast', { event: 'game_state_update' }, handleGameStateUpdate)
  .on('broadcast', { event: 'team_joined' }, handleTeamJoined)
  .on('broadcast', { event: 'question_started' }, handleQuestionStarted)
  .subscribe();

// Team-level updates
const teamChannel = supabase
  .channel(`team:${teamId}`)
  .on('broadcast', { event: 'answer_submitted' }, handleAnswerSubmitted)
  .on('broadcast', { event: 'answer_reviewed' }, handleAnswerReviewed)
  .subscribe();

// Host-only updates
const hostChannel = supabase
  .channel(`host:${roomId}`)
  .on('broadcast', { event: 'answer_pending_review' }, handlePendingReview)
  .subscribe();
```

**Event Types:**
- `game_state_update`: Phase changes, round progression
- `team_joined/left`: Team formation updates
- `question_started`: New question presentation
- `answer_submitted`: Team answer submission
- `answer_reviewed`: Host scoring decisions
- `leaderboard_update`: Score changes
- `timer_update`: Countdown synchronization

**Presence Tracking:**
```typescript
// Track online users in room
const presenceChannel = supabase
  .channel(`presence:${roomId}`)
  .on('presence', { event: 'sync' }, () => {
    const onlineUsers = presenceChannel.presenceState();
    updateOnlineStatus(onlineUsers);
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    handleUserJoined(newPresences);
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    handleUserLeft(leftPresences);
  })
  .subscribe();
```

### Connection Management
- Automatic reconnection with exponential backoff
- Offline state detection and graceful degradation
- Message queuing for temporary disconnections
- Conflict resolution for concurrent updates

---

## Security & Access Control

### Row Level Security (RLS) Policies

```sql
-- Game rooms: hosts can modify their own rooms
CREATE POLICY "Hosts can manage their rooms" ON game_rooms
  FOR ALL USING (host_id = auth.uid());

CREATE POLICY "Anyone can view active rooms" ON game_rooms
  FOR SELECT USING (status = 'active');

-- Teams: members can view their team data
CREATE POLICY "Team members can view team info" ON teams
  FOR SELECT USING (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- Team answers: only team members can submit/view
CREATE POLICY "Team members can manage answers" ON team_answers
  FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- Hosts can view all answers in their rooms
CREATE POLICY "Hosts can review all answers" ON team_answers
  FOR ALL USING (question_id IN (
    SELECT q.id FROM questions q
    JOIN game_rounds gr ON q.round_id = gr.id
    JOIN game_rooms r ON gr.room_id = r.id
    WHERE r.host_id = auth.uid()
  ));
```

### Input Validation & Sanitization
- Server-side validation for all user inputs
- Profanity filtering for team names and chat
- Answer text sanitization and length limits
- Rate limiting on answer submissions
- CSRF protection via Supabase's built-in security

### Data Privacy
- Guest user data automatically purged after game completion
- Registered user data retention policies
- GDPR compliance for user data export/deletion
- Audit logs for sensitive operations

---

## Scalability Considerations

### Database Optimization
- **Connection pooling:** Supabase handles automatically
- **Query optimization:** Proper indexing and query patterns
- **Data archiving:** Move completed games to cold storage
- **Read replicas:** For analytics and reporting queries

### Real-time Scaling
- **Channel partitioning:** Separate channels per room/team
- **Message batching:** Combine frequent updates
- **Selective subscriptions:** Only subscribe to relevant channels
- **Graceful degradation:** Fallback to polling if WebSocket fails

### Caching Strategy
```typescript
// React Query configuration for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Custom retry logic based on error type
        return failureCount < 3 && !error.message.includes('auth');
      }
    }
  }
});

// Cache keys structure
const cacheKeys = {
  gameRoom: (roomId: string) => ['game-room', roomId],
  teams: (roomId: string) => ['teams', roomId],
  questions: (roundId: string) => ['questions', roundId],
  leaderboard: (roomId: string) => ['leaderboard', roomId]
};
```

### Performance Monitoring
- **Metrics tracking:** Response times, error rates, user engagement
- **Real-time monitoring:** WebSocket connection health
- **Database performance:** Query execution times, connection counts
- **User experience:** Page load times, interaction delays

---

## Edge Cases & Error Handling

### Network & Connectivity Issues
**Problem:** Users lose internet connection during gameplay
**Solution:** 
- Implement offline state detection
- Queue answer submissions for retry
- Show clear connectivity status
- Allow hosts to extend time limits for network issues

**Problem:** WebSocket connection drops frequently
**Solution:**
- Automatic reconnection with exponential backoff
- Fallback to HTTP polling for real-time updates
- Persist connection state in localStorage
- Show connection status indicator

### Game State Synchronization
**Problem:** Players see different game states due to network lag
**Solution:**
- Implement authoritative game state on server
- Use sequence numbers for event ordering
- Periodic state synchronization broadcasts
- Conflict resolution for simultaneous actions

**Problem:** Host disconnects during active game
**Solution:**
- Implement host migration to another registered user
- Temporary pause until host reconnects
- Emergency host controls for team captains
- Game state persistence for recovery

### Answer Submission Race Conditions
**Problem:** Multiple team members submit answers simultaneously
**Solution:**
- Database constraints to prevent duplicate submissions
- Last-write-wins with timestamp comparison
- Team captain approval for answer changes
- Clear UI feedback for submission status

**Problem:** Time limit expires during answer submission
**Solution:**
- Grace period for in-flight submissions (5-10 seconds)
- Server-side timestamp validation
- Clear deadline communication to users
- Host override capability for technical issues

### Scoring & Validation Edge Cases
**Problem:** Ambiguous answers that could be correct
**Solution:**
- Host has final authority on answer acceptance
- Provide suggested alternative spellings/formats
- Allow partial credit scoring
- Appeals process for disputed answers

**Problem:** Teams attempt to use same point value twice
**Solution:**
- Client-side validation with real-time feedback
- Server-side constraint enforcement
- Clear error messages and correction prompts
- Automatic point redistribution suggestions

### Scale & Capacity Issues
**Problem:** Room reaches maximum capacity during gameplay
**Solution:**
- Waitlist functionality for popular rooms
- Spectator mode for overflow participants
- Multiple room instances for large groups
- Host tools for managing capacity

**Problem:** Database performance degrades with many concurrent games
**Solution:**
- Connection pooling and query optimization
- Horizontal scaling via Supabase infrastructure
- Data partitioning by game date/region
- Graceful degradation with reduced features

---

## Development Phases

### Phase 1: MVP (4-6 weeks)
**Core Features:**
- Basic authentication (registered users only)
- Room creation and joining
- Simple team formation
- Basic question/answer flow
- Manual host scoring
- Simple leaderboard

**Technical Priorities:**
- Database schema implementation
- Basic real-time communication
- Core React components
- Supabase integration

### Phase 2: Enhanced Gameplay (3-4 weeks)
**Features:**
- Guest user support
- Last Call Trivia scoring system
- Answer review interface
- Multiple round types
- Mobile responsive design
- Basic chat functionality

**Technical Priorities:**
- Advanced real-time features
- Mobile optimization
- Error handling and edge cases
- Performance optimization

### Phase 3: Polish & Scale (2-3 weeks)
**Features:**
- Game history and statistics
- Advanced host controls
- Media question support (images/audio)
- Scheduled games
- Social features (reactions, achievements)

**Technical Priorities:**
- Performance monitoring
- Security hardening
- Advanced caching
- Production deployment

### Phase 4: Advanced Features (Ongoing)
**Features:**
- Tournament brackets
- Custom question sets
- Integration with external trivia APIs
- Advanced analytics dashboard
- Mobile app development

---

## Performance Requirements

### Response Time Targets
- **Page load time:** < 3 seconds (initial load)
- **Navigation:** < 500ms (route changes)
- **Real-time updates:** < 200ms (WebSocket events)
- **Answer submission:** < 1 second (round-trip)

### Scalability Targets
- **Concurrent rooms:** 100+ simultaneous games
- **Users per room:** 50+ participants
- **Database queries:** < 100ms average response time
- **WebSocket connections:** 1000+ concurrent connections

### Availability Requirements
- **Uptime:** 99.9% availability target
- **Disaster recovery:** < 1 hour recovery time
- **Data backup:** Daily automated backups
- **Monitoring:** 24/7 uptime monitoring

### User Experience Metrics
- **Time to first interaction:** < 5 seconds
- **Answer submission success rate:** > 99%
- **Cross-platform consistency:** Identical features across devices
- **Accessibility:** WCAG 2.1 AA compliance

---

## Technical Considerations & Recommendations

### State Management Strategy
Use **Zustand** for simplicity and performance:
```typescript
// Game state store
const useGameStore = create<GameState>((set, get) => ({
  currentRoom: null,
  currentTeam: null,
  gamePhase: 'lobby',
  leaderboard: [],
  
  actions: {
    joinRoom: (roomId: string) => {
      // Join room logic with real-time subscription
    },
    submitAnswer: (questionId: string, answer: string, pointValue: number) => {
      // Submit answer with optimistic updates
    },
    updateGamePhase: (phase: GamePhase) => {
      set({ gamePhase: phase });
    }
  }
}));
```

### Error Boundary Implementation
```typescript
// Global error boundary for graceful failure handling
class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Game Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <GameErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Testing Strategy
- **Unit tests:** Component logic and utilities (Jest + React Testing Library)
- **Integration tests:** Database operations and API endpoints
- **E2E tests:** Complete game flows (Playwright or Cypress)
- **Real-time tests:** WebSocket connection and event handling
- **Load testing:** Concurrent user scenarios
- **Security testing:** Input validation and access control

This comprehensive product document provides a roadmap for building a scalable, engaging trivia platform that captures the essence of Last Call Trivia while leveraging modern web technologies for optimal user experience. 
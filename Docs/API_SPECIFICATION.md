# Tony Trivia - API Specification
*Backend Services & Endpoints*

## Overview
This document outlines the API structure for Tony Trivia, built on Supabase with custom Edge Functions for complex business logic.

## Base Configuration
- **Base URL:** `https://your-project.supabase.co`
- **Authentication:** JWT Bearer tokens via Supabase Auth
- **API Version:** v1
- **Response Format:** JSON
- **Real-time:** WebSocket via Supabase Realtime

---

## Authentication Endpoints

### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "player123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

### POST /auth/signin
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### POST /auth/signout
Sign out current user session.

### POST /auth/refresh
Refresh expired access token using refresh token.

---

## Game Room Management

### POST /rest/v1/rpc/create_game_room
Create a new trivia game room (Host only).

**Request Body:**
```json
{
  "name": "Friday Night Trivia",
  "settings": {
    "max_teams": 10,
    "max_players_per_team": 6,
    "round_types": ["standard", "standard", "wager"],
    "question_time_limit": 60,
    "is_public": true
  }
}
```

**Response:**
```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "name": "Friday Night Trivia",
    "host_id": "uuid",
    "status": "waiting",
    "settings": { /* settings object */ },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /rest/v1/game_rooms?code=eq.{roomCode}
Get room information by game code.

### POST /rest/v1/rpc/join_game_room
Join a game room as participant.

**Request Body:**
```json
{
  "room_code": "ABC123",
  "guest_name": "Anonymous Player" // Optional for guest users
}
```

### PATCH /rest/v1/game_rooms?id=eq.{roomId}
Update room settings (Host only).

### DELETE /rest/v1/game_rooms?id=eq.{roomId}
Delete/close game room (Host only).

---

## Team Management

### POST /rest/v1/teams
Create a new team within a room.

**Request Body:**
```json
{
  "room_id": "uuid",
  "name": "Team Awesome",
  "captain_id": "uuid" // Optional, defaults to creator
}
```

### POST /rest/v1/team_members
Join an existing team.

**Request Body:**
```json
{
  "team_id": "uuid",
  "user_id": "uuid", // null for guests
  "guest_name": "Anonymous" // null for registered users
}
```

### DELETE /rest/v1/team_members?id=eq.{memberId}
Leave a team or kick member (captain only).

### GET /rest/v1/teams?room_id=eq.{roomId}
Get all teams in a room with member counts.

---

## Game Flow Control

### POST /rest/v1/rpc/start_game
Begin the trivia game (Host only).

**Request Body:**
```json
{
  "room_id": "uuid",
  "questions": [ // Optional pre-loaded questions
    {
      "round_number": 1,
      "question_number": 1,
      "question_text": "What is the capital of France?",
      "question_type": "text",
      "correct_answer": "Paris",
      "answer_alternatives": ["paris"],
      "time_limit": 60
    }
  ]
}
```

### POST /rest/v1/rpc/advance_game_phase
Move to next question/round/phase (Host only).

**Request Body:**
```json
{
  "room_id": "uuid",
  "target_phase": "question", // lobby, question, answering, reviewing, results
  "phase_data": {
    "current_question_id": "uuid",
    "time_remaining": 60
  }
}
```

### POST /rest/v1/rpc/add_question
Add question during gameplay (Host only).

**Request Body:**
```json
{
  "round_id": "uuid",
  "question_text": "Name the largest planet in our solar system.",
  "question_type": "text",
  "correct_answer": "Jupiter",
  "time_limit": 45
}
```

---

## Answer Submission & Review

### POST /rest/v1/team_answers
Submit team answer for current question.

**Request Body:**
```json
{
  "question_id": "uuid",
  "team_id": "uuid",
  "answer_text": "Jupiter",
  "point_value": 5
}
```

**Validation Rules:**
- Point value must be available for current round
- Team can only submit one answer per question
- Answer submission only allowed during 'answering' phase

### GET /rest/v1/rpc/get_pending_answers
Get all answers awaiting host review.

**Parameters:**
- `room_id`: uuid (required)
- `question_id`: uuid (optional, current question if not provided)

**Response:**
```json
{
  "answers": [
    {
      "id": "uuid",
      "team_name": "Team Awesome",
      "answer_text": "Jupiter",
      "point_value": 5,
      "submitted_at": "2024-01-01T00:00:00Z",
      "status": "pending"
    }
  ]
}
```

### POST /rest/v1/rpc/review_answers
Approve/reject answers (Host only).

**Request Body:**
```json
{
  "answer_reviews": [
    {
      "answer_id": "uuid",
      "status": "approved", // approved, rejected
      "points_awarded": 5,
      "review_notes": "Correct answer"
    }
  ]
}
```

---

## Scoring & Leaderboard

### GET /rest/v1/rpc/get_leaderboard
Get current game leaderboard.

**Parameters:**
- `room_id`: uuid (required)

**Response:**
```json
{
  "leaderboard": [
    {
      "team_id": "uuid",
      "team_name": "Team Awesome",
      "total_score": 18,
      "round_scores": [8, 10],
      "rank": 1,
      "members": ["Player1", "Player2"]
    }
  ],
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### GET /rest/v1/rpc/get_score_history
Get detailed scoring breakdown.

**Parameters:**
- `room_id`: uuid (required)
- `team_id`: uuid (optional, for team-specific history)

---

## Real-time Subscriptions

### Game State Updates
**Channel:** `room:{roomId}`

**Events:**
- `game_phase_changed`: Game phase transitions
- `question_started`: New question presented
- `answers_locked`: Answer submission deadline
- `scores_updated`: Leaderboard changes
- `team_joined`: New team creation
- `team_left`: Team departure

### Team Communication
**Channel:** `team:{teamId}`

**Events:**
- `member_joined`: New team member
- `member_left`: Member departure
- `answer_submitted`: Team answer submission
- `answer_reviewed`: Host scoring decision

### Host Notifications
**Channel:** `host:{roomId}`

**Events:**
- `answer_pending`: New answer awaiting review
- `participant_joined`: New room participant
- `technical_issue`: System alerts

---

## Edge Functions

### Function: generate-room-code
**Endpoint:** `/functions/v1/generate-room-code`
**Purpose:** Generate unique, human-readable room codes
**Method:** POST

**Logic:**
- Generate 6-character alphanumeric code
- Ensure uniqueness against existing rooms
- Exclude ambiguous characters (0, O, I, 1)
- Return code with expiration time

### Function: validate-answer
**Endpoint:** `/functions/v1/validate-answer`
**Purpose:** Provide answer similarity scoring for host assistance
**Method:** POST

**Request:**
```json
{
  "submitted_answer": "Jupitor",
  "correct_answer": "Jupiter",
  "alternatives": ["jupiter"]
}
```

**Response:**
```json
{
  "similarity_score": 0.95,
  "recommendation": "approve",
  "reasoning": "Minor spelling variation"
}
```

### Function: calculate-final-scores
**Endpoint:** `/functions/v1/calculate-final-scores`
**Purpose:** Compute final game results with tie-breaking
**Method:** POST

**Features:**
- Handle tie-breaking rules
- Generate detailed score reports
- Create game summary statistics
- Update player/team historical data

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Point value already used in this round",
    "details": {
      "field": "point_value",
      "used_values": [1, 3]
    }
  }
}
```

### Error Codes
- `AUTHENTICATION_REQUIRED`: User must be logged in
- `INSUFFICIENT_PERMISSIONS`: Action requires host privileges
- `ROOM_NOT_FOUND`: Invalid room code
- `ROOM_FULL`: Maximum capacity reached
- `GAME_IN_PROGRESS`: Action not allowed during active game
- `INVALID_GAME_PHASE`: Action not permitted in current phase
- `DUPLICATE_POINT_VALUE`: Point value already used
- `ANSWER_DEADLINE_PASSED`: Submission after time limit
- `TEAM_NOT_FOUND`: Invalid team reference
- `VALIDATION_ERROR`: Input validation failed

---

## Rate Limiting

### Limits by Endpoint Type
- **Authentication:** 5 requests/minute
- **Room Creation:** 3 rooms/hour per user
- **Answer Submission:** 1 per question per team
- **Real-time Events:** 100/minute per connection
- **Host Actions:** 60/minute per room

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1641024000
```

---

## Webhooks (Optional)

### Game Completion Webhook
Notify external systems when games complete.

**Endpoint:** Configurable per room
**Payload:**
```json
{
  "event": "game_completed",
  "room_id": "uuid",
  "room_code": "ABC123",
  "completed_at": "2024-01-01T00:00:00Z",
  "final_leaderboard": [ /* leaderboard array */ ],
  "game_stats": {
    "total_teams": 8,
    "total_questions": 15,
    "duration_minutes": 45
  }
}
```

---

## Development Tools

### Database Seeding
**Endpoint:** `/functions/v1/seed-test-data` (Development only)
**Purpose:** Create sample games for testing

### Health Check
**Endpoint:** `/health`
**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "realtime": "active",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### API Documentation
- Interactive API explorer available at `/docs`
- OpenAPI specification at `/openapi.json`
- Postman collection available for download

This API specification provides a comprehensive foundation for building the Tony Trivia platform with proper separation of concerns, security considerations, and scalability in mind. 
# Tony Trivia - System Diagrams
*Visual documentation of user flows and technical architecture*

## Overview
This document contains the system diagrams for the Tony Trivia platform in Mermaid format. These diagrams can be rendered in various tools and platforms that support Mermaid syntax.

## How to Use These Diagrams

### Rendering Options
- **GitHub/GitLab:** Paste the code blocks directly into markdown files
- **Mermaid Live Editor:** Visit [mermaid.live](https://mermaid.live) and paste the code
- **VS Code:** Install the Mermaid Preview extension
- **Notion:** Use Mermaid code blocks
- **Documentation sites:** Most support Mermaid rendering (GitBook, Docusaurus, etc.)

---

## 1. User Journey Flow Diagram

This diagram shows the complete user flow from landing on the homepage through game completion, covering both host and player paths.

```mermaid
graph TD
    A["User Lands on Homepage"] --> B{"User Type?"}
    
    B -->|Host| C["Login Required"]
    B -->|Player| D{"Join as Guest?"}
    
    C --> E["Host Dashboard"]
    D -->|Yes| F["Enter Game Code"]
    D -->|No| G["Login/Register"]
    
    G --> F
    F --> H{"Valid Code?"}
    H -->|No| I["Show Error<br/>Try Again"]
    H -->|Yes| J["Enter Room Lobby"]
    
    I --> F
    J --> K{"Team Formation"}
    K --> L["Join Existing Team"]
    K --> M["Create New Team"]
    
    L --> N["Wait for Game Start"]
    M --> N
    
    E --> O["Create Game Room"]
    O --> P["Configure Settings<br/>(Rounds, Time, Questions)"]
    P --> Q["Generate Room Code"]
    Q --> R["Share Code with Players"]
    R --> S["Monitor Team Formation"]
    S --> T["Start Game"]
    
    N --> U{"Game Started?"}
    U -->|No| N
    U -->|Yes| V["Round 1 Begins"]
    
    T --> V
    V --> W["Display Question"]
    W --> X["Teams Submit Answers<br/>with Point Values (1,3,5)"]
    X --> Y["Host Reviews Answers"]
    Y --> Z["Scores Updated"]
    Z --> AA{"More Questions<br/>in Round?"}
    
    AA -->|Yes| W
    AA -->|No| BB{"More Rounds?"}
    
    BB -->|Yes| CC["Round 2 Begins<br/>Point Values (2,4,6)"]
    CC --> DD["Display Question"]
    DD --> EE["Teams Submit Answers"]
    EE --> FF["Host Reviews Answers"]
    FF --> GG["Scores Updated"]
    GG --> HH{"More Questions?"}
    
    HH -->|Yes| DD
    HH -->|No| II["Final Results"]
    
    BB -->|No| II
    II --> JJ["Display Leaderboard"]
    JJ --> KK["Game Complete"]
    
    style A fill:#e1f5fe
    style E fill:#f3e5f5
    style V fill:#e8f5e8
    style II fill:#fff3e0
```

### Key Flow Points
- **Entry Points:** Homepage with role selection (Host vs Player)
- **Authentication:** Required for hosts, optional for players
- **Room Management:** Code-based joining system
- **Team Formation:** Flexible team creation and joining
- **Game Phases:** Clear progression through rounds with different point values
- **Host Controls:** Complete oversight of game flow and scoring

---

## 2. Technical Architecture Diagram

This diagram illustrates the technical stack and how different components interact within the Tony Trivia system.

```mermaid
graph TB
    subgraph "Client Layer"
        A["React + TypeScript<br/>Web Application"]
        B["Mobile Browser<br/>Responsive UI"]
        C["Desktop Browser<br/>Full Interface"]
    end
    
    subgraph "API Layer"
        D["Supabase REST API<br/>Auto-generated"]
        E["Supabase Realtime<br/>WebSocket Events"]
        F["Edge Functions<br/>Custom Logic"]
    end
    
    subgraph "Authentication"
        G["Supabase Auth<br/>JWT Tokens"]
        H["Row Level Security<br/>Database Policies"]
    end
    
    subgraph "Database Layer"
        I["PostgreSQL<br/>Primary Database"]
        J["Real-time Subscriptions<br/>Change Streams"]
        K["Connection Pool<br/>Performance"]
    end
    
    subgraph "Storage & CDN"
        L["Supabase Storage<br/>Media Files"]
        M["CDN<br/>Static Assets"]
    end
    
    subgraph "External Services"
        N["Email Service<br/>Notifications"]
        O["Monitoring<br/>Error Tracking"]
    end
    
    A --> D
    B --> D
    C --> D
    
    A --> E
    B --> E
    C --> E
    
    D --> G
    E --> G
    F --> G
    
    G --> H
    H --> I
    
    D --> I
    F --> I
    E --> J
    J --> I
    
    I --> K
    
    D --> L
    A --> M
    B --> M
    C --> M
    
    F --> N
    A --> O
    B --> O
    C --> O
    
    style A fill:#e3f2fd
    style I fill:#f1f8e9
    style G fill:#fce4ec
    style E fill:#fff3e0
```

### Architecture Highlights
- **Client Layer:** Multi-device support with responsive design
- **API Layer:** Supabase-powered with custom Edge Functions for complex logic
- **Authentication:** JWT-based with granular Row Level Security
- **Database:** PostgreSQL with real-time capabilities and connection pooling
- **Storage:** Integrated media handling and CDN distribution
- **Monitoring:** Comprehensive error tracking and performance monitoring

---

## 3. Database Entity Relationship Diagram

This diagram shows the relationships between all database tables in the system.

```mermaid
erDiagram
    profiles {
        uuid id PK
        text username UK
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
        jsonb stats
    }
    
    game_rooms {
        uuid id PK
        text code UK
        text name
        uuid host_id FK
        text status
        jsonb settings
        timestamptz created_at
        timestamptz started_at
        timestamptz ended_at
    }
    
    teams {
        uuid id PK
        uuid room_id FK
        text name
        uuid captain_id FK
        timestamptz created_at
    }
    
    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text guest_name
        timestamptz joined_at
    }
    
    game_rounds {
        uuid id PK
        uuid room_id FK
        integer round_number
        text round_type
        integer[] point_values
        text status
        timestamptz created_at
    }
    
    questions {
        uuid id PK
        uuid round_id FK
        integer question_number
        text question_text
        text question_type
        text media_url
        text correct_answer
        text[] answer_alternatives
        integer time_limit
        timestamptz created_at
    }
    
    team_answers {
        uuid id PK
        uuid question_id FK
        uuid team_id FK
        text answer_text
        integer point_value
        timestamptz submitted_at
        timestamptz reviewed_at
        text status
        integer points_awarded
        text review_notes
    }
    
    team_point_usage {
        uuid id PK
        uuid team_id FK
        uuid round_id FK
        integer[] used_point_values
        timestamptz updated_at
    }
    
    game_state {
        uuid room_id PK,FK
        uuid current_round_id FK
        uuid current_question_id FK
        text phase
        jsonb phase_data
        timestamptz updated_at
    }
    
    profiles ||--o{ game_rooms : hosts
    profiles ||--o{ teams : captains
    profiles ||--o{ team_members : "registered users"
    
    game_rooms ||--o{ teams : contains
    game_rooms ||--o{ game_rounds : "has rounds"
    game_rooms ||--|| game_state : "current state"
    
    teams ||--o{ team_members : "has members"
    teams ||--o{ team_answers : submits
    teams ||--o{ team_point_usage : "tracks points"
    
    game_rounds ||--o{ questions : contains
    game_rounds ||--o{ team_point_usage : "point tracking"
    
    questions ||--o{ team_answers : "receives answers"
    
    game_state }o--|| game_rounds : "current round"
    game_state }o--|| questions : "current question"
```

### Key Relationships
- **Profiles to Game Rooms:** One-to-many (hosts create multiple rooms)
- **Game Rooms to Teams:** One-to-many (multiple teams per room)
- **Teams to Members:** One-to-many (multiple players per team)
- **Rounds to Questions:** One-to-many (multiple questions per round)
- **Questions to Answers:** One-to-many (one answer per team per question)

---

## 4. Real-time Communication Flow

This diagram shows how real-time events flow through the system during gameplay.

```mermaid
sequenceDiagram
    participant H as Host
    participant S as Supabase
    participant T1 as Team 1
    participant T2 as Team 2
    participant T3 as Team 3
    
    Note over H,T3: Game Setup Phase
    H->>S: Create game room
    S-->>T1: Room created event
    S-->>T2: Room created event
    S-->>T3: Room created event
    
    T1->>S: Join team
    T2->>S: Join team
    T3->>S: Join team
    S-->>H: Team formation updates
    
    Note over H,T3: Gameplay Phase
    H->>S: Start Round 1
    S-->>T1: Round started (1,3,5 points)
    S-->>T2: Round started (1,3,5 points)
    S-->>T3: Round started (1,3,5 points)
    
    H->>S: Present question
    S-->>T1: Question displayed
    S-->>T2: Question displayed
    S-->>T3: Question displayed
    
    T1->>S: Submit answer (5 points)
    T2->>S: Submit answer (3 points)
    T3->>S: Submit answer (1 point)
    S-->>H: All answers received
    
    H->>S: Review answers
    S-->>T1: Answer approved (+5)
    S-->>T2: Answer rejected (+0)
    S-->>T3: Answer approved (+1)
    
    S-->>H: Scores updated
    S-->>T1: Leaderboard update
    S-->>T2: Leaderboard update
    S-->>T3: Leaderboard update
    
    Note over H,T3: Round Transition
    H->>S: Start Round 2
    S-->>T1: Round 2 (2,4,6 points)
    S-->>T2: Round 2 (2,4,6 points)
    S-->>T3: Round 2 (2,4,6 points)
```

---

## 5. Game State Machine

This diagram shows the different states and transitions during a trivia game.

```mermaid
stateDiagram-v2
    [*] --> Lobby: Room Created
    
    Lobby --> PreGame: Host starts game
    PreGame --> Round1: All teams ready
    
    Round1 --> Question1: Present question
    Question1 --> Answering1: Teams submit answers
    Answering1 --> Reviewing1: Answer deadline
    Reviewing1 --> Scoring1: Host reviews answers
    Scoring1 --> Question1: More questions
    Scoring1 --> Round2: Round complete
    
    Round2 --> Question2: Present question
    Question2 --> Answering2: Teams submit answers
    Answering2 --> Reviewing2: Answer deadline
    Reviewing2 --> Scoring2: Host reviews answers
    Scoring2 --> Question2: More questions
    Scoring2 --> FinalRound: Round complete
    
    FinalRound --> FinalQuestion: Wager round
    FinalQuestion --> FinalAnswering: Teams wager & answer
    FinalAnswering --> FinalReviewing: Answer deadline
    FinalReviewing --> Results: Host reviews
    
    Results --> [*]: Game complete
    
    note right of Lobby
        Teams form
        Players join
        Host configures
    end note
    
    note right of Answering1
        Point values: 1, 3, 5
        Each used once
    end note
    
    note right of Answering2
        Point values: 2, 4, 6
        Each used once
    end note
    
    note right of FinalAnswering
        Teams can wager
        up to current score
    end note
```

---

## Using These Diagrams in Development

### 1. **Requirements Planning**
- Use the User Journey Flow to validate all user paths are covered
- Reference the Architecture Diagram when making technical decisions
- Use the Database ERD to understand data relationships

### 2. **Development Phases**
- **Phase 1:** Focus on basic flow (Lobby → Question → Answer → Score)
- **Phase 2:** Add real-time communication patterns
- **Phase 3:** Implement complete state machine

### 3. **Testing Strategy**
- Use flow diagrams to create end-to-end test scenarios
- Test each state transition in the state machine
- Validate real-time communication patterns

### 4. **Documentation Updates**
Remember to update these diagrams as the system evolves. They serve as living documentation that should reflect the current system architecture and user flows.

---

## Exporting and Sharing

To use these diagrams elsewhere:

1. **Copy the mermaid code blocks** from this document
2. **Paste into supported platforms** (GitHub, GitLab, Notion, etc.)
3. **Use Mermaid Live Editor** for customization and export to PNG/SVG
4. **Include in project documentation** for team reference

These diagrams provide a visual foundation for understanding and building the Tony Trivia platform. 
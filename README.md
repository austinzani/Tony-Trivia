# 🎯 Tony Trivia

> A web-based live trivia platform that brings the authentic **Last Call Trivia** experience to remote and distributed teams.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🎮 What is Tony Trivia?

Tony Trivia replicates the engaging **Last Call Trivia** format for online play, enabling friends to compete together regardless of location. The platform features:

### 🏆 Authentic Last Call Trivia Format
- **Round 1:** Teams assign point values **1, 3, or 5** to their answers based on confidence
- **Round 2:** Point values switch to **2, 4, or 6**
- **Special Rounds:** Wager-based final questions, picture rounds, and themed challenges
- **Strategic Scoring:** Each point value can only be used **once per round**
- **Risk-Free Wagering:** Incorrect answers lose no points, only correct answers earn points

### 🚀 Real-Time Multiplayer Experience
- **Live Host Control:** Hosts manage game flow, review answers, and control progression
- **Instant Updates:** Real-time score updates and game state synchronization
- **Cross-Platform:** Works seamlessly on mobile and desktop devices
- **Low Latency:** Sub-200ms real-time updates for responsive gameplay

## 🛠️ Tech Stack

### Frontend
- **React 18+** with **TypeScript** for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Zustand** for lightweight state management
- **React Query (TanStack)** for server state management
- **React Hook Form + Zod** for form validation
- **Framer Motion** for smooth animations
- **React Router v6** for client-side routing

### Backend (Supabase)
- **PostgreSQL** database with real-time subscriptions
- **Row Level Security (RLS)** for data protection
- **Supabase Auth** for authentication with guest support
- **Edge Functions** for custom business logic
- **Realtime WebSockets** for live multiplayer features
- **Auto-generated REST/GraphQL APIs**

## 🤖 AI-Assisted Development

This project showcases modern AI-assisted development practices:

- **Built with Claude (Anthropic)** for intelligent code generation and architecture decisions
- **TaskMaster AI** for project management and task breakdown
- **Supabase MCP (Model Context Protocol)** for automated backend integration
- **AI-driven development workflow** from requirements to implementation

### Development Approach
1. **AI-Generated Architecture:** Claude analyzed requirements and designed the technical architecture
2. **Intelligent Task Breakdown:** TaskMaster automatically generated 27+ development tasks from the PRD
3. **Automated Backend Setup:** Supabase MCP handles database schema, RLS policies, and API generation
4. **Continuous AI Assistance:** Ongoing code review, optimization, and feature development

## 🎯 Core Features

### 🔐 Authentication System
- **Registered Users:** Full profile management with game history and statistics
- **Guest Users:** Join games without registration for quick play
- **Secure Authentication:** Email verification and password reset functionality

### 🏠 Game Room Management
- **Unique Game Codes:** 6-character codes for easy room joining
- **Flexible Settings:** Configure team limits, round types, and time limits
- **Host Controls:** Complete game flow management and moderation tools

### 👥 Team Formation
- **Dynamic Teams:** 1-6 players per team with captain designation
- **Real-Time Management:** Join, leave, and manage teams during gameplay
- **Online Presence:** See who's currently active in your game

### ⚡ Live Gameplay Engine
- **Question Flow:** Support for text, image, audio, and video questions
- **Smart Scoring:** Automatic point validation and duplicate prevention
- **Timer System:** Visual countdown with customizable time limits
- **Answer Review:** Host interface for reviewing and validating answers

## 🚦 Project Status

**Current Phase:** MVP Development

### ✅ Completed
- [x] Project initialization and repository setup
- [x] TaskMaster task breakdown (27 main tasks + subtasks)
- [x] Technical architecture design
- [x] Development environment configuration

### 🔄 In Progress
- [ ] Frontend application setup (React + TypeScript + Vite)
- [ ] Supabase integration and database schema
- [ ] Authentication system implementation

### 📋 Upcoming
- [ ] Core gameplay engine development
- [ ] Real-time communication system
- [ ] Host controls and answer review interface
- [ ] Mobile responsive design
- [ ] Performance optimization and testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/austinzani/Tony-Trivia.git
cd Tony-Trivia

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials to .env

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Documentation

- [📋 Product Requirements](PRODUCT_REQUIREMENTS.md) - Detailed feature specifications
- [🔧 Development Setup](DEVELOPMENT_SETUP.md) - Technical setup guide
- [📊 API Specification](API_SPECIFICATION.md) - Backend API documentation
- [🎨 System Diagrams](DIAGRAMS.md) - Architecture and flow diagrams

## 🎮 How to Play

1. **Host Creates Game:** Generate a unique room code and configure settings
2. **Players Join:** Enter the room code to join the game
3. **Form Teams:** Create teams of 1-6 players with designated captains
4. **Round 1:** Assign point values (1, 3, 5) based on answer confidence
5. **Round 2:** Use different point values (2, 4, 6) for strategic play
6. **Special Rounds:** Participate in wager rounds and themed challenges
7. **Real-Time Scoring:** Watch the leaderboard update live as answers are reviewed
8. **Victory:** Celebrate with the winning team!

## 🤝 Contributing

This project demonstrates AI-assisted development workflows. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Use TaskMaster to break down your work (`tm add-task "Your feature description"`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Last Call Trivia** for the original game format inspiration
- **Supabase** for providing an excellent backend-as-a-service platform
- **Anthropic's Claude** for intelligent development assistance
- **TaskMaster AI** for project management automation
- **The MCP Community** for innovative development tools

---

**Built with ❤️ using AI-assisted development practices**

*Experience the future of collaborative software development with Tony Trivia!* 
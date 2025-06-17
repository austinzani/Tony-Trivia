# Tony Trivia - Development Setup Guide
*Getting Started with Local Development*

## Prerequisites
Ensure you have the following installed on your development machine:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

## Supabase Setup

### 1. Create Supabase Project
1. Visit [supabase.com](https://supabase.com) and create account
2. Create new project with these settings:
   - **Name:** `tony-trivia-dev`
   - **Database Password:** Generate strong password
   - **Region:** Choose closest to your location

### 2. Configure Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stats JSONB DEFAULT '{}'::jsonb
);

-- Create game_rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Create team_members table
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

-- Create game_rounds table
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_type TEXT NOT NULL DEFAULT 'standard',
  point_values INTEGER[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_number)
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',
  media_url TEXT,
  correct_answer TEXT,
  answer_alternatives TEXT[],
  time_limit INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, question_number)
);

-- Create team_answers table
CREATE TABLE team_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  point_value INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  review_notes TEXT,
  UNIQUE(question_id, team_id)
);

-- Create team_point_usage table
CREATE TABLE team_point_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  used_point_values INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, round_id)
);

-- Create game_state table
CREATE TABLE game_state (
  room_id UUID REFERENCES game_rooms(id) PRIMARY KEY,
  current_round_id UUID REFERENCES game_rounds(id),
  current_question_id UUID REFERENCES questions(id),
  phase TEXT NOT NULL DEFAULT 'lobby',
  phase_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_game_rooms_code ON game_rooms(code);
CREATE INDEX idx_game_rooms_host ON game_rooms(host_id);
CREATE INDEX idx_teams_room ON teams(room_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_answers_question ON team_answers(question_id);
CREATE INDEX idx_team_answers_team ON team_answers(team_id);
CREATE INDEX idx_team_answers_status ON team_answers(status);
```

### 3. Set Up Row Level Security (RLS)
Run these RLS policies:

```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Game rooms policies
CREATE POLICY "Hosts can manage their rooms" ON game_rooms
  FOR ALL USING (host_id = auth.uid());

CREATE POLICY "Anyone can view active rooms" ON game_rooms
  FOR SELECT USING (status IN ('waiting', 'active'));

-- Teams policies
CREATE POLICY "Team members can view team info" ON teams
  FOR SELECT USING (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can create teams" ON teams
  FOR INSERT WITH CHECK (true);

-- Team members policies
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can join teams" ON team_members
  FOR INSERT WITH CHECK (true);

-- Team answers policies
CREATE POLICY "Team members can manage answers" ON team_answers
  FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Hosts can review all answers" ON team_answers
  FOR ALL USING (question_id IN (
    SELECT q.id FROM questions q
    JOIN game_rounds gr ON q.round_id = gr.id
    JOIN game_rooms r ON gr.room_id = r.id
    WHERE r.host_id = auth.uid()
  ));
```

### 4. Enable Realtime
In the Supabase dashboard, go to **Database → Replication** and enable realtime for these tables:
- `game_rooms`
- `teams`
- `team_members`
- `team_answers`
- `game_state`

---

## Frontend Setup

### 1. Initialize React Project
```bash
# Create new React app with TypeScript
npx create-react-app tony-trivia --template typescript
cd tony-trivia

# Or using Vite (recommended for better performance)
npm create vite@latest tony-trivia -- --template react-ts
cd tony-trivia
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install @supabase/supabase-js @tanstack/react-query

# UI and styling
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react
npm install clsx tailwind-merge

# Form handling
npm install react-hook-form @hookform/resolvers zod

# State management
npm install zustand

# Routing
npm install react-router-dom

# Dev dependencies
npm install -D @types/node
```

### 3. Configure Tailwind CSS
```bash
# Initialize Tailwind
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Environment Configuration
Create `.env.local` file:
```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up Supabase Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          stats: any
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          stats?: any
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          stats?: any
        }
      }
      // Add other table types as needed
    }
  }
}
```

---

## Project Structure

Set up your project with this recommended structure:

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs)
│   ├── game/            # Game-specific components
│   ├── auth/            # Authentication components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── supabase.ts      # Supabase client
│   ├── utils.ts         # General utilities
│   └── validations.ts   # Zod schemas
├── pages/               # Page components
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── App.tsx
```

### Example Component Structure
Create `src/components/ui/Button.tsx`:
```typescript
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button, buttonVariants }
```

---

## Development Workflow

### 1. Start Development Server
```bash
npm start
# or
npm run dev  # if using Vite
```

### 2. Code Quality Setup
Create `.eslintrc.js`:
```javascript
module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
}
```

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 3. Git Hooks (Optional)
```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Set up pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx,json,css,md}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

---

## Testing Setup

### 1. Install Testing Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Create Test Utilities
Create `src/test-utils.tsx`:
```typescript
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

---

## Deployment Preparation

### 1. Build Optimization
Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,json,css,md}"
  }
}
```

### 2. Environment Variables for Production
Create `.env.production`:
```bash
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key
```

---

## Troubleshooting

### Common Issues

**1. Supabase Connection Issues**
- Verify environment variables are set correctly
- Check if RLS policies are properly configured
- Ensure Supabase project is not paused

**2. Real-time Not Working**
- Confirm realtime is enabled for required tables
- Check browser console for WebSocket errors
- Verify authentication is working properly

**3. TypeScript Errors**
- Ensure all dependencies have proper type definitions
- Check if custom types are exported correctly
- Verify Supabase types are up to date

**4. Styling Issues**
- Confirm Tailwind is properly configured
- Check if CSS is being imported correctly
- Verify build process includes CSS processing

### Debugging Tools

**React Developer Tools**
- Install browser extension for component debugging
- Use Profiler to identify performance issues

**Supabase Dashboard**
- Monitor database queries in real-time
- Check authentication logs
- Review API usage statistics

**Network Tab**
- Monitor API requests and responses
- Check WebSocket connection status
- Verify request headers and payloads

---

## Next Steps

Once your development environment is set up:

1. **Create Basic Components**: Start with authentication and room creation
2. **Implement Core Features**: Focus on MVP functionality first
3. **Add Real-time Features**: Implement WebSocket connections
4. **Test Thoroughly**: Write tests for critical user flows
5. **Optimize Performance**: Use React.memo and useMemo where appropriate
6. **Deploy to Staging**: Set up staging environment for testing

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

This setup guide provides a solid foundation for developing Tony Trivia with modern best practices and tools. 
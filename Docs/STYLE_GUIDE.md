# Tony Trivia Style Guide

## Overview
Tony Trivia embraces a **playful & colorful** aesthetic combined with **energetic & competitive** elements. The design should evoke **fun and excitement** while maintaining **clear visual hierarchy** and **AA accessibility compliance**.

## Design Principles

### Core Values
- **Playful Competition**: Game-like interface that encourages friendly rivalry
- **Energetic Engagement**: Dynamic animations and vibrant colors that maintain excitement
- **Clear Hierarchy**: Users always know the primary function of any page
- **Device Harmony**: Feels native on both mobile and desktop
- **Accessible Fun**: Rich visuals that don't compromise usability

---

## Color Palette

### Primary Colors (Game Show Energy)
```css
:root {
  /* Electric Blues - Primary Brand */
  --color-electric-50: #eff6ff;
  --color-electric-100: #dbeafe;
  --color-electric-200: #bfdbfe;
  --color-electric-300: #93c5fd;
  --color-electric-400: #60a5fa;
  --color-electric-500: #3b82f6;
  --color-electric-600: #2563eb;
  --color-electric-700: #1d4ed8;
  --color-electric-800: #1e40af;
  --color-electric-900: #1e3a8a;

  /* Vibrant Purples - Secondary */
  --color-plasma-50: #faf5ff;
  --color-plasma-100: #f3e8ff;
  --color-plasma-200: #e9d5ff;
  --color-plasma-300: #d8b4fe;
  --color-plasma-400: #c084fc;
  --color-plasma-500: #a855f7;
  --color-plasma-600: #9333ea;
  --color-plasma-700: #7c3aed;
  --color-plasma-800: #6b21a8;
  --color-plasma-900: #581c87;

  /* Energy Accents */
  --color-energy-orange: #ff6b35;
  --color-energy-yellow: #ffd23f;
  --color-energy-green: #06d6a0;
  --color-energy-red: #ef476f;

  /* Competitive States */
  --color-victory: #10b981;
  --color-defeat: #ef4444;
  --color-pending: #f59e0b;
  --color-neutral: #6b7280;
}
```

### Semantic Colors
```css
:root {
  /* Game States */
  --color-correct: var(--color-energy-green);
  --color-incorrect: var(--color-energy-red);
  --color-waiting: var(--color-energy-yellow);
  --color-active: var(--color-electric-500);
  
  /* UI States */
  --color-success: var(--color-victory);
  --color-error: var(--color-defeat);
  --color-warning: var(--color-pending);
  --color-info: var(--color-electric-500);
}
```

---

## Typography

### Font Stack
```css
:root {
  --font-primary: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-display: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}
```

### Type Scale
```css
:root {
  /* Display (Game Titles, Scores) */
  --text-display-xl: 3.5rem;    /* 56px - Major scores/titles */
  --text-display-lg: 2.5rem;    /* 40px - Round titles */
  --text-display-md: 2rem;      /* 32px - Question headers */
  
  /* Headings */
  --text-xl: 1.5rem;            /* 24px - Section headers */
  --text-lg: 1.25rem;           /* 20px - Card titles */
  --text-md: 1rem;              /* 16px - Body text */
  --text-sm: 0.875rem;          /* 14px - Secondary text */
  --text-xs: 0.75rem;           /* 12px - Captions */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Typography Classes
```css
.text-display {
  font-size: var(--text-display-md);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.text-game-score {
  font-size: var(--text-display-xl);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.text-friendly-error {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--color-error);
}
```

---

## Spacing & Layout

### Spacing Scale
```css
:root {
  --space-xs: 0.25rem;    /* 4px */
  --space-sm: 0.5rem;     /* 8px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 1.5rem;     /* 24px */
  --space-xl: 2rem;       /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
}
```

### Layout Principles
- **Mobile-first**: Design for mobile, enhance for desktop
- **Clean spacing**: Use consistent spacing scale
- **Breathing room**: Generous whitespace in game phases
- **Information density**: Compact when showing data (profiles, history)

---

## Component Patterns

### Buttons

#### Primary Game Actions
```css
.btn-game-primary {
  background: linear-gradient(135deg, var(--color-electric-500), var(--color-plasma-500));
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-game-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-game-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
```

#### Secondary Actions
```css
.btn-game-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-electric-700);
  border: 2px solid var(--color-electric-200);
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-game-secondary:hover {
  background: white;
  border-color: var(--color-electric-400);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}
```

### Cards

#### Game Cards
```css
.card-game {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.card-game:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: var(--color-electric-300);
}

.card-game--active {
  border-color: var(--color-electric-500);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
```

#### Team Cards
```css
.card-team {
  background: linear-gradient(135deg, #ffffff, #f8faff);
  border-radius: 0.875rem;
  padding: 1.25rem;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.card-team--selected {
  border-color: var(--color-electric-500);
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
}
```

### Game-Specific Elements

#### Score Display
```css
.score-display {
  background: linear-gradient(135deg, var(--color-electric-500), var(--color-plasma-600));
  color: white;
  text-align: center;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-size: var(--text-display-lg);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
```

#### Progress Bars
```css
.progress-bar {
  background: rgba(59, 130, 246, 0.1);
  height: 0.75rem;
  border-radius: 0.375rem;
  overflow: hidden;
}

.progress-bar__fill {
  background: linear-gradient(90deg, var(--color-electric-500), var(--color-energy-green));
  height: 100%;
  border-radius: 0.375rem;
  transition: width 0.5s ease;
}
```

#### Timer
```css
.timer {
  background: var(--color-energy-yellow);
  color: var(--color-electric-900);
  font-size: var(--text-display-md);
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 4px 12px rgba(255, 210, 63, 0.3);
}

.timer--urgent {
  background: var(--color-energy-red);
  color: white;
  animation: pulse 1s infinite;
}
```

#### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--victory {
  background: var(--color-victory);
  color: white;
}

.badge--new {
  background: var(--color-energy-yellow);
  color: var(--color-electric-900);
  animation: badgeGlow 2s ease-in-out infinite alternate;
}
```

---

## Animations & Transitions

### Base Transitions
```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
  --transition-bounce: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Game Animations
```css
@keyframes scoreCount {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes badgeReveal {
  0% { 
    opacity: 0; 
    transform: scale(0.5) rotate(-10deg);
  }
  50% { 
    opacity: 1; 
    transform: scale(1.1) rotate(5deg);
  }
  100% { 
    opacity: 1; 
    transform: scale(1) rotate(0deg);
  }
}

@keyframes leaderboardSlide {
  0% { 
    opacity: 0; 
    transform: translateX(-100%);
  }
  100% { 
    opacity: 1; 
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes badgeGlow {
  0% { box-shadow: 0 0 5px rgba(255, 210, 63, 0.5); }
  100% { box-shadow: 0 0 20px rgba(255, 210, 63, 0.8); }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .badge--new {
    animation: none;
    box-shadow: 0 0 10px rgba(255, 210, 63, 0.6);
  }
}
```

---

## Loading States

### Skeleton Screens
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 0.5rem;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}
```

---

## Responsive Design

### Breakpoints
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Mobile-First Approach
```css
/* Mobile (default) */
.game-layout {
  padding: 1rem;
  gap: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .game-layout {
    padding: 1.5rem;
    gap: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .game-layout {
    padding: 2rem;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast
- Color is never the only way to convey information

### Focus Management
```css
.focusable:focus {
  outline: 2px solid var(--color-electric-500);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.focusable:focus:not(:focus-visible) {
  outline: none;
}
```

### Motion Preferences
- All animations respect `prefers-reduced-motion`
- Critical information is never conveyed through motion alone
- Animations enhance but don't replace functionality

---

## Error Handling

### Playful Error Messages
```css
.error-message {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border: 1px solid var(--color-energy-red);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  color: var(--color-defeat);
  font-weight: 500;
}

.error-message::before {
  content: "🤔 ";
  margin-right: 0.5rem;
}
```

### Error Message Tone
- "Oops! Something got a little mixed up there"
- "Hmm, that didn't work as expected"
- "Let's try that again!"
- "Looks like we hit a snag"

---

## Implementation Notes

### CSS Custom Properties
All colors, spacing, and timing values use CSS custom properties for easy theming and maintenance.

### Tailwind Integration
The design system integrates with Tailwind CSS through the `tailwind.config.js` file, extending the default theme with our custom tokens.

### Component Library
Each component should be built as a reusable React component with proper TypeScript typing and accessibility features.

### Performance Considerations
- Use `transform` and `opacity` for animations
- Implement proper lazy loading for images
- Optimize for 60fps animations
- Consider battery impact on mobile devices

---

## Usage Examples

### Game State Indicators
```jsx
<div className="game-status">
  <div className="badge badge--victory">Round Complete</div>
  <div className="timer timer--urgent">0:05</div>
</div>
```

### Leaderboard Entry
```jsx
<div className="card-team card-team--selected">
  <div className="score-display">1,250</div>
  <h3 className="text-lg font-semibold">Team Awesome</h3>
  <div className="badge badge--new">New High Score!</div>
</div>
```

### Loading State
```jsx
<div className="skeleton-container">
  <div className="skeleton skeleton-avatar"></div>
  <div className="skeleton skeleton-text"></div>
  <div className="skeleton skeleton-text"></div>
</div>
```

This style guide should evolve with the project. Update it as new patterns emerge and user feedback is incorporated! 
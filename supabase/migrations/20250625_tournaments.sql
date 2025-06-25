-- Tournament tables for Tony Trivia

-- Tournament main table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format VARCHAR(50) NOT NULL CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'in_progress', 'completed', 'cancelled')),
  max_teams INTEGER NOT NULL DEFAULT 16,
  min_teams INTEGER NOT NULL DEFAULT 2,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament teams/participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  seed INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'active', 'eliminated', 'withdrawn')),
  final_position INTEGER,
  stats JSONB DEFAULT '{}',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  eliminated_at TIMESTAMPTZ,
  UNIQUE(tournament_id, team_id)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  bracket_position VARCHAR(100), -- For bracket visualization (e.g., 'QF1', 'SF2', 'F')
  team1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'bye')),
  game_room_id UUID REFERENCES game_rooms(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  match_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, round, match_number)
);

-- Tournament rounds (for round-robin and swiss)
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, round_number)
);

-- Tournament standings (for round-robin and swiss)
CREATE TABLE IF NOT EXISTS tournament_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  matches_drawn INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  points_difference INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED,
  tournament_points INTEGER DEFAULT 0, -- For custom point systems
  tiebreaker_score DECIMAL(10, 4) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, participant_id)
);

-- Tournament history/statistics
CREATE TABLE IF NOT EXISTS tournament_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tournaments_host_id ON tournaments(host_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_team_id ON tournament_participants(team_id);
CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round ON tournament_matches(tournament_id, round);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX idx_tournament_standings_tournament_id ON tournament_standings(tournament_id);
CREATE INDEX idx_tournament_history_tournament_id ON tournament_history(tournament_id);

-- Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "tournaments_select_policy" ON tournaments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tournaments_insert_policy" ON tournaments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "tournaments_update_policy" ON tournaments
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "tournaments_delete_policy" ON tournaments
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

-- RLS Policies for tournament_participants (public read, host can manage)
CREATE POLICY "tournament_participants_select_policy" ON tournament_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tournament_participants_insert_policy" ON tournament_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_participants.tournament_id 
      AND tournaments.host_id = auth.uid()
    )
  );

CREATE POLICY "tournament_participants_update_policy" ON tournament_participants
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_participants.tournament_id 
      AND tournaments.host_id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "tournament_matches_select_policy" ON tournament_matches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tournament_matches_manage_policy" ON tournament_matches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_matches.tournament_id 
      AND tournaments.host_id = auth.uid()
    )
  );

CREATE POLICY "tournament_standings_select_policy" ON tournament_standings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tournament_history_select_policy" ON tournament_history
  FOR SELECT TO authenticated
  USING (true);

-- Function to update tournament standings after match completion
CREATE OR REPLACE FUNCTION update_tournament_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update standings for round-robin tournaments
    IF EXISTS (
      SELECT 1 FROM tournaments 
      WHERE id = NEW.tournament_id 
      AND format IN ('round_robin', 'swiss')
    ) THEN
      -- Update winner stats
      IF NEW.winner_id IS NOT NULL THEN
        INSERT INTO tournament_standings (tournament_id, participant_id, position, matches_played, matches_won)
        VALUES (NEW.tournament_id, NEW.winner_id, 0, 1, 1)
        ON CONFLICT (tournament_id, participant_id)
        DO UPDATE SET
          matches_played = tournament_standings.matches_played + 1,
          matches_won = tournament_standings.matches_won + 1,
          points_for = tournament_standings.points_for + COALESCE(
            CASE 
              WHEN NEW.winner_id = NEW.team1_id THEN NEW.team1_score
              ELSE NEW.team2_score
            END, 0
          ),
          points_against = tournament_standings.points_against + COALESCE(
            CASE 
              WHEN NEW.winner_id = NEW.team1_id THEN NEW.team2_score
              ELSE NEW.team1_score
            END, 0
          ),
          updated_at = NOW();
      END IF;
      
      -- Update loser stats
      IF NEW.loser_id IS NOT NULL THEN
        INSERT INTO tournament_standings (tournament_id, participant_id, position, matches_played, matches_lost)
        VALUES (NEW.tournament_id, NEW.loser_id, 0, 1, 1)
        ON CONFLICT (tournament_id, participant_id)
        DO UPDATE SET
          matches_played = tournament_standings.matches_played + 1,
          matches_lost = tournament_standings.matches_lost + 1,
          points_for = tournament_standings.points_for + COALESCE(
            CASE 
              WHEN NEW.loser_id = NEW.team1_id THEN NEW.team1_score
              ELSE NEW.team2_score
            END, 0
          ),
          points_against = tournament_standings.points_against + COALESCE(
            CASE 
              WHEN NEW.loser_id = NEW.team1_id THEN NEW.team2_score
              ELSE NEW.team1_score
            END, 0
          ),
          updated_at = NOW();
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_standings_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_standings();

-- Function to calculate and update tournament positions
CREATE OR REPLACE FUNCTION calculate_tournament_positions(p_tournament_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked_teams AS (
    SELECT 
      participant_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          matches_won DESC,
          points_difference DESC,
          points_for DESC,
          tiebreaker_score DESC
      ) AS new_position
    FROM tournament_standings
    WHERE tournament_id = p_tournament_id
  )
  UPDATE tournament_standings
  SET position = ranked_teams.new_position
  FROM ranked_teams
  WHERE tournament_standings.participant_id = ranked_teams.participant_id
  AND tournament_standings.tournament_id = p_tournament_id;
END;
$$ LANGUAGE plpgsql;
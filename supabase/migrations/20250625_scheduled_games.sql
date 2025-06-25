-- Create scheduled_games table
CREATE TABLE IF NOT EXISTS public.scheduled_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_players INTEGER DEFAULT 20,
    settings JSONB DEFAULT '{}',
    recurring_pattern VARCHAR(50), -- 'none', 'daily', 'weekly', 'monthly'
    recurring_end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT scheduled_games_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT scheduled_games_recurring_check CHECK (recurring_pattern IN ('none', 'daily', 'weekly', 'monthly') OR recurring_pattern IS NULL)
);

-- Create scheduled_game_participants table for RSVP functionality
CREATE TABLE IF NOT EXISTS public.scheduled_game_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduled_game_id UUID NOT NULL REFERENCES public.scheduled_games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(50) DEFAULT 'invited', -- 'invited', 'accepted', 'declined', 'tentative'
    team_preference VARCHAR(255),
    notified_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT scheduled_game_participants_status_check CHECK (rsvp_status IN ('invited', 'accepted', 'declined', 'tentative')),
    CONSTRAINT scheduled_game_participants_unique UNIQUE (scheduled_game_id, user_id)
);

-- Create scheduled_game_reminders table for tracking reminder notifications
CREATE TABLE IF NOT EXISTS public.scheduled_game_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduled_game_id UUID NOT NULL REFERENCES public.scheduled_games(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'email', 'push', 'in_app'
    time_before_minutes INTEGER NOT NULL, -- How many minutes before the game to send reminder
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT scheduled_game_reminders_type_check CHECK (reminder_type IN ('email', 'push', 'in_app'))
);

-- Create indexes for better query performance
CREATE INDEX idx_scheduled_games_host_id ON public.scheduled_games(host_id);
CREATE INDEX idx_scheduled_games_scheduled_for ON public.scheduled_games(scheduled_for);
CREATE INDEX idx_scheduled_games_status ON public.scheduled_games(status);
CREATE INDEX idx_scheduled_game_participants_user_id ON public.scheduled_game_participants(user_id);
CREATE INDEX idx_scheduled_game_participants_scheduled_game_id ON public.scheduled_game_participants(scheduled_game_id);
CREATE INDEX idx_scheduled_game_participants_rsvp_status ON public.scheduled_game_participants(rsvp_status);
CREATE INDEX idx_scheduled_game_reminders_scheduled_game_id ON public.scheduled_game_reminders(scheduled_game_id);

-- Create RLS policies for scheduled_games
ALTER TABLE public.scheduled_games ENABLE ROW LEVEL SECURITY;

-- Hosts can view and manage their own scheduled games
CREATE POLICY "Hosts can view own scheduled games" ON public.scheduled_games
    FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can create scheduled games" ON public.scheduled_games
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own scheduled games" ON public.scheduled_games
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own scheduled games" ON public.scheduled_games
    FOR DELETE USING (auth.uid() = host_id);

-- Participants can view games they're invited to
CREATE POLICY "Participants can view scheduled games" ON public.scheduled_games
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.scheduled_game_participants
            WHERE scheduled_game_participants.scheduled_game_id = scheduled_games.id
            AND scheduled_game_participants.user_id = auth.uid()
        )
    );

-- Create RLS policies for scheduled_game_participants
ALTER TABLE public.scheduled_game_participants ENABLE ROW LEVEL SECURITY;

-- Users can view their own participation records
CREATE POLICY "Users can view own participation" ON public.scheduled_game_participants
    FOR SELECT USING (auth.uid() = user_id);

-- Hosts can view and manage participants for their games
CREATE POLICY "Hosts can view game participants" ON public.scheduled_game_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.scheduled_games
            WHERE scheduled_games.id = scheduled_game_participants.scheduled_game_id
            AND scheduled_games.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can invite participants" ON public.scheduled_game_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.scheduled_games
            WHERE scheduled_games.id = scheduled_game_participants.scheduled_game_id
            AND scheduled_games.host_id = auth.uid()
        )
    );

-- Users can update their own RSVP status
CREATE POLICY "Users can update own RSVP" ON public.scheduled_game_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for scheduled_game_reminders
ALTER TABLE public.scheduled_game_reminders ENABLE ROW LEVEL SECURITY;

-- Hosts can manage reminders for their games
CREATE POLICY "Hosts can manage game reminders" ON public.scheduled_game_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.scheduled_games
            WHERE scheduled_games.id = scheduled_game_reminders.scheduled_game_id
            AND scheduled_games.host_id = auth.uid()
        )
    );

-- Create functions for scheduled games
CREATE OR REPLACE FUNCTION public.update_scheduled_game_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_scheduled_games_updated_at
    BEFORE UPDATE ON public.scheduled_games
    FOR EACH ROW
    EXECUTE FUNCTION public.update_scheduled_game_updated_at();

CREATE TRIGGER update_scheduled_game_participants_updated_at
    BEFORE UPDATE ON public.scheduled_game_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_scheduled_game_updated_at();

-- Function to automatically create game room when scheduled time arrives
CREATE OR REPLACE FUNCTION public.create_game_room_from_scheduled()
RETURNS TRIGGER AS $$
DECLARE
    new_room_id UUID;
BEGIN
    -- Only proceed if the scheduled game is starting
    IF NEW.status = 'in_progress' AND OLD.status = 'scheduled' THEN
        -- Create a new game room
        INSERT INTO public.game_rooms (
            name,
            description,
            host_id,
            status,
            max_players,
            settings
        ) VALUES (
            NEW.title,
            NEW.description,
            NEW.host_id,
            'waiting',
            NEW.max_players,
            NEW.settings
        ) RETURNING id INTO new_room_id;
        
        -- Update the scheduled game with the room ID
        NEW.room_id = new_room_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_game_room
    BEFORE UPDATE ON public.scheduled_games
    FOR EACH ROW
    EXECUTE FUNCTION public.create_game_room_from_scheduled();

-- Function to handle recurring games
CREATE OR REPLACE FUNCTION public.create_next_recurring_game()
RETURNS TRIGGER AS $$
DECLARE
    next_scheduled_time TIMESTAMPTZ;
    new_game_id UUID;
BEGIN
    -- Only create next recurring game if this one is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' 
       AND NEW.recurring_pattern IS NOT NULL 
       AND NEW.recurring_pattern != 'none' THEN
        
        -- Calculate next scheduled time based on pattern
        CASE NEW.recurring_pattern
            WHEN 'daily' THEN
                next_scheduled_time := NEW.scheduled_for + INTERVAL '1 day';
            WHEN 'weekly' THEN
                next_scheduled_time := NEW.scheduled_for + INTERVAL '1 week';
            WHEN 'monthly' THEN
                next_scheduled_time := NEW.scheduled_for + INTERVAL '1 month';
        END CASE;
        
        -- Check if we're still within the recurring end date
        IF NEW.recurring_end_date IS NULL OR next_scheduled_time::DATE <= NEW.recurring_end_date THEN
            -- Create the next scheduled game
            INSERT INTO public.scheduled_games (
                host_id,
                title,
                description,
                scheduled_for,
                duration_minutes,
                max_players,
                settings,
                recurring_pattern,
                recurring_end_date
            ) VALUES (
                NEW.host_id,
                NEW.title,
                NEW.description,
                next_scheduled_time,
                NEW.duration_minutes,
                NEW.max_players,
                NEW.settings,
                NEW.recurring_pattern,
                NEW.recurring_end_date
            ) RETURNING id INTO new_game_id;
            
            -- Copy participant invitations to the new game
            INSERT INTO public.scheduled_game_participants (
                scheduled_game_id,
                user_id,
                rsvp_status
            )
            SELECT 
                new_game_id,
                user_id,
                'invited'
            FROM public.scheduled_game_participants
            WHERE scheduled_game_id = NEW.id
            AND rsvp_status = 'accepted';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_recurring_games
    AFTER UPDATE ON public.scheduled_games
    FOR EACH ROW
    EXECUTE FUNCTION public.create_next_recurring_game();
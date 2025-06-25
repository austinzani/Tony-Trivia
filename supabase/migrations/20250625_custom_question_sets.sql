-- Custom Question Sets for Tony Trivia
-- This migration creates the database schema for custom question sets feature

-- Create tags table for organizing question sets
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question_sets table for storing custom question collections
CREATE TABLE IF NOT EXISTS public.question_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    visibility_level VARCHAR(20) DEFAULT 'private' CHECK (visibility_level IN ('private', 'public', 'shared')),
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_questions table for storing questions within sets
CREATE TABLE IF NOT EXISTS public.custom_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'fill_blank')),
    options JSONB DEFAULT '[]', -- For multiple choice options
    correct_answer TEXT NOT NULL,
    explanation TEXT, -- Optional explanation for the answer
    points INTEGER DEFAULT 1 CHECK (points > 0),
    time_limit INTEGER DEFAULT 30, -- seconds
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for question set tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.question_set_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_set_id, tag_id)
);

-- Table for sharing question sets between hosts
CREATE TABLE IF NOT EXISTS public.shared_question_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'duplicate')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_set_id, shared_with_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_sets_host_id ON public.question_sets(host_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_visibility ON public.question_sets(visibility_level);
CREATE INDEX IF NOT EXISTS idx_question_sets_public ON public.question_sets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_custom_questions_set_id ON public.custom_questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_custom_questions_order ON public.custom_questions(question_set_id, order_index);
CREATE INDEX IF NOT EXISTS idx_question_set_tags_set_id ON public.question_set_tags(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_set_tags_tag_id ON public.question_set_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_shared_question_sets_user ON public.shared_question_sets(shared_with_user_id);

-- Function to update question_count in question_sets
CREATE OR REPLACE FUNCTION update_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.question_sets 
        SET question_count = question_count + 1,
            updated_at = NOW()
        WHERE id = NEW.question_set_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.question_sets 
        SET question_count = question_count - 1,
            updated_at = NOW()
        WHERE id = OLD.question_set_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update question_count
DROP TRIGGER IF EXISTS trigger_update_question_count_insert ON public.custom_questions;
CREATE TRIGGER trigger_update_question_count_insert
    AFTER INSERT ON public.custom_questions
    FOR EACH ROW EXECUTE FUNCTION update_question_count();

DROP TRIGGER IF EXISTS trigger_update_question_count_delete ON public.custom_questions;
CREATE TRIGGER trigger_update_question_count_delete
    AFTER DELETE ON public.custom_questions
    FOR EACH ROW EXECUTE FUNCTION update_question_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_question_sets_updated_at ON public.question_sets;
CREATE TRIGGER trigger_question_sets_updated_at
    BEFORE UPDATE ON public.question_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_custom_questions_updated_at ON public.custom_questions;
CREATE TRIGGER trigger_custom_questions_updated_at
    BEFORE UPDATE ON public.custom_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_tags_updated_at ON public.tags;
CREATE TRIGGER trigger_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags
INSERT INTO public.tags (name, color) VALUES 
    ('General Knowledge', '#3B82F6'),
    ('Science', '#10B981'),
    ('History', '#F59E0B'),
    ('Sports', '#EF4444'),
    ('Entertainment', '#8B5CF6'),
    ('Geography', '#06B6D4'),
    ('Literature', '#84CC16'),
    ('Technology', '#6366F1')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_set_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_sets
CREATE POLICY "Users can view their own question sets" ON public.question_sets
    FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Users can view public question sets" ON public.question_sets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view shared question sets" ON public.question_sets
    FOR SELECT USING (
        id IN (
            SELECT question_set_id FROM public.shared_question_sets 
            WHERE shared_with_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own question sets" ON public.question_sets
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own question sets" ON public.question_sets
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own question sets" ON public.question_sets
    FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for custom_questions
CREATE POLICY "Users can view questions in their sets" ON public.custom_questions
    FOR SELECT USING (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Users can view questions in public sets" ON public.question_sets
    FOR SELECT USING (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE is_public = true
        )
    );

CREATE POLICY "Users can view questions in shared sets" ON public.custom_questions
    FOR SELECT USING (
        question_set_id IN (
            SELECT question_set_id FROM public.shared_question_sets 
            WHERE shared_with_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage questions in their sets" ON public.custom_questions
    FOR ALL USING (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        )
    );

-- RLS Policies for tags (publicly readable)
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage tags" ON public.tags FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for question_set_tags
CREATE POLICY "Users can manage tags for their question sets" ON public.question_set_tags
    FOR ALL USING (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Users can view tags for accessible question sets" ON public.question_set_tags
    FOR SELECT USING (
        question_set_id IN (
            SELECT id FROM public.question_sets 
            WHERE host_id = auth.uid() OR is_public = true
        ) OR question_set_id IN (
            SELECT question_set_id FROM public.shared_question_sets 
            WHERE shared_with_user_id = auth.uid()
        )
    );

-- RLS Policies for shared_question_sets
CREATE POLICY "Users can view shares involving them" ON public.shared_question_sets
    FOR SELECT USING (
        shared_with_user_id = auth.uid() OR 
        shared_by_user_id = auth.uid() OR
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        )
    );

CREATE POLICY "Users can share their own question sets" ON public.shared_question_sets
    FOR INSERT WITH CHECK (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        ) AND shared_by_user_id = auth.uid()
    );

CREATE POLICY "Users can manage shares of their question sets" ON public.shared_question_sets
    FOR ALL USING (
        question_set_id IN (
            SELECT id FROM public.question_sets WHERE host_id = auth.uid()
        )
    );
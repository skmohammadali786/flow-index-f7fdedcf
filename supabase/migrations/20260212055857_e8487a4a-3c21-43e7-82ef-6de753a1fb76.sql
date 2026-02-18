
-- Create wellness journal table
CREATE TABLE public.wellness_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  gratitude TEXT,
  reflection TEXT,
  affirmation TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  self_care_done BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.wellness_journal ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own journal entries"
  ON public.wellness_journal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON public.wellness_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.wellness_journal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.wellness_journal FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wellness_journal_updated_at
  BEFORE UPDATE ON public.wellness_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

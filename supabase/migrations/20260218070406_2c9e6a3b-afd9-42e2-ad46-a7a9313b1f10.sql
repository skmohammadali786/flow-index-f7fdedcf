
-- Create workout_logs table with 50+ workout types support
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type TEXT NOT NULL,
  workout_category TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  calories_burned INTEGER,
  intensity TEXT DEFAULT 'moderate',
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC,
  distance_km NUMERIC,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  notes TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own workout logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, date DESC);

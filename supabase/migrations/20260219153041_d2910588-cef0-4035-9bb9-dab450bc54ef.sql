
CREATE TABLE public.workout_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workouts_per_week INTEGER NOT NULL DEFAULT 4,
  minutes_per_week INTEGER NOT NULL DEFAULT 150,
  calories_per_week INTEGER NOT NULL DEFAULT 1500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout goals" ON public.workout_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout goals" ON public.workout_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout goals" ON public.workout_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_workout_goals_user_id ON public.workout_goals (user_id);

CREATE TRIGGER update_workout_goals_updated_at
  BEFORE UPDATE ON public.workout_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

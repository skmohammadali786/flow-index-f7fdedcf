-- Create clinical_assessments table to store VAS scales and clinical notes
CREATE TABLE public.clinical_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_vas INTEGER DEFAULT 0 CHECK (pain_vas >= 0 AND pain_vas <= 10),
  fatigue_vas INTEGER DEFAULT 0 CHECK (fatigue_vas >= 0 AND fatigue_vas <= 10),
  mood_vas INTEGER DEFAULT 0 CHECK (mood_vas >= 0 AND mood_vas <= 10),
  bloating_vas INTEGER DEFAULT 0 CHECK (bloating_vas >= 0 AND bloating_vas <= 10),
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own clinical assessments"
  ON public.clinical_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinical assessments"
  ON public.clinical_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinical assessments"
  ON public.clinical_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinical assessments"
  ON public.clinical_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clinical_assessments_updated_at
  BEFORE UPDATE ON public.clinical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fertility daily logs (OPK, cervical mucus, LH, intercourse, BBT)
CREATE TABLE public.fertility_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opk_result TEXT CHECK (opk_result IN ('negative', 'low', 'high', 'peak')),
  cervical_mucus TEXT CHECK (cervical_mucus IN ('dry', 'sticky', 'creamy', 'watery', 'egg_white')),
  lh_level NUMERIC,
  intercourse BOOLEAN DEFAULT false,
  intercourse_protected BOOLEAN,
  cervix_position TEXT CHECK (cervix_position IN ('low', 'medium', 'high')),
  cervix_firmness TEXT CHECK (cervix_firmness IN ('firm', 'medium', 'soft')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.fertility_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fertility logs" ON public.fertility_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fertility logs" ON public.fertility_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fertility logs" ON public.fertility_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fertility logs" ON public.fertility_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_fertility_logs_updated_at BEFORE UPDATE ON public.fertility_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pregnancy tracking
CREATE TABLE public.pregnancy_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conception_date DATE,
  last_period_date DATE,
  due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  pregnancy_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pregnancy" ON public.pregnancy_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy" ON public.pregnancy_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy" ON public.pregnancy_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy" ON public.pregnancy_tracking FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pregnancy_tracking_updated_at BEFORE UPDATE ON public.pregnancy_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pregnancy weekly logs
CREATE TABLE public.pregnancy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregnancy_id UUID NOT NULL REFERENCES public.pregnancy_tracking(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week_number INTEGER,
  weight NUMERIC,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  symptoms TEXT[] DEFAULT '{}',
  baby_movements INTEGER,
  appointment_notes TEXT,
  mood TEXT CHECK (mood IN ('happy', 'calm', 'anxious', 'sad', 'irritable', 'energetic', 'tired', 'nauseous')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.pregnancy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pregnancy logs" ON public.pregnancy_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy logs" ON public.pregnancy_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy logs" ON public.pregnancy_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy logs" ON public.pregnancy_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pregnancy_logs_updated_at BEFORE UPDATE ON public.pregnancy_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Birth records
CREATE TABLE public.birth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregnancy_id UUID REFERENCES public.pregnancy_tracking(id) ON DELETE SET NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_type TEXT CHECK (birth_type IN ('vaginal', 'cesarean', 'assisted', 'water_birth')),
  baby_name TEXT,
  baby_weight NUMERIC,
  baby_length NUMERIC,
  baby_gender TEXT CHECK (baby_gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  apgar_1min INTEGER,
  apgar_5min INTEGER,
  birth_location TEXT,
  birth_notes TEXT,
  -- Birth plan fields
  birth_plan JSONB DEFAULT '{}',
  complications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.birth_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own birth records" ON public.birth_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own birth records" ON public.birth_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own birth records" ON public.birth_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own birth records" ON public.birth_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_birth_records_updated_at BEFORE UPDATE ON public.birth_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Postpartum logs
CREATE TABLE public.postpartum_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_record_id UUID REFERENCES public.birth_records(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  sleep_hours NUMERIC,
  bleeding_intensity TEXT CHECK (bleeding_intensity IN ('none', 'light', 'moderate', 'heavy')),
  pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
  breastfeeding BOOLEAN,
  breastfeeding_issues TEXT,
  physical_symptoms TEXT[] DEFAULT '{}',
  emotional_symptoms TEXT[] DEFAULT '{}',
  support_received BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.postpartum_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own postpartum logs" ON public.postpartum_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum logs" ON public.postpartum_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postpartum logs" ON public.postpartum_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own postpartum logs" ON public.postpartum_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_postpartum_logs_updated_at BEFORE UPDATE ON public.postpartum_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

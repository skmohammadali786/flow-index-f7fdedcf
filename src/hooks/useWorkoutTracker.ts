import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  workout_category: string;
  duration_minutes: number;
  calories_burned: number | null;
  intensity: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  distance_km: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export type WorkoutCategory = 
  | 'cardio' | 'strength' | 'flexibility' | 'sports' | 'water' 
  | 'dance' | 'martial_arts' | 'outdoor' | 'mind_body' | 'hiit';

export interface WorkoutType {
  id: string;
  label: string;
  category: WorkoutCategory;
  emoji: string;
  caloriesPerMin: number; // approximate
}

export const WORKOUT_TYPES: WorkoutType[] = [
  // Cardio (10)
  { id: 'running', label: 'Running', category: 'cardio', emoji: '🏃', caloriesPerMin: 10 },
  { id: 'jogging', label: 'Jogging', category: 'cardio', emoji: '🏃‍♀️', caloriesPerMin: 7 },
  { id: 'walking', label: 'Walking', category: 'cardio', emoji: '🚶', caloriesPerMin: 4 },
  { id: 'cycling', label: 'Cycling', category: 'cardio', emoji: '🚴', caloriesPerMin: 8 },
  { id: 'swimming', label: 'Swimming', category: 'cardio', emoji: '🏊', caloriesPerMin: 9 },
  { id: 'jump_rope', label: 'Jump Rope', category: 'cardio', emoji: '⏭️', caloriesPerMin: 12 },
  { id: 'stair_climbing', label: 'Stair Climbing', category: 'cardio', emoji: '🪜', caloriesPerMin: 9 },
  { id: 'elliptical', label: 'Elliptical', category: 'cardio', emoji: '🏋️', caloriesPerMin: 7 },
  { id: 'rowing', label: 'Rowing', category: 'cardio', emoji: '🚣', caloriesPerMin: 8 },
  { id: 'spinning', label: 'Spinning', category: 'cardio', emoji: '🔄', caloriesPerMin: 10 },
  
  // Strength (10)
  { id: 'weight_lifting', label: 'Weight Lifting', category: 'strength', emoji: '🏋️‍♀️', caloriesPerMin: 6 },
  { id: 'push_ups', label: 'Push-ups', category: 'strength', emoji: '💪', caloriesPerMin: 7 },
  { id: 'pull_ups', label: 'Pull-ups', category: 'strength', emoji: '🔝', caloriesPerMin: 8 },
  { id: 'squats', label: 'Squats', category: 'strength', emoji: '🦵', caloriesPerMin: 6 },
  { id: 'deadlifts', label: 'Deadlifts', category: 'strength', emoji: '⬆️', caloriesPerMin: 7 },
  { id: 'bench_press', label: 'Bench Press', category: 'strength', emoji: '🪑', caloriesPerMin: 5 },
  { id: 'lunges', label: 'Lunges', category: 'strength', emoji: '🦿', caloriesPerMin: 6 },
  { id: 'planks', label: 'Planks', category: 'strength', emoji: '🧱', caloriesPerMin: 4 },
  { id: 'kettlebell', label: 'Kettlebell', category: 'strength', emoji: '🔔', caloriesPerMin: 9 },
  { id: 'resistance_bands', label: 'Resistance Bands', category: 'strength', emoji: '🎗️', caloriesPerMin: 5 },
  
  // Flexibility (6)
  { id: 'yoga', label: 'Yoga', category: 'flexibility', emoji: '🧘', caloriesPerMin: 4 },
  { id: 'stretching', label: 'Stretching', category: 'flexibility', emoji: '🤸', caloriesPerMin: 3 },
  { id: 'pilates', label: 'Pilates', category: 'flexibility', emoji: '🏋️', caloriesPerMin: 5 },
  { id: 'foam_rolling', label: 'Foam Rolling', category: 'flexibility', emoji: '🧽', caloriesPerMin: 2 },
  { id: 'barre', label: 'Barre', category: 'flexibility', emoji: '🩰', caloriesPerMin: 5 },
  { id: 'tai_chi', label: 'Tai Chi', category: 'flexibility', emoji: '☯️', caloriesPerMin: 3 },
  
  // Sports (8)
  { id: 'tennis', label: 'Tennis', category: 'sports', emoji: '🎾', caloriesPerMin: 8 },
  { id: 'basketball', label: 'Basketball', category: 'sports', emoji: '🏀', caloriesPerMin: 9 },
  { id: 'soccer', label: 'Soccer', category: 'sports', emoji: '⚽', caloriesPerMin: 9 },
  { id: 'volleyball', label: 'Volleyball', category: 'sports', emoji: '🏐', caloriesPerMin: 6 },
  { id: 'badminton', label: 'Badminton', category: 'sports', emoji: '🏸', caloriesPerMin: 7 },
  { id: 'table_tennis', label: 'Table Tennis', category: 'sports', emoji: '🏓', caloriesPerMin: 5 },
  { id: 'golf', label: 'Golf', category: 'sports', emoji: '⛳', caloriesPerMin: 4 },
  { id: 'cricket', label: 'Cricket', category: 'sports', emoji: '🏏', caloriesPerMin: 5 },
  
  // Dance (5)
  { id: 'zumba', label: 'Zumba', category: 'dance', emoji: '💃', caloriesPerMin: 8 },
  { id: 'aerobics', label: 'Aerobics', category: 'dance', emoji: '🕺', caloriesPerMin: 7 },
  { id: 'hip_hop_dance', label: 'Hip Hop Dance', category: 'dance', emoji: '🎤', caloriesPerMin: 8 },
  { id: 'salsa', label: 'Salsa', category: 'dance', emoji: '🌹', caloriesPerMin: 6 },
  { id: 'ballet', label: 'Ballet', category: 'dance', emoji: '🩰', caloriesPerMin: 6 },
  
  // Martial Arts (4)
  { id: 'boxing', label: 'Boxing', category: 'martial_arts', emoji: '🥊', caloriesPerMin: 10 },
  { id: 'kickboxing', label: 'Kickboxing', category: 'martial_arts', emoji: '🥋', caloriesPerMin: 10 },
  { id: 'karate', label: 'Karate', category: 'martial_arts', emoji: '🥋', caloriesPerMin: 8 },
  { id: 'jiu_jitsu', label: 'Jiu Jitsu', category: 'martial_arts', emoji: '🤼', caloriesPerMin: 9 },
  
  // Outdoor (5)
  { id: 'hiking', label: 'Hiking', category: 'outdoor', emoji: '🥾', caloriesPerMin: 6 },
  { id: 'rock_climbing', label: 'Rock Climbing', category: 'outdoor', emoji: '🧗', caloriesPerMin: 9 },
  { id: 'trail_running', label: 'Trail Running', category: 'outdoor', emoji: '🌲', caloriesPerMin: 11 },
  { id: 'skiing', label: 'Skiing', category: 'outdoor', emoji: '⛷️', caloriesPerMin: 8 },
  { id: 'skateboarding', label: 'Skateboarding', category: 'outdoor', emoji: '🛹', caloriesPerMin: 5 },
  
  // HIIT (4)
  { id: 'hiit', label: 'HIIT', category: 'hiit', emoji: '🔥', caloriesPerMin: 12 },
  { id: 'crossfit', label: 'CrossFit', category: 'hiit', emoji: '💥', caloriesPerMin: 11 },
  { id: 'tabata', label: 'Tabata', category: 'hiit', emoji: '⏱️', caloriesPerMin: 13 },
  { id: 'circuit_training', label: 'Circuit Training', category: 'hiit', emoji: '🔁', caloriesPerMin: 10 },
  
  // Mind & Body (3)
  { id: 'meditation', label: 'Meditation', category: 'mind_body', emoji: '🧘‍♂️', caloriesPerMin: 1 },
  { id: 'breathing_exercises', label: 'Breathing Exercises', category: 'mind_body', emoji: '🌬️', caloriesPerMin: 1 },
  { id: 'qigong', label: 'Qigong', category: 'mind_body', emoji: '🌀', caloriesPerMin: 3 },
];

export const WORKOUT_CATEGORIES: { id: WorkoutCategory; label: string; emoji: string; color: string }[] = [
  { id: 'cardio', label: 'Cardio', emoji: '❤️', color: 'hsl(0, 75%, 55%)' },
  { id: 'strength', label: 'Strength', emoji: '💪', color: 'hsl(220, 70%, 55%)' },
  { id: 'flexibility', label: 'Flexibility', emoji: '🤸', color: 'hsl(280, 65%, 55%)' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: 'hsl(142, 55%, 45%)' },
  { id: 'dance', label: 'Dance', emoji: '💃', color: 'hsl(330, 70%, 55%)' },
  { id: 'martial_arts', label: 'Martial Arts', emoji: '🥊', color: 'hsl(25, 85%, 50%)' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🥾', color: 'hsl(160, 60%, 45%)' },
  { id: 'hiit', label: 'HIIT', emoji: '🔥', color: 'hsl(15, 90%, 50%)' },
  { id: 'mind_body', label: 'Mind & Body', emoji: '🧘', color: 'hsl(200, 60%, 55%)' },
  { id: 'water', label: 'Water Sports', emoji: '🏊', color: 'hsl(190, 70%, 50%)' },
];

export function useWorkoutTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setWorkoutLogs((data as unknown as WorkoutLog[]) || []);
    } catch (err) {
      console.error('Error fetching workouts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const addWorkout = useCallback(async (workout: Omit<WorkoutLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          ...workout,
          user_id: user.id,
        } as any);

      if (error) throw error;
      toast({ title: 'Workout logged!', description: `${workout.workout_type} saved successfully.` });
      await fetchWorkouts();
    } catch (err) {
      console.error('Error adding workout:', err);
      toast({ title: 'Error', description: 'Failed to save workout.', variant: 'destructive' });
    }
  }, [user, fetchWorkouts, toast]);

  const deleteWorkout = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Workout deleted' });
      await fetchWorkouts();
    } catch (err) {
      console.error('Error deleting workout:', err);
      toast({ title: 'Error', description: 'Failed to delete workout.', variant: 'destructive' });
    }
  }, [user, fetchWorkouts, toast]);

  return {
    workoutLogs,
    isLoading,
    addWorkout,
    deleteWorkout,
    refetch: fetchWorkouts,
  };
}

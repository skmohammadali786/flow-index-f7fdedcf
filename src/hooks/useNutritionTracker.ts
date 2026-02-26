import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  water_ml: number;
  is_craving: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalIron: number;
  totalWater: number;
  mealCount: number;
  cravingsCount: number;
}

export function useNutritionTracker() {
  const { user } = useAuth();
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;
      setNutritionLogs(data || []);
    } catch (err) {
      console.error('Error fetching nutrition logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addMeal = async (meal: Omit<NutritionLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('nutrition_logs')
        .insert({ ...meal, user_id: user.id });
      if (error) throw error;
      toast.success('Meal logged!');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to log meal');
      console.error(err);
    }
  };

  const deleteMeal = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('nutrition_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Meal deleted');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to delete meal');
    }
  };

  const getDailySummary = (date: string): DailyNutritionSummary => {
    const dayLogs = nutritionLogs.filter(l => l.date === date);
    return {
      date,
      totalCalories: dayLogs.reduce((s, l) => s + (l.calories || 0), 0),
      totalProtein: dayLogs.reduce((s, l) => s + Number(l.protein || 0), 0),
      totalCarbs: dayLogs.reduce((s, l) => s + Number(l.carbs || 0), 0),
      totalFat: dayLogs.reduce((s, l) => s + Number(l.fat || 0), 0),
      totalFiber: dayLogs.reduce((s, l) => s + Number(l.fiber || 0), 0),
      totalIron: dayLogs.reduce((s, l) => s + Number(l.iron || 0), 0),
      totalWater: dayLogs.reduce((s, l) => s + (l.water_ml || 0), 0),
      mealCount: dayLogs.length,
      cravingsCount: dayLogs.filter(l => l.is_craving).length,
    };
  };

  const getWeeklySummaries = (): DailyNutritionSummary[] => {
    const dates = new Set(nutritionLogs.slice(0, 200).map(l => l.date));
    return Array.from(dates).slice(0, 7).map(getDailySummary);
  };

  return { nutritionLogs, isLoading, addMeal, deleteMeal, getDailySummary, getWeeklySummaries, refetch: fetchLogs };
}


export type GroupType = 'operacao' | 'projetos';
export type MealType = 'breakfast' | 'lunch';

export interface User {
  id: string;
  name: string;
  group_type: GroupType;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealRecord {
  id: string;
  user_id?: string | null;
  user_name: string;
  group_type: GroupType;
  meal_type: MealType;
  meal_date: string;
  meal_time: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  breakfast_deadline: string;
  lunch_deadline: string;
  updated_at: string;
}

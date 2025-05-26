
export type GroupType = 'operacao' | 'projetos';
export type MealType = 'breakfast' | 'lunch';

export interface Group {
  id: string;
  name: string;
  display_name: string;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  group_type: GroupType;
  group_id?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealRecord {
  id: string;
  user_id?: string | null;
  user_name: string;
  group_type: GroupType;
  group_id?: string | null;
  meal_type: MealType;
  meal_date: string;
  meal_time: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  breakfast_start_time?: string;
  breakfast_deadline: string;
  lunch_start_time?: string;
  lunch_deadline: string;
  updated_at: string;
}

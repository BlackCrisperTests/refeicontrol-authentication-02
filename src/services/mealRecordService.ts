
import { supabase } from '@/integrations/supabase/client';
import { OfflineCacheService } from './offlineCache';
import { MealType } from '@/types/database.types';

export interface MealRecordData {
  user_id: string | null;
  user_name: string;
  group_id: string | null;
  group_type: string;
  meal_type: MealType;
  meal_date: string;
  meal_time: string;
}

export class MealRecordService {
  static async createMealRecord(data: MealRecordData, isOnline: boolean): Promise<void> {
    if (isOnline) {
      try {
        // Tentar salvar diretamente no banco
        const { error } = await supabase
          .from('meal_records')
          .insert(data);

        if (error) {
          throw error;
        }

        console.log('✅ Registro salvo diretamente no banco de dados');
      } catch (error) {
        console.error('❌ Erro ao salvar no banco, salvando offline:', error);
        // Se falhar, salvar offline
        OfflineCacheService.saveOfflineRecord(data);
        throw new Error('Erro de conexão. Registro salvo localmente e será enviado quando a conexão for restabelecida.');
      }
    } else {
      // Salvar offline
      OfflineCacheService.saveOfflineRecord(data);
      console.log('📱 Sem conexão - registro salvo offline');
      throw new Error('Sem conexão com a internet. Registro salvo localmente e será enviado quando a conexão for restabelecida.');
    }
  }

  static async checkDuplicateRecord(userId: string | null, mealType: MealType, mealDate: string): Promise<boolean> {
    if (!userId) return false;
    
    try {
      const { data: existingRecord } = await supabase
        .from('meal_records')
        .select('id')
        .eq('user_id', userId)
        .eq('meal_type', mealType)
        .eq('meal_date', mealDate)
        .maybeSingle();

      return !!existingRecord;
    } catch (error) {
      console.error('Erro ao verificar registro duplicado:', error);
      return false;
    }
  }
}

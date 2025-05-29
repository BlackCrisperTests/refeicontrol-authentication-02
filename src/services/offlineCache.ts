
import { supabase } from '@/integrations/supabase/client';
import { MealType } from '@/types/database.types';

export interface OfflineMealRecord {
  id: string;
  user_id: string | null;
  user_name: string;
  group_id: string | null;
  group_type: string;
  meal_type: MealType;
  meal_date: string;
  meal_time: string;
  timestamp: number;
}

const OFFLINE_RECORDS_KEY = 'offline_meal_records';

export class OfflineCacheService {
  // Salvar registro localmente
  static saveOfflineRecord(record: Omit<OfflineMealRecord, 'id' | 'timestamp'>): void {
    try {
      const existingRecords = this.getOfflineRecords();
      const newRecord: OfflineMealRecord = {
        ...record,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      existingRecords.push(newRecord);
      localStorage.setItem(OFFLINE_RECORDS_KEY, JSON.stringify(existingRecords));
      
      console.log('📱 Registro salvo offline:', newRecord);
    } catch (error) {
      console.error('❌ Erro ao salvar registro offline:', error);
    }
  }

  // Buscar registros offline
  static getOfflineRecords(): OfflineMealRecord[] {
    try {
      const records = localStorage.getItem(OFFLINE_RECORDS_KEY);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('❌ Erro ao buscar registros offline:', error);
      return [];
    }
  }

  // Limpar registros offline
  static clearOfflineRecords(): void {
    try {
      localStorage.removeItem(OFFLINE_RECORDS_KEY);
      console.log('🧹 Registros offline limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar registros offline:', error);
    }
  }

  // Sincronizar registros offline com o banco
  static async syncOfflineRecords(): Promise<{ success: number; failed: number }> {
    const offlineRecords = this.getOfflineRecords();
    
    if (offlineRecords.length === 0) {
      console.log('✅ Nenhum registro offline para sincronizar');
      return { success: 0, failed: 0 };
    }

    console.log(`🔄 Iniciando sincronização de ${offlineRecords.length} registros offline...`);
    
    let successCount = 0;
    let failedCount = 0;
    const failedRecords: OfflineMealRecord[] = [];

    for (const record of offlineRecords) {
      try {
        // Verificar se já existe um registro para este usuário/data/tipo
        let duplicateCheck = null;
        
        if (record.user_id) {
          const { data: existingRecord } = await supabase
            .from('meal_records')
            .select('id')
            .eq('user_id', record.user_id)
            .eq('meal_type', record.meal_type)
            .eq('meal_date', record.meal_date)
            .maybeSingle();
          
          duplicateCheck = existingRecord;
        }

        if (duplicateCheck) {
          console.log(`⚠️ Registro duplicado ignorado: ${record.user_name} - ${record.meal_type} - ${record.meal_date}`);
          successCount++;
          continue;
        }

        // Inserir registro no banco
        const { error } = await supabase
          .from('meal_records')
          .insert({
            user_id: record.user_id,
            user_name: record.user_name,
            group_id: record.group_id,
            group_type: record.group_type as any,
            meal_type: record.meal_type,
            meal_date: record.meal_date,
            meal_time: record.meal_time
          });

        if (error) {
          throw error;
        }

        console.log(`✅ Registro sincronizado: ${record.user_name} - ${record.meal_type}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Falha ao sincronizar registro: ${record.user_name} - ${record.meal_type}:`, error);
        failedRecords.push(record);
        failedCount++;
      }
    }

    // Se todos os registros foram sincronizados com sucesso, limpar o cache
    if (failedCount === 0) {
      this.clearOfflineRecords();
    } else {
      // Manter apenas os registros que falharam
      localStorage.setItem(OFFLINE_RECORDS_KEY, JSON.stringify(failedRecords));
    }

    console.log(`🔄 Sincronização concluída: ${successCount} sucessos, ${failedCount} falhas`);
    return { success: successCount, failed: failedCount };
  }

  // Verificar se há registros pendentes
  static hasPendingRecords(): boolean {
    return this.getOfflineRecords().length > 0;
  }

  // Obter contador de registros pendentes
  static getPendingRecordsCount(): number {
    return this.getOfflineRecords().length;
  }
}

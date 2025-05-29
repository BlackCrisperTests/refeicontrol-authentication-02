
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database.types';

const OFFLINE_USERS_KEY = 'offline_users_cache';
const CACHE_EXPIRY_KEY = 'offline_users_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milliseconds

export class OfflineUserCacheService {
  // Salvar usuários no cache local
  static saveUsersCache(users: User[]): void {
    try {
      const cacheData = {
        users,
        timestamp: Date.now()
      };
      
      localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
      
      console.log('👥 Cache de usuários atualizado:', users.length, 'usuários');
    } catch (error) {
      console.error('❌ Erro ao salvar cache de usuários:', error);
    }
  }

  // Buscar usuários do cache local
  static getCachedUsers(): User[] {
    try {
      const cacheData = localStorage.getItem(OFFLINE_USERS_KEY);
      const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (!cacheData || !cacheExpiry) {
        console.log('📭 Nenhum cache de usuários encontrado');
        return [];
      }

      // Verificar se o cache expirou
      if (Date.now() > parseInt(cacheExpiry)) {
        console.log('⏰ Cache de usuários expirado');
        this.clearUsersCache();
        return [];
      }

      const parsedData = JSON.parse(cacheData);
      console.log('📱 Usuários carregados do cache:', parsedData.users?.length || 0, 'usuários');
      return parsedData.users || [];
    } catch (error) {
      console.error('❌ Erro ao buscar cache de usuários:', error);
      return [];
    }
  }

  // Limpar cache de usuários
  static clearUsersCache(): void {
    try {
      localStorage.removeItem(OFFLINE_USERS_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      console.log('🧹 Cache de usuários limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de usuários:', error);
    }
  }

  // Buscar usuários com fallback para cache
  static async fetchUsersWithCache(groupId?: string): Promise<User[]> {
    try {
      // Tentar buscar do banco primeiro
      let query = supabase
        .from('users')
        .select('*')
        .eq('active', true);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      const users = data as User[];
      
      // Salvar no cache apenas se conseguiu buscar do banco
      if (!groupId) { // Salvar cache completo apenas quando buscar todos os usuários
        this.saveUsersCache(users);
      }
      
      console.log('✅ Usuários carregados do banco:', users.length, 'usuários');
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários do banco, usando cache:', error);
      
      // Buscar do cache
      const cachedUsers = this.getCachedUsers();
      
      // Filtrar por grupo se necessário
      if (groupId) {
        return cachedUsers.filter(user => user.group_id === groupId);
      }
      
      return cachedUsers;
    }
  }

  // Verificar se há cache válido
  static hasCachedUsers(): boolean {
    const cacheData = localStorage.getItem(OFFLINE_USERS_KEY);
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cacheData || !cacheExpiry) return false;
    
    return Date.now() <= parseInt(cacheExpiry);
  }

  // Obter estatísticas do cache
  static getCacheStats(): { usersCount: number; isExpired: boolean; lastUpdate: Date | null } {
    const cacheData = localStorage.getItem(OFFLINE_USERS_KEY);
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cacheData) {
      return { usersCount: 0, isExpired: true, lastUpdate: null };
    }

    try {
      const parsedData = JSON.parse(cacheData);
      const isExpired = !cacheExpiry || Date.now() > parseInt(cacheExpiry);
      const lastUpdate = parsedData.timestamp ? new Date(parsedData.timestamp) : null;
      
      return {
        usersCount: parsedData.users?.length || 0,
        isExpired,
        lastUpdate
      };
    } catch (error) {
      return { usersCount: 0, isExpired: true, lastUpdate: null };
    }
  }
}

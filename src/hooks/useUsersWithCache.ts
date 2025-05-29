
import { useState, useEffect } from 'react';
import { User } from '@/types/database.types';
import { OfflineUserCacheService } from '@/services/offlineUserCache';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/hooks/use-toast';

export const useUsersWithCache = (groupId?: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();

  const fetchUsers = async () => {
    console.log('🔍 useUsersWithCache: Buscando usuários...', { groupId, isOnline });
    setLoading(true);
    
    try {
      const fetchedUsers = await OfflineUserCacheService.fetchUsersWithCache(groupId);
      setUsers(fetchedUsers);
      
      if (!isOnline && fetchedUsers.length > 0) {
        const cacheStats = OfflineUserCacheService.getCacheStats();
        console.log('📱 Usando cache offline:', cacheStats);
        
        toast({
          title: "Modo Offline",
          description: `Carregados ${fetchedUsers.length} usuário(s) do cache local.`,
        });
      }
      
      console.log('✅ useUsersWithCache: Usuários carregados:', fetchedUsers.length);
    } catch (error: any) {
      console.error('💥 useUsersWithCache: Erro ao carregar usuários:', error);
      
      // Tentar cache como último recurso
      const cachedUsers = OfflineUserCacheService.getCachedUsers();
      if (cachedUsers.length > 0) {
        const filteredUsers = groupId 
          ? cachedUsers.filter(user => user.group_id === groupId)
          : cachedUsers;
        
        setUsers(filteredUsers);
        
        toast({
          title: "Cache local utilizado",
          description: `Carregados ${filteredUsers.length} usuário(s) do cache.`,
        });
      } else {
        toast({
          title: "Erro ao carregar usuários",
          description: "Sem conexão e nenhum cache disponível.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [groupId, isOnline]);

  // Recarregar quando voltar online
  useEffect(() => {
    if (isOnline) {
      console.log('🔄 Conexão restaurada, recarregando usuários...');
      fetchUsers();
    }
  }, [isOnline]);

  return { 
    users, 
    loading, 
    refetch: fetchUsers,
    hasCachedData: OfflineUserCacheService.hasCachedUsers()
  };
};

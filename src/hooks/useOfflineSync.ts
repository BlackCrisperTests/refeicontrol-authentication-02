
import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { OfflineCacheService } from '@/services/offlineCache';
import { toast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const isOnline = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingRecords, setPendingRecords] = useState(0);

  // Atualizar contador de registros pendentes
  const updatePendingCount = () => {
    setPendingRecords(OfflineCacheService.getPendingRecordsCount());
  };

  // Sincronizar registros quando voltar online
  useEffect(() => {
    if (isOnline && OfflineCacheService.hasPendingRecords() && !isSyncing) {
      syncPendingRecords();
    }
  }, [isOnline]);

  // Verificar registros pendentes periodicamente
  useEffect(() => {
    updatePendingCount();
    
    const interval = setInterval(() => {
      updatePendingCount();
      
      // Tentar sincronizar a cada 30 segundos se estiver online
      if (isOnline && OfflineCacheService.hasPendingRecords() && !isSyncing) {
        syncPendingRecords();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, isSyncing]);

  const syncPendingRecords = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const result = await OfflineCacheService.syncOfflineRecords();
      
      if (result.success > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${result.success} registro(s) enviado(s) para o servidor.`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Sincronização parcial",
          description: `${result.failed} registro(s) não puderam ser enviados. Tentaremos novamente.`,
          variant: "destructive"
        });
      }
      
      updatePendingCount();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os registros. Tentaremos novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    pendingRecords,
    syncPendingRecords,
    updatePendingCount
  };
};

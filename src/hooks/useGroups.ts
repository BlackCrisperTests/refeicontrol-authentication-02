
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    console.log('🔍 useGroups: Iniciando busca de grupos...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('active', true)
        .order('display_name');

      console.log('📊 useGroups: Resultado da busca de grupos:', { data, error });

      if (error) {
        console.error('❌ useGroups: Erro ao buscar grupos:', error);
        throw error;
      }
      
      console.log('✅ useGroups: Grupos carregados com sucesso:', data?.length || 0, 'grupos');
      setGroups(data as Group[]);
    } catch (error: any) {
      console.error('💥 useGroups: Erro na função fetchGroups:', error);
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useGroups: Hook montado, carregando grupos...');
    fetchGroups();
  }, []);

  return { groups, loading, refetch: fetchGroups };
};

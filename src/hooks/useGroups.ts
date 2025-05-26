
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('active', true)
        .order('display_name');

      if (error) throw error;
      
      setGroups(data as Group[]);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
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
    fetchGroups();
  }, []);

  return { groups, loading, refetch: fetchGroups };
};

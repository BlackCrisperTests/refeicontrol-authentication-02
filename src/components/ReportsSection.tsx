
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3, Users, Building2, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generatePDF, formatMealRecordForReport, formatUserForReport } from '@/utils/pdfGenerator';
import { useAdminSession } from '@/hooks/useAdminSession';
import { MealRecord, User } from '@/types/database.types';
import ReportFiltersComponent, { ReportFilters } from './ReportFilters';

const ReportsSection = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [users, setUsers] = useState<User[]>([]);
  const adminSession = useAdminSession();

  // Fetch users for filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('active', true)
        .order('name');
      
      if (!error && data) {
        setUsers(data);
      }
    };
    
    fetchUsers();
  }, []);

  const buildQuery = (baseQuery: any) => {
    let query = baseQuery;

    if (filters.month) {
      const startOfMonth = `${filters.month}-01`;
      const year = filters.month.split('-')[0];
      const month = filters.month.split('-')[1];
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      query = query.gte('meal_date', startOfMonth).lte('meal_date', endOfMonth);
    }

    if (filters.group) {
      query = query.eq('group_type', filters.group);
    }

    if (filters.date) {
      query = query.eq('meal_date', filters.date);
    }

    if (filters.user) {
      query = query.eq('user_name', filters.user);
    }

    return query;
  };

  const getFilterDescription = () => {
    const descriptions = [];
    
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      descriptions.push(`${monthNames[parseInt(month) - 1]} de ${year}`);
    }
    
    if (filters.group) {
      descriptions.push(filters.group === 'operacao' ? 'Grupo Operação' : 'Grupo Projetos');
    }
    
    if (filters.date) {
      descriptions.push(`Data: ${new Date(filters.date).toLocaleDateString('pt-BR')}`);
    }
    
    if (filters.user) {
      descriptions.push(`Usuário: ${filters.user}`);
    }

    return descriptions.length > 0 ? ` - Filtros: ${descriptions.join(', ')}` : '';
  };

  const generateCustomReport = async () => {
    setLoading('custom');
    try {
      let query = supabase
        .from('meal_records')
        .select('*');

      query = buildQuery(query);
      query = query.order('meal_date', { ascending: false });

      const { data: records, error } = await query;

      if (error) throw error;

      const reportData = {
        title: 'Relatório Personalizado',
        subtitle: `Refeições${getFilterDescription()}`,
        data: records.map(formatMealRecordForReport),
        columns: [
          { header: 'Data', dataKey: 'data' },
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Grupo', dataKey: 'grupo' },
          { header: 'Refeição', dataKey: 'refeicao' },
          { header: 'Horário', dataKey: 'horario' },
        ],
        adminName: adminSession?.name || 'Admin',
        generatedAt: new Date().toLocaleString('pt-BR'),
      };

      generatePDF(reportData);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório personalizado baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating custom report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateDailyReport = async () => {
    setLoading('daily');
    try {
      const today = filters.date || new Date().toISOString().split('T')[0];
      
      const { data: records, error } = await supabase
        .from('meal_records')
        .select('*')
        .eq('meal_date', today)
        .order('meal_time');

      if (error) throw error;

      const reportData = {
        title: 'Relatório Diário',
        subtitle: `Refeições do dia ${new Date(today).toLocaleDateString('pt-BR')}`,
        data: records.map(formatMealRecordForReport),
        columns: [
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Grupo', dataKey: 'grupo' },
          { header: 'Refeição', dataKey: 'refeicao' },
          { header: 'Horário', dataKey: 'horario' },
        ],
        adminName: adminSession?.name || 'Admin',
        generatedAt: new Date().toLocaleString('pt-BR'),
      };

      generatePDF(reportData);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório diário baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating daily report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateMonthlyReport = async () => {
    setLoading('monthly');
    try {
      let startOfMonth, endOfMonth;
      
      if (filters.month) {
        startOfMonth = `${filters.month}-01`;
        const [year, month] = filters.month.split('-');
        endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      } else {
        startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        startOfMonth = startOfMonth.toISOString().split('T')[0];
        endOfMonth = endOfMonth.toISOString().split('T')[0];
      }
      
      let query = supabase
        .from('meal_records')
        .select('*')
        .gte('meal_date', startOfMonth)
        .lte('meal_date', endOfMonth);

      if (filters.group) {
        query = query.eq('group_type', filters.group);
      }

      if (filters.user) {
        query = query.eq('user_name', filters.user);
      }

      const { data: records, error } = await query.order('meal_date', { ascending: false });

      if (error) throw error;

      const monthName = filters.month ? 
        new Date(`${filters.month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) :
        new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      const reportData = {
        title: 'Relatório Mensal',
        subtitle: `Refeições do mês ${monthName}${getFilterDescription()}`,
        data: records.map(formatMealRecordForReport),
        columns: [
          { header: 'Data', dataKey: 'data' },
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Grupo', dataKey: 'grupo' },
          { header: 'Refeição', dataKey: 'refeicao' },
          { header: 'Horário', dataKey: 'horario' },
        ],
        adminName: adminSession?.name || 'Admin',
        generatedAt: new Date().toLocaleString('pt-BR'),
      };

      generatePDF(reportData);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório mensal baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating monthly report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateUserReport = async () => {
    setLoading('user');
    try {
      let usersQuery = supabase
        .from('users')
        .select('*')
        .order('name');

      if (filters.group) {
        usersQuery = usersQuery.eq('group_type', filters.group);
      }

      if (filters.user) {
        usersQuery = usersQuery.eq('name', filters.user);
      }

      const { data: users, error: usersError } = await usersQuery;

      if (usersError) throw usersError;

      let recordsQuery = supabase
        .from('meal_records')
        .select('user_name, meal_type');

      if (filters.month) {
        const startOfMonth = `${filters.month}-01`;
        const [year, month] = filters.month.split('-');
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        recordsQuery = recordsQuery.gte('meal_date', startOfMonth).lte('meal_date', endOfMonth);
      } else {
        recordsQuery = recordsQuery.gte('meal_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
      }

      if (filters.group) {
        recordsQuery = recordsQuery.eq('group_type', filters.group);
      }

      if (filters.user) {
        recordsQuery = recordsQuery.eq('user_name', filters.user);
      }

      const { data: records, error: recordsError } = await recordsQuery;

      if (recordsError) throw recordsError;

      // Contar refeições por usuário
      const mealCounts = records.reduce((acc: any, record) => {
        if (!acc[record.user_name]) {
          acc[record.user_name] = { breakfast: 0, lunch: 0 };
        }
        acc[record.user_name][record.meal_type]++;
        return acc;
      }, {});

      const userData = users.map(user => ({
        ...formatUserForReport(user),
        cafe: mealCounts[user.name]?.breakfast || 0,
        almoco: mealCounts[user.name]?.lunch || 0,
        total: (mealCounts[user.name]?.breakfast || 0) + (mealCounts[user.name]?.lunch || 0),
      }));

      const reportData = {
        title: 'Relatório por Usuário',
        subtitle: `Usuários cadastrados e consumo${getFilterDescription()}`,
        data: userData,
        columns: [
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Grupo', dataKey: 'grupo' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Café', dataKey: 'cafe' },
          { header: 'Almoço', dataKey: 'almoco' },
          { header: 'Total', dataKey: 'total' },
        ],
        adminName: adminSession?.name || 'Admin',
        generatedAt: new Date().toLocaleString('pt-BR'),
      };

      generatePDF(reportData);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório por usuário baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating user report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const generateGroupReport = async () => {
    setLoading('group');
    try {
      let query = supabase
        .from('meal_records')
        .select('*');

      if (filters.month) {
        const startOfMonth = `${filters.month}-01`;
        const [year, month] = filters.month.split('-');
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('meal_date', startOfMonth).lte('meal_date', endOfMonth);
      } else {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        query = query.gte('meal_date', startOfMonth.toISOString().split('T')[0]);
      }

      if (filters.group) {
        query = query.eq('group_type', filters.group);
      }

      if (filters.user) {
        query = query.eq('user_name', filters.user);
      }

      if (filters.date) {
        query = query.eq('meal_date', filters.date);
      }

      const { data: records, error } = await query.order('meal_date', { ascending: false });

      if (error) throw error;

      // Agrupar por grupo e tipo de refeição
      const groupStats = records.reduce((acc: any, record) => {
        const group = record.group_type === 'operacao' ? 'Operação' : 'Projetos';
        const meal = record.meal_type === 'breakfast' ? 'Café da Manhã' : 'Almoço';
        const key = `${group} - ${meal}`;
        
        if (!acc[key]) {
          acc[key] = { grupo: group, refeicao: meal, total: 0, usuarios: new Set() };
        }
        
        acc[key].total++;
        acc[key].usuarios.add(record.user_name);
        
        return acc;
      }, {});

      const groupData = Object.values(groupStats).map((stat: any) => ({
        grupo: stat.grupo,
        refeicao: stat.refeicao,
        total: stat.total,
        usuarios_unicos: stat.usuarios.size,
      }));

      const reportData = {
        title: 'Relatório por Grupo',
        subtitle: `Estatísticas por grupo${getFilterDescription()}`,
        data: groupData,
        columns: [
          { header: 'Grupo', dataKey: 'grupo' },
          { header: 'Refeição', dataKey: 'refeicao' },
          { header: 'Total Consumido', dataKey: 'total' },
          { header: 'Usuários Únicos', dataKey: 'usuarios_unicos' },
        ],
        adminName: adminSession?.name || 'Admin',
        generatedAt: new Date().toLocaleString('pt-BR'),
      };

      generatePDF(reportData);
      
      toast({
        title: "Relatório gerado",
        description: "Relatório por grupo baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating group report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ReportFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        users={users}
      />

      {/* Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios
          </CardTitle>
          {adminSession && (
            <div className="text-sm text-muted-foreground">
              Logado como: <span className="font-medium">{adminSession.name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={generateDailyReport}
              disabled={loading === 'daily'}
            >
              {loading === 'daily' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Calendar className="h-6 w-6" />
              )}
              <span>Relatório Diário</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={generateMonthlyReport}
              disabled={loading === 'monthly'}
            >
              {loading === 'monthly' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <BarChart3 className="h-6 w-6" />
              )}
              <span>Relatório Mensal</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={generateUserReport}
              disabled={loading === 'user'}
            >
              {loading === 'user' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Users className="h-6 w-6" />
              )}
              <span>Por Usuário</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={generateGroupReport}
              disabled={loading === 'group'}
            >
              {loading === 'group' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
              <span>Por Grupo</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-blue-200 hover:bg-blue-50"
              onClick={generateCustomReport}
              disabled={loading === 'custom'}
            >
              {loading === 'custom' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6 text-blue-600" />
              )}
              <span className="text-blue-600 font-medium">Relatório Personalizado</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;

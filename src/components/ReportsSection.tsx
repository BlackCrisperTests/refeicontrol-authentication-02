
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3, Users, Building2, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generatePDF, formatMealRecordForReport, formatUserForReport } from '@/utils/pdfGenerator';
import { useAdminSession } from '@/hooks/useAdminSession';
import { MealRecord, User } from '@/types/database.types';

const ReportsSection = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const adminSession = useAdminSession();

  const generateDailyReport = async () => {
    setLoading('daily');
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: records, error } = await supabase
        .from('meal_records')
        .select('*')
        .eq('meal_date', today)
        .order('meal_time');

      if (error) throw error;

      const reportData = {
        title: 'Relatório Diário',
        subtitle: `Refeições do dia ${new Date().toLocaleDateString('pt-BR')}`,
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
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      
      const { data: records, error } = await supabase
        .from('meal_records')
        .select('*')
        .gte('meal_date', startOfMonth.toISOString().split('T')[0])
        .lte('meal_date', endOfMonth.toISOString().split('T')[0])
        .order('meal_date', { ascending: false });

      if (error) throw error;

      const reportData = {
        title: 'Relatório Mensal',
        subtitle: `Refeições do mês ${startOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
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
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (usersError) throw usersError;

      const { data: records, error: recordsError } = await supabase
        .from('meal_records')
        .select('user_name, meal_type')
        .gte('meal_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

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
        subtitle: `Usuários cadastrados e consumo do mês`,
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
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const { data: records, error } = await supabase
        .from('meal_records')
        .select('*')
        .gte('meal_date', startOfMonth.toISOString().split('T')[0])
        .order('meal_date', { ascending: false });

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
        subtitle: `Estatísticas por grupo do mês`,
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

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsSection;

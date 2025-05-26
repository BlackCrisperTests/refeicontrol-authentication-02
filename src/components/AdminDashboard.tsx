import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, LogOut, Plus, BarChart3, Calendar, Coffee, Utensils, Building2, FileText, Loader2, Settings, UserCog, Shield, Activity, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, MealRecord, GroupType } from '@/types/database.types';
import SystemSettings from './SystemSettings';
import EditUserDialog from './EditUserDialog';
import PasswordConfirmDialog from './PasswordConfirmDialog';
import MealRecordsTable from './MealRecordsTable';
import AdminUsersManagement from './AdminUsersManagement';
import UsersList from './UsersList';
import ReportsSection from './ReportsSection';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [newUserName, setNewUserName] = useState('');
  const [newUserGroup, setNewUserGroup] = useState<GroupType | ''>('');
  const [users, setUsers] = useState<User[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Edit user states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Password confirmation states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Stats
  const [breakfastToday, setBreakfastToday] = useState(0);
  const [lunchToday, setLunchToday] = useState(0);
  const [operacaoToday, setOperacaoToday] = useState(0);
  const [projetosToday, setProjetosToday] = useState(0);

  // Verificar autenticação
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta área.",
        variant: "destructive"
      });
      navigate('/admin');
      return;
    }
    try {
      const session = JSON.parse(adminSession);
      // Verificar se a sessão não expirou (24 horas)
      const sessionAge = Date.now() - session.loginTime;
      if (sessionAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('admin_session');
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente.",
          variant: "destructive"
        });
        navigate('/admin');
        return;
      }
    } catch {
      localStorage.removeItem('admin_session');
      navigate('/admin');
      return;
    }
  }, [navigate]);

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('users').select('*').order('name');
    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  // Fetch meal records from Supabase
  const fetchMealRecords = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('meal_records').select('*').order('created_at', {
      ascending: false
    });
    if (error) {
      console.error('Error fetching meal records:', error);
      toast({
        title: "Erro ao carregar registros",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setMealRecords(data as MealRecord[]);
    }
    setLoading(false);
  };

  // Fetch today's stats
  const fetchTodayStats = async () => {
    setStatsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      // Breakfast count
      const {
        data: breakfastData,
        error: breakfastError
      } = await supabase.from('meal_records').select('id').eq('meal_date', today).eq('meal_type', 'breakfast');
      if (breakfastError) throw breakfastError;

      // Lunch count
      const {
        data: lunchData,
        error: lunchError
      } = await supabase.from('meal_records').select('id').eq('meal_date', today).eq('meal_type', 'lunch');
      if (lunchError) throw lunchError;

      // Operacao count
      const {
        data: operacaoData,
        error: operacaoError
      } = await supabase.from('meal_records').select('id').eq('meal_date', today).eq('group_type', 'operacao');
      if (operacaoError) throw operacaoError;

      // Projetos count
      const {
        data: projetosData,
        error: projetosError
      } = await supabase.from('meal_records').select('id').eq('meal_date', today).eq('group_type', 'projetos');
      if (projetosError) throw projetosError;
      setBreakfastToday(breakfastData.length);
      setLunchToday(lunchData.length);
      setOperacaoToday(operacaoData.length);
      setProjetosToday(projetosData.length);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchMealRecords();
    fetchTodayStats();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    });
    navigate('/admin');
  };
  const handleAddUser = async () => {
    if (!newUserName || !newUserGroup) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Check if user already exists
      const {
        data: existingUser
      } = await supabase.from('users').select('id').eq('name', newUserName).eq('group_type', newUserGroup).maybeSingle();
      if (existingUser) {
        toast({
          title: "Usuário já existe",
          description: `${newUserName} já está cadastrado no grupo ${newUserGroup === 'operacao' ? 'Operação' : 'Projetos'}.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Add new user
      const {
        error
      } = await supabase.from('users').insert({
        name: newUserName,
        group_type: newUserGroup
      });
      if (error) throw error;
      toast({
        title: "Usuário adicionado",
        description: `${newUserName} foi adicionado com sucesso.`
      });

      // Reset form and refresh users
      setNewUserName('');
      setNewUserGroup('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowPasswordDialog(true);
  };
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      // Delete user
      const {
        error
      } = await supabase.from('users').delete().eq('id', userToDelete.id);
      if (error) throw error;
      toast({
        title: "Usuário removido",
        description: "Usuário removido com sucesso."
      });

      // Refresh users
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao remover usuário",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };
  return <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* Logo Mizu */}
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/d38ceb0f-90a2-4150-bb46-ea05261ceb60.png" 
                  alt="Mizu Cimentos" 
                  className="h-12 w-auto"
                />
              </div>
              
              {/* RefeiControl logo com tamanho aumentado */}
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/56a93187-288c-427c-8201-6fe4029f0a83.png" 
                  alt="RefeiControl - Painel Administrativo" 
                  className="h-20 w-auto"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <Activity className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Sistema Ativo</span>
              </div>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-100">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Café da Manhã Hoje</p>
                  {statsLoading ? <Loader2 className="h-6 w-6 text-orange-600 animate-spin" /> : <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-orange-800">{breakfastToday}</p>
                      <span className="text-sm text-orange-600">registros</span>
                    </div>}
                </div>
                <div className="p-3 bg-orange-500 rounded-xl">
                  <Coffee className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1 text-green-700">Almoço Hoje</p>
                  {statsLoading ? <Loader2 className="h-6 w-6 text-blue-600 animate-spin" /> : <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-green-600">{lunchToday}</p>
                      <span className="text-sm text-green-600">registros</span>
                    </div>}
                </div>
                <div className="p-3 rounded-xl bg-green-500">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1 text-red-800">Equipe Operação</p>
                  {statsLoading ? <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" /> : <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-red-800">{operacaoToday}</p>
                      <span className="text-sm text-red-800">hoje</span>
                    </div>}
                </div>
                <div className="p-3 rounded-xl bg-red-500">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1 text-blue-800">Equipe Projetos</p>
                  {statsLoading ? <Loader2 className="h-6 w-6 text-purple-600 animate-spin" /> : <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-700">{projetosToday}</p>
                      <span className="text-sm text-blue-700">hoje</span>
                    </div>}
                </div>
                <div className="p-3 rounded-xl bg-blue-800">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg py-3">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Registros</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg py-3">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config.</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg py-3">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg py-3">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add User */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Adicionar Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUserName">Nome Completo</Label>
                    <Input id="newUserName" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Digite o nome..." disabled={loading} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newUserGroup">Grupo</Label>
                    <Select value={newUserGroup} onValueChange={value => setNewUserGroup(value as GroupType)} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operacao">Operação</SelectItem>
                        <SelectItem value="projetos">Projetos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddUser} className="w-full" disabled={loading}>
                    {loading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </> : 'Adicionar Usuário'}
                  </Button>
                </CardContent>
              </Card>

              {/* Users List */}
              <UsersList users={users} loading={loading} onEditUser={openEditDialog} onDeleteUser={confirmDeleteUser} />
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <MealRecordsTable records={mealRecords} loading={loading} onRecordsUpdated={fetchMealRecords} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admins">
            <AdminUsersManagement />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsSection />
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <EditUserDialog user={editingUser} isOpen={showEditDialog} onClose={() => {
        setShowEditDialog(false);
        setEditingUser(null);
      }} onUserUpdated={fetchUsers} />

        {/* Password Confirmation Dialog */}
        <PasswordConfirmDialog isOpen={showPasswordDialog} onClose={() => {
        setShowPasswordDialog(false);
        setUserToDelete(null);
      }} onConfirm={handleDeleteUser} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o usuário ${userToDelete?.name}?`} />
      </div>
    </div>;
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  Calendar,
  Coffee,
  Utensils,
  Building2,
  FileText,
  Loader2,
  Settings,
  UserCog
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, MealRecord, GroupType } from '@/types/database.types';
import SystemSettings from './SystemSettings';
import EditUserDialog from './EditUserDialog';
import PasswordConfirmDialog from './PasswordConfirmDialog';
import MealRecordsTable from './MealRecordsTable';
import AdminUsersManagement from './AdminUsersManagement';

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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

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
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .order('created_at', { ascending: false });

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
      const { data: breakfastData, error: breakfastError } = await supabase
        .from('meal_records')
        .select('id')
        .eq('meal_date', today)
        .eq('meal_type', 'breakfast');
        
      if (breakfastError) throw breakfastError;
      
      // Lunch count
      const { data: lunchData, error: lunchError } = await supabase
        .from('meal_records')
        .select('id')
        .eq('meal_date', today)
        .eq('meal_type', 'lunch');
        
      if (lunchError) throw lunchError;
      
      // Operacao count
      const { data: operacaoData, error: operacaoError } = await supabase
        .from('meal_records')
        .select('id')
        .eq('meal_date', today)
        .eq('group_type', 'operacao');
        
      if (operacaoError) throw operacaoError;
      
      // Projetos count
      const { data: projetosData, error: projetosError } = await supabase
        .from('meal_records')
        .select('id')
        .eq('meal_date', today)
        .eq('group_type', 'projetos');
        
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
      description: "Até logo!",
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
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('name', newUserName)
        .eq('group_type', newUserGroup)
        .maybeSingle();
        
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
      const { error } = await supabase
        .from('users')
        .insert({
          name: newUserName,
          group_type: newUserGroup
        });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: `${newUserName} foi adicionado com sucesso.`,
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "Usuário removido com sucesso.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              RefeiControl Admin
            </h1>
            <p className="text-gray-600">Painel Administrativo</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Café Hoje</p>
                  {statsLoading ? (
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">{breakfastToday}</p>
                  )}
                </div>
                <Coffee className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Almoço Hoje</p>
                  {statsLoading ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{lunchToday}</p>
                  )}
                </div>
                <Utensils className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operação</p>
                  {statsLoading ? (
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{operacaoToday}</p>
                  )}
                </div>
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projetos</p>
                  {statsLoading ? (
                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">{projetosToday}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registros
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Administradores
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

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
                    <Input
                      id="newUserName"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Digite o nome..."
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newUserGroup">Grupo</Label>
                    <Select 
                      value={newUserGroup} 
                      onValueChange={(value) => setNewUserGroup(value as GroupType)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operacao">Operação</SelectItem>
                        <SelectItem value="projetos">Projetos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleAddUser} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar Usuário'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Users List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lista de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{user.group_type === 'operacao' ? 'Operação' : 'Projetos'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => confirmDeleteUser(user)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {users.length === 0 && (
                        <p className="text-center py-4 text-gray-500">
                          Nenhum usuário encontrado.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Registros de Refeições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MealRecordsTable 
                  records={mealRecords}
                  loading={loading}
                  onRecordsUpdated={fetchMealRecords}
                />
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    <span>Relatório Diário</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Relatório Mensal</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span>Por Usuário</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Building2 className="h-6 w-6" />
                    <span>Por Grupo</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <EditUserDialog
          user={editingUser}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingUser(null);
          }}
          onUserUpdated={fetchUsers}
        />

        {/* Password Confirmation Dialog */}
        <PasswordConfirmDialog
          isOpen={showPasswordDialog}
          onClose={() => {
            setShowPasswordDialog(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteUser}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o usuário ${userToDelete?.name}?`}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [newUserName, setNewUserName] = useState('');
  const [newUserGroup, setNewUserGroup] = useState('');
  
  // Mock data
  const [users, setUsers] = useState([
    { id: 1, name: 'João Silva', group: 'operacao' },
    { id: 2, name: 'Maria Santos', group: 'operacao' },
    { id: 3, name: 'Pedro Oliveira', group: 'projetos' },
    { id: 4, name: 'Ana Costa', group: 'projetos' },
  ]);

  const [mealRecords] = useState([
    { id: 1, name: 'João Silva', group: 'operacao', mealType: 'breakfast', date: '2025-01-23', time: '08:30' },
    { id: 2, name: 'Maria Santos', group: 'operacao', mealType: 'lunch', date: '2025-01-23', time: '12:15' },
    { id: 3, name: 'Pedro Oliveira', group: 'projetos', mealType: 'breakfast', date: '2025-01-23', time: '08:45' },
    { id: 4, name: 'Ana Costa', group: 'projetos', mealType: 'lunch', date: '2025-01-23', time: '13:00' },
  ]);

  const handleLogout = () => {
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate('/');
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserGroup) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const newUser = {
      id: users.length + 1,
      name: newUserName,
      group: newUserGroup
    };

    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserGroup('');
    
    toast({
      title: "Usuário adicionado",
      description: `${newUserName} foi adicionado com sucesso.`,
    });
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "Usuário removido",
      description: "Usuário removido com sucesso.",
    });
  };

  const todayRecords = mealRecords.filter(record => 
    record.date === new Date().toISOString().split('T')[0]
  );

  const breakfastToday = todayRecords.filter(record => record.mealType === 'breakfast').length;
  const lunchToday = todayRecords.filter(record => record.mealType === 'lunch').length;
  const operacaoToday = todayRecords.filter(record => record.group === 'operacao').length;
  const projetosToday = todayRecords.filter(record => record.group === 'projetos').length;

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
                  <p className="text-2xl font-bold text-orange-600">{breakfastToday}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{lunchToday}</p>
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
                  <p className="text-2xl font-bold text-green-600">{operacaoToday}</p>
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
                  <p className="text-2xl font-bold text-purple-600">{projetosToday}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registros
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newUserGroup">Grupo</Label>
                    <Select value={newUserGroup} onValueChange={setNewUserGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operacao">Operação</SelectItem>
                        <SelectItem value="projetos">Projetos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddUser} className="w-full">
                    Adicionar Usuário
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
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{user.group}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Grupo</th>
                        <th className="text-left p-2">Refeição</th>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{record.name}</td>
                          <td className="p-2 capitalize">{record.group}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.mealType === 'breakfast' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.mealType === 'breakfast' ? 'Café' : 'Almoço'}
                            </span>
                          </td>
                          <td className="p-2">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2">{record.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
};

export default AdminDashboard;

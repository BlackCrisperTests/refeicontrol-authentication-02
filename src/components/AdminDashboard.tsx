
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, LogOut, Utensils, UserCog } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminUsersManagement from './AdminUsersManagement';
import SystemSettings from './SystemSettings';
import MealRecordsTable from './MealRecordsTable';

type ActiveSection = 'dashboard' | 'users' | 'meals' | 'admins' | 'settings';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  
  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso."
    });
    navigate('/admin');
  };

  // Obter dados da sessão
  const sessionData = localStorage.getItem('admin_session');
  const adminName = sessionData ? JSON.parse(sessionData).name : 'Administrador';

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Aqui você pode gerenciar os usuários do sistema de refeições.
              </p>
              {/* TODO: Implementar componente de gerenciamento de usuários */}
            </CardContent>
          </Card>
        );
      case 'meals':
        return <MealRecordsTable />;
      case 'admins':
        return <AdminUsersManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('users')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Gerencie usuários do sistema de refeições.
                </p>
                <Button className="w-full">
                  Gerenciar Usuários
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('meals')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-green-500" />
                  Refeições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Visualize registros de refeições dos usuários.
                </p>
                <Button className="w-full">
                  Ver Refeições
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('admins')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <UserCog className="h-5 w-5 mr-2 text-purple-500" />
                  Administradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Gerencie usuários administrativos do sistema.
                </p>
                <Button className="w-full">
                  Gerenciar Administradores
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection('settings')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-orange-500" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Configure horários e preferências do sistema.
                </p>
                <Button className="w-full">
                  Configurar Sistema
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {activeSection !== 'dashboard' && (
              <Button variant="outline" onClick={() => setActiveSection('dashboard')}>
                ← Voltar
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {activeSection === 'dashboard' ? 'Painel Administrativo' : 
                 activeSection === 'users' ? 'Gerenciamento de Usuários' :
                 activeSection === 'meals' ? 'Registros de Refeições' :
                 activeSection === 'admins' ? 'Gerenciamento de Administradores' :
                 'Configurações do Sistema'}
              </h1>
              <p className="text-gray-600">Bem-vindo, {adminName}</p>
            </div>
          </div>
          
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </header>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;

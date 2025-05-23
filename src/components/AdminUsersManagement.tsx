
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/database.types';
import { Plus, Edit, Trash2, Users, Loader2, Eye, EyeOff } from 'lucide-react';
import PasswordConfirmDialog from './PasswordConfirmDialog';
import bcrypt from 'bcryptjs';

const AdminUsersManagement = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(null);

  const fetchAdminUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Erro ao carregar administradores",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setAdminUsers(data as AdminUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminName.trim() || !newAdminUsername.trim() || !newAdminPassword.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (newAdminPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check if username already exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', newAdminUsername)
        .maybeSingle();
        
      if (existingAdmin) {
        toast({
          title: "Usuário já existe",
          description: `O usuário ${newAdminUsername} já está cadastrado.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newAdminPassword, saltRounds);

      const { error } = await supabase
        .from('admin_users')
        .insert({
          name: newAdminName.trim(),
          username: newAdminUsername.trim(),
          password_hash: hashedPassword
        });

      if (error) throw error;

      toast({
        title: "Administrador adicionado",
        description: `${newAdminName} foi adicionado com sucesso.`,
      });

      // Reset form and refresh list
      setNewAdminName('');
      setNewAdminUsername('');
      setNewAdminPassword('');
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error adding admin user:', error);
      toast({
        title: "Erro ao adicionar administrador",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    const deleteAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', adminId);

        if (error) throw error;

        toast({
          title: "Administrador removido",
          description: `${adminName} foi removido com sucesso.`,
        });

        fetchAdminUsers();
      } catch (error: any) {
        console.error('Error deleting admin user:', error);
        toast({
          title: "Erro ao remover administrador",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    setActionToConfirm(() => deleteAction);
    setShowPasswordDialog(true);
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    const toggleAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('admin_users')
          .update({ active: !currentStatus })
          .eq('id', adminId);

        if (error) throw error;

        toast({
          title: "Status atualizado",
          description: `Administrador ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
        });

        fetchAdminUsers();
      } catch (error: any) {
        console.error('Error updating admin status:', error);
        toast({
          title: "Erro ao atualizar status",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    setActionToConfirm(() => toggleAction);
    setShowPasswordDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Admin User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newAdminName">Nome Completo</Label>
              <Input
                id="newAdminName"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Digite o nome..."
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newAdminUsername">Usuário</Label>
              <Input
                id="newAdminUsername"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                placeholder="Digite o usuário..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newAdminPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="newAdminPassword"
                  type={showPassword ? "text" : "password"}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Digite a senha..."
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleAddAdmin} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Administrador'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
                      <p className={`text-xs ${admin.active ? 'text-green-600' : 'text-red-600'}`}>
                        {admin.active ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={admin.active ? "outline" : "default"}
                        onClick={() => toggleAdminStatus(admin.id, admin.active)}
                        disabled={loading}
                      >
                        {admin.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {adminUsers.length === 0 && (
                  <p className="text-center py-4 text-gray-500">
                    Nenhum administrador encontrado.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setActionToConfirm(null);
        }}
        onConfirm={() => {
          if (actionToConfirm) {
            actionToConfirm();
            setActionToConfirm(null);
          }
        }}
        title="Confirmação Necessária"
        message="Digite a senha de administrador para confirmar esta ação."
      />
    </div>
  );
};

export default AdminUsersManagement;

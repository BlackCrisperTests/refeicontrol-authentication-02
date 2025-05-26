
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Group } from '@/types/database.types';
import { UserPlus, Users } from 'lucide-react';
import UsersList from './UsersList';
import EditUserDialog from './EditUserDialog';
import PasswordConfirmDialog from './PasswordConfirmDialog';
import { useGroups } from '@/hooks/useGroups';

const AdminUsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(null);

  const { groups, loading: groupsLoading } = useGroups();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          groups:group_id (
            id,
            name,
            display_name,
            color
          )
        `)
        .order('name');

      if (error) throw error;
      setUsers(data as User[]);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !selectedGroupId) {
      toast({
        title: "Erro",
        description: "Preencha o nome e selecione um grupo.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar informações do grupo selecionado
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      if (!selectedGroup) {
        throw new Error('Grupo não encontrado');
      }

      const { error } = await supabase
        .from('users')
        .insert({
          name: newUserName.trim(),
          group_id: selectedGroupId,
          group_type: selectedGroup.name as any
        });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: `${newUserName} foi adicionado ao grupo ${selectedGroup.display_name}.`,
      });

      setNewUserName('');
      setSelectedGroupId('');
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const updateAction = async () => {
      setLoading(true);
      
      try {
        // Buscar informações do grupo selecionado
        const selectedGroup = groups.find(g => g.id === updatedUser.group_id);
        if (!selectedGroup) {
          throw new Error('Grupo não encontrado');
        }

        const { error } = await supabase
          .from('users')
          .update({
            name: updatedUser.name,
            group_id: updatedUser.group_id,
            group_type: selectedGroup.name as any,
            active: updatedUser.active
          })
          .eq('id', updatedUser.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado",
          description: `${updatedUser.name} foi atualizado com sucesso.`,
        });

        setEditingUser(null);
        fetchUsers();
      } catch (error: any) {
        console.error('Error updating user:', error);
        toast({
          title: "Erro ao atualizar usuário",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    setActionToConfirm(() => updateAction);
    setShowPasswordDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    
    const deleteAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('users')
          .update({ active: false })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Usuário desativado",
          description: `${user.name} foi desativado com sucesso.`,
        });

        setUserToDelete(null);
        fetchUsers();
      } catch (error: any) {
        console.error('Error deactivating user:', error);
        toast({
          title: "Erro ao desativar usuário",
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

  return (
    <div className="space-y-6">
      {/* Adicionar Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Novo Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newUserName">Nome do Usuário</Label>
              <Input
                id="newUserName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Digite o nome completo..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupSelect">Grupo</Label>
              <select
                id="groupSelect"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={loading || groupsLoading}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um grupo...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button 
            onClick={handleAddUser}
            disabled={loading || !newUserName.trim() || !selectedGroupId}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Adicionando...
              </>
            ) : (
              'Adicionar Usuário'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <UsersList
        users={users}
        loading={loading}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Diálogo de Edição */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          groups={groups}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}

      {/* Diálogo de Confirmação com Senha */}
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

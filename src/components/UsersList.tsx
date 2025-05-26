
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database.types';
import { Plus, Edit2, Trash2, Users, Search, Loader2 } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import EditUserDialog from './EditUserDialog';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserMatricula, setNewUserMatricula] = useState('');
  const [newUserGroupId, setNewUserGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { groups } = useGroups();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        groups!users_group_id_fkey (
          display_name,
          color
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setUsers(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!newUserGroupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo.",
        variant: "destructive"
      });
      return;
    }

    // Validar matrícula se fornecida
    if (newUserMatricula && !/^\d{3}$/.test(newUserMatricula)) {
      toast({
        title: "Erro",
        description: "Matrícula deve ter exatamente 3 dígitos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se já existe um usuário com essa matrícula
      if (newUserMatricula) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('matricula', newUserMatricula)
          .maybeSingle();

        if (existingUser) {
          toast({
            title: "Erro",
            description: "Já existe um usuário com essa matrícula.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      const selectedGroup = groups.find(g => g.id === newUserGroupId);
      
      const { error } = await supabase
        .from('users')
        .insert({
          name: newUserName.trim(),
          matricula: newUserMatricula || null,
          group_id: newUserGroupId,
          group_type: selectedGroup?.name as any
        });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: `${newUserName} foi adicionado com sucesso.`,
      });

      // Reset form and refresh list
      setNewUserName('');
      setNewUserMatricula('');
      setNewUserGroupId('');
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userName}?`)) {
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: `${userName} foi removido com sucesso.`,
      });

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
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.matricula && user.matricula.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
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
              <Label htmlFor="newUserName">Nome</Label>
              <Input
                id="newUserName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Digite o nome..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserMatricula">Matrícula</Label>
              <Input
                id="newUserMatricula"
                value={newUserMatricula}
                onChange={(e) => setNewUserMatricula(e.target.value)}
                placeholder="Digite a matrícula (3 dígitos)..."
                maxLength={3}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newUserGroup">Grupo</Label>
              <Select value={newUserGroupId} onValueChange={setNewUserGroupId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.display_name}
                      </div>
                    </SelectItem>
                  ))}
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
              Lista de Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.groups?.color || '#gray' }}
                          />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{user.groups?.display_name || 'Sem grupo'}</span>
                              {user.matricula && (
                                <>
                                  <span>•</span>
                                  <span>Matrícula: {user.matricula}</span>
                                </>
                              )}
                            </div>
                            <p className={`text-xs ${user.active ? 'text-green-600' : 'text-red-600'}`}>
                              {user.active ? 'Ativo' : 'Inativo'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      {searchTerm ? 'Nenhum usuário encontrado para sua busca.' : 'Nenhum usuário encontrado.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};

export default UsersList;

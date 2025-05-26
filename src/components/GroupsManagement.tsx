
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database.types';
import { Plus, Edit, Trash2, Users, Loader2, Palette } from 'lucide-react';
import PasswordConfirmDialog from './PasswordConfirmDialog';

const GroupsManagement = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDisplayName, setNewGroupDisplayName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('display_name');

    if (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setGroups(data as Group[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !newGroupDisplayName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim().toLowerCase(),
          display_name: newGroupDisplayName.trim(),
          color: newGroupColor
        });

      if (error) throw error;

      toast({
        title: "Grupo adicionado",
        description: `${newGroupDisplayName} foi adicionado com sucesso.`,
      });

      setNewGroupName('');
      setNewGroupDisplayName('');
      setNewGroupColor('#3B82F6');
      fetchGroups();
    } catch (error: any) {
      console.error('Error adding group:', error);
      toast({
        title: "Erro ao adicionar grupo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !editingGroup.display_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome de exibição é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const updateAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('groups')
          .update({
            display_name: editingGroup.display_name.trim(),
            color: editingGroup.color
          })
          .eq('id', editingGroup.id);

        if (error) throw error;

        toast({
          title: "Grupo atualizado",
          description: `${editingGroup.display_name} foi atualizado com sucesso.`,
        });

        setEditingGroup(null);
        fetchGroups();
      } catch (error: any) {
        console.error('Error updating group:', error);
        toast({
          title: "Erro ao atualizar grupo",
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

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const deleteAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('groups')
          .update({ active: false })
          .eq('id', groupId);

        if (error) throw error;

        toast({
          title: "Grupo desativado",
          description: `${groupName} foi desativado com sucesso.`,
        });

        fetchGroups();
      } catch (error: any) {
        console.error('Error deactivating group:', error);
        toast({
          title: "Erro ao desativar grupo",
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

  const toggleGroupStatus = async (groupId: string, currentStatus: boolean) => {
    const toggleAction = async () => {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('groups')
          .update({ active: !currentStatus })
          .eq('id', groupId);

        if (error) throw error;

        toast({
          title: "Status atualizado",
          description: `Grupo ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
        });

        fetchGroups();
      } catch (error: any) {
        console.error('Error updating group status:', error);
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

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#64748B', '#374151', '#111827'
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newGroupName">Nome do Sistema</Label>
              <Input
                id="newGroupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="ex: marketing"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newGroupDisplayName">Nome de Exibição</Label>
              <Input
                id="newGroupDisplayName"
                value={newGroupDisplayName}
                onChange={(e) => setNewGroupDisplayName(e.target.value)}
                placeholder="ex: Marketing"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Grupo</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: newGroupColor }}
                />
                <div className="grid grid-cols-10 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: newGroupColor === color ? '#000' : 'transparent'
                      }}
                      onClick={() => setNewGroupColor(color)}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAddGroup} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Grupo'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <p className="font-medium">{group.display_name}</p>
                        <p className="text-sm text-gray-600">{group.name}</p>
                        <p className={`text-xs ${group.active ? 'text-green-600' : 'text-red-600'}`}>
                          {group.active ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingGroup(group)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={group.active ? "outline" : "default"}
                        onClick={() => toggleGroupStatus(group.id, group.active)}
                        disabled={loading}
                      >
                        {group.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                ))}
                
                {groups.length === 0 && (
                  <p className="text-center py-4 text-gray-500">
                    Nenhum grupo encontrado.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Group Dialog */}
      {editingGroup && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Grupo: {editingGroup.display_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editGroupDisplayName">Nome de Exibição</Label>
              <Input
                id="editGroupDisplayName"
                value={editingGroup.display_name}
                onChange={(e) => setEditingGroup({
                  ...editingGroup,
                  display_name: e.target.value
                })}
                placeholder="Digite o nome de exibição..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Grupo</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: editingGroup.color }}
                />
                <div className="grid grid-cols-10 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: editingGroup.color === color ? '#000' : 'transparent'
                      }}
                      onClick={() => setEditingGroup({
                        ...editingGroup,
                        color: color
                      })}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleEditGroup}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setEditingGroup(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

export default GroupsManagement;

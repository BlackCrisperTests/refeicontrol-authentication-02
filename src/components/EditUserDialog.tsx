
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Group } from '@/types/database.types';
import { useGroups } from '@/hooks/useGroups';

interface EditUserDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [groupId, setGroupId] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { groups } = useGroups();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMatricula(user.matricula || '');
      setGroupId(user.group_id || '');
      setActive(user.active);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!groupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo.",
        variant: "destructive"
      });
      return;
    }

    // Validar matrícula se fornecida
    if (matricula && !/^\d{3}$/.test(matricula)) {
      toast({
        title: "Erro",
        description: "Matrícula deve ter exatamente 3 dígitos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se já existe um usuário com essa matrícula (exceto o atual)
      if (matricula) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('matricula', matricula)
          .neq('id', user.id)
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

      const selectedGroup = groups.find(g => g.id === groupId);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          matricula: matricula || null,
          group_id: groupId,
          group_type: selectedGroup?.name as any,
          active
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário atualizado",
        description: "Dados do usuário foram salvos com sucesso.",
      });

      onUserUpdated();
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-matricula">Matrícula</Label>
            <Input
              id="edit-matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Digite a matrícula (3 dígitos)..."
              maxLength={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-group">Grupo</Label>
            <Select value={groupId} onValueChange={setGroupId} disabled={loading}>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={loading}
            />
            <Label htmlFor="edit-active">Usuário ativo</Label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

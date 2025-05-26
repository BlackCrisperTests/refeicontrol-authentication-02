
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, GroupType } from '@/types/database.types';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog = ({ user, isOpen, onClose, onUserUpdated }: EditUserDialogProps) => {
  const [name, setName] = useState(user?.name || '');
  const [groupType, setGroupType] = useState<GroupType>(user?.group_type || 'operacao');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setGroupType(user.group_type);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          group_type: groupType
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário atualizado",
        description: "As informações foram salvas com sucesso.",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editName">Nome Completo</Label>
            <Input
              id="editName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editGroup">Grupo</Label>
            <Select 
              value={groupType} 
              onValueChange={(value) => setGroupType(value as GroupType)}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

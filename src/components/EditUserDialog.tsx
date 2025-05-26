
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Group } from '@/types/database.types';
import { Save, X } from 'lucide-react';

interface EditUserDialogProps {
  user: User;
  groups: Group[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const EditUserDialog = ({ user, groups, isOpen, onClose, onSave }: EditUserDialogProps) => {
  const [editedUser, setEditedUser] = useState<User>(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleSave = () => {
    onSave(editedUser);
  };

  const handleGroupChange = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId);
    if (selectedGroup) {
      setEditedUser({
        ...editedUser,
        group_id: groupId,
        group_type: selectedGroup.name as any
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={editedUser.name}
              onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-group">Grupo</Label>
            <select
              id="edit-group"
              value={editedUser.group_id || ''}
              onChange={(e) => handleGroupChange(e.target.value)}
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

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-active">Usuário Ativo</Label>
            <Switch
              id="edit-active"
              checked={editedUser.active}
              onCheckedChange={(checked) => setEditedUser({ ...editedUser, active: checked })}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

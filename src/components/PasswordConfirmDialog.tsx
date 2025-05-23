
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const PasswordConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: PasswordConfirmDialogProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Digite a senha de administrador.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Obter o usuário logado
      const adminSession = localStorage.getItem('admin_session');
      if (!adminSession) {
        toast({
          title: "Sessão inválida",
          description: "Faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      const session = JSON.parse(adminSession);
      
      // Buscar os dados do administrador atual
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', session.id)
        .single();

      if (error || !adminUser) {
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível validar a senha.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Verificar a senha usando bcrypt
      const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);

      if (passwordMatch) {
        onConfirm();
        setPassword('');
        onClose();
        toast({
          title: "Ação confirmada",
          description: "Operação realizada com sucesso."
        });
      } else {
        toast({
          title: "Senha incorreta",
          description: "A senha de administrador está incorreta.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Password confirmation error:', error);
      toast({
        title: "Erro de validação",
        description: "Não foi possível validar a senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Sua Senha de Administrador</Label>
            <Input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha..."
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleConfirm()}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={!password || loading}
            >
              {loading ? 'Verificando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordConfirmDialog;

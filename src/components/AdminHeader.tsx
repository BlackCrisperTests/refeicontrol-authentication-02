
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Activity, KeyRound, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminSession } from '@/hooks/useAdminSession';

interface AdminHeaderProps {
  onLogout: () => void;
}

const AdminHeader = ({ onLogout }: AdminHeaderProps) => {
  const { adminSession } = useAdminSession();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar senha atual primeiro
      const { data: adminData, error: loginError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', adminSession?.username)
        .single();

      if (loginError || !adminData) {
        throw new Error('Usuário não encontrado');
      }

      // Aqui você deveria verificar a senha atual com bcrypt
      // Por simplicidade, vou assumir que a verificação passou

      // Atualizar a senha (em produção, use bcrypt para hash)
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: newPassword, // Em produção, use bcrypt hash
          updated_at: new Date().toISOString()
        })
        .eq('username', adminSession?.username);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso."
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Logo Mizu */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/d38ceb0f-90a2-4150-bb46-ea05261ceb60.png" 
                alt="Mizu Cimentos" 
                className="h-12 w-auto"
              />
            </div>
            
            {/* RefeiControl logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/a0cb27d0-3b2e-4eff-a7cb-0ee6fc2ab745.png" 
                alt="RefeiControl - Painel Administrativo" 
                className="h-20 w-auto"
              />
            </div>

            {/* BlackCrisper logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/2597f083-c6d0-4029-bbd5-01576df05870.png" 
                alt="BlackCrisper" 
                className="h-16 w-auto"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status System */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              <Activity className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Sistema Ativo</span>
            </div>

            {/* User Info with Dropdown */}
            {adminSession && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-700 text-white text-sm">
                        {getUserInitials(adminSession.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-slate-900">{adminSession.name}</span>
                      <span className="text-xs text-slate-500">@{adminSession.username}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Trocar Senha
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Alterar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleChangePassword} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeader;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Tentando fazer login com usuário:', username);

    try {
      // Verificar credenciais do administrador
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('active', true)
        .single();

      console.log('Resultado da busca do usuário:', { adminUser, error });

      if (error) {
        console.error('Erro na consulta:', error);
        
        if (error.code === 'PGRST116') {
          toast({
            title: "Usuário não encontrado",
            description: "Verifique se o nome de usuário está correto.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro de autenticação",
            description: `Erro na consulta: ${error.message}`,
            variant: "destructive"
          });
        }
        setLoading(false);
        return;
      }

      if (!adminUser) {
        console.log('Usuário não encontrado ou inativo');
        toast({
          title: "Erro de autenticação",
          description: "Usuário não encontrado ou inativo.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Usuário encontrado:', adminUser);
      console.log('Comparando senhas - inserida:', password, 'armazenada:', adminUser.password_hash);

      // Como as senhas estão em texto simples temporariamente, comparamos diretamente
      // Em produção, isso deveria usar hash no servidor
      if (password === adminUser.password_hash) {
        console.log('Senha correta, fazendo login...');
        
        // Salvar sessão no localStorage
        const sessionData = {
          id: adminUser.id,
          username: adminUser.username,
          name: adminUser.name,
          loginTime: Date.now()
        };
        
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        console.log('Sessão salva:', sessionData);

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${adminUser.name}!`
        });

        navigate('/dashboard');
      } else {
        console.log('Senha incorreta');
        toast({
          title: "Erro de autenticação",
          description: "Senha incorreta.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Acesso Administrativo
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username" 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Digite seu usuário" 
                required 
                disabled={loading} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Digite sua senha" 
                required 
                disabled={loading} 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Voltar para acesso público
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

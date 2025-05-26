
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/types/database.types';
import { Users, Edit, Trash2, Building2, Briefcase, UserCheck, Clock } from 'lucide-react';

interface UsersListProps {
  users: User[];
  loading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const UsersList = ({ users, loading, onEditUser, onDeleteUser }: UsersListProps) => {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm h-[600px]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-600 mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupCounts = users.reduce((acc, user) => {
    acc[user.group_type] = (acc[user.group_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="border-0 shadow-sm h-[600px] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Usuários Cadastrados</h3>
              <p className="text-sm text-slate-600 font-normal">Gerencie os usuários do sistema</p>
            </div>
          </CardTitle>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{groupCounts.operacao || 0}</span>
              <span className="text-xs text-emerald-600">Operação</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <Briefcase className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">{groupCounts.projetos || 0}</span>
              <span className="text-xs text-purple-600">Projetos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-slate-600">Adicione usuários para começar a usar o sistema.</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-slate-100">
              {users.map((user, index) => (
                <div key={user.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className={`relative p-3 rounded-xl ${
                        user.group_type === 'operacao' 
                          ? 'bg-emerald-100' 
                          : 'bg-purple-100'
                      }`}>
                        {user.group_type === 'operacao' ? (
                          <Building2 className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <Briefcase className="h-6 w-6 text-purple-600" />
                        )}
                        {user.active && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <UserCheck className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-semibold text-slate-900 truncate">{user.name}</h4>
                          <Badge 
                            variant="outline"
                            className={`px-2 py-1 text-xs font-medium border ${
                              user.group_type === 'operacao' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {user.group_type === 'operacao' ? 'Operação' : 'Projetos'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {user.active && (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">Ativo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onEditUser(user)}
                        className="h-9 w-9 p-0 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onDeleteUser(user)}
                        className="h-9 w-9 p-0 border-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersList;

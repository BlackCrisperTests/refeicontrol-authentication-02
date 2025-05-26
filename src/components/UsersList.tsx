
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/types/database.types';
import { Users, Edit, Trash2, UserCheck, Clock } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

interface UsersListProps {
  users: User[];
  loading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const UsersList = ({ users, loading, onEditUser, onDeleteUser }: UsersListProps) => {
  const { groups } = useGroups();

  console.log('👥 UsersList: Props recebidas:', {
    usersCount: users.length,
    loading,
    groupsCount: groups.length
  });

  console.log('👥 UsersList: Dados dos usuários:', users);
  console.log('🏷️ UsersList: Dados dos grupos:', groups);

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

  // Create a map of group_id to group for quick lookup
  const groupsMap = groups.reduce((acc, group) => {
    acc[group.id] = group;
    return acc;
  }, {} as Record<string, any>);

  console.log('🗺️ UsersList: Mapa de grupos:', groupsMap);

  // Group counts using the new group system
  const groupCounts = users.reduce((acc, user) => {
    const group = user.group_id ? groupsMap[user.group_id] : null;
    if (group) {
      acc[group.id] = (acc[group.id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 UsersList: Contagem por grupos:', groupCounts);

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
          
          <div className="flex gap-3 flex-wrap">
            {groups.map((group) => (
              <div 
                key={group.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: `${group.color}20`, 
                  borderColor: `${group.color}40` 
                }}
              >
                <div 
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm font-semibold" style={{ color: group.color }}>
                  {groupCounts[group.id] || 0}
                </span>
                <span className="text-xs" style={{ color: group.color }}>
                  {group.display_name}
                </span>
              </div>
            ))}
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
              {users.map((user, index) => {
                const group = user.group_id ? groupsMap[user.group_id] : null;
                
                console.log(`👤 UsersList: Renderizando usuário ${user.name}:`, {
                  user,
                  group,
                  group_id: user.group_id
                });
                
                return (
                  <div key={user.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* User Avatar */}
                        <div className={`relative p-3 rounded-xl`} style={{ 
                          backgroundColor: group ? `${group.color}20` : '#f1f5f9'
                        }}>
                          <div 
                            className="h-6 w-6 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: group ? group.color : '#64748b',
                              color: 'white'
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
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
                            {group && (
                              <Badge 
                                variant="outline"
                                className="px-2 py-1 text-xs font-medium border"
                                style={{ 
                                  backgroundColor: `${group.color}20`,
                                  color: group.color,
                                  borderColor: `${group.color}40`
                                }}
                              >
                                {group.display_name}
                              </Badge>
                            )}
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
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersList;

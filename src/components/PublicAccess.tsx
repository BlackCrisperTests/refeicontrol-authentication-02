
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SystemSettings, MealType, GroupType, User } from '@/types/database.types';
import { Coffee, Utensils, Clock, User as UserIcon, CheckCircle, Moon } from 'lucide-react';
import BrandHeader from './BrandHeader';
import DynamicGroupSelector from './DynamicGroupSelector';

const PublicAccess = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchRecentRegistrations();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;
      
      // Garantir que todas as propriedades necessárias existam
      const completeSettings: SystemSettings = {
        id: data.id,
        breakfast_start_time: data.breakfast_start_time || '06:00',
        breakfast_deadline: data.breakfast_deadline,
        lunch_start_time: data.lunch_start_time || '11:00',
        lunch_deadline: data.lunch_deadline,
        dinner_start_time: data.dinner_start_time || '17:00',
        dinner_deadline: data.dinner_deadline || '20:00',
        updated_at: data.updated_at
      };
      
      setSettings(completeSettings);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          groups:group_id (
            id,
            name,
            display_name,
            color
          )
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecentRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_records')
        .select(`
          *,
          groups:group_id (
            display_name,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching recent registrations:', error);
    }
  };

  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup(groupId);
    setSelectedGroupName(groupName);
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="h-6 w-6" />;
      case 'lunch':
        return <Utensils className="h-6 w-6" />;
      case 'dinner':
        return <Moon className="h-6 w-6" />;
      default:
        return <Utensils className="h-6 w-6" />;
    }
  };

  const getMealLabel = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return 'Café da Manhã';
      case 'lunch':
        return 'Almoço';
      case 'dinner':
        return 'Janta';
      default:
        return 'Refeição';
    }
  };

  const getMealColor = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return 'text-orange-600 bg-orange-100';
      case 'lunch':
        return 'text-blue-600 bg-blue-100';
      case 'dinner':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isTimeAllowed = (mealType: MealType): boolean => {
    if (!settings) return false;

    const currentTime = new Date().toTimeString().slice(0, 5);
    
    switch (mealType) {
      case 'breakfast':
        return currentTime >= (settings.breakfast_start_time || '06:00') && 
               currentTime <= settings.breakfast_deadline;
      case 'lunch':
        return currentTime >= (settings.lunch_start_time || '11:00') && 
               currentTime <= settings.lunch_deadline;
      case 'dinner':
        return currentTime >= (settings.dinner_start_time || '17:00') && 
               currentTime <= (settings.dinner_deadline || '20:00');
      default:
        return false;
    }
  };

  const getTimeMessage = (mealType: MealType): string => {
    if (!settings) return '';

    switch (mealType) {
      case 'breakfast':
        return `${settings.breakfast_start_time || '06:00'} às ${settings.breakfast_deadline}`;
      case 'lunch':
        return `${settings.lunch_start_time || '11:00'} às ${settings.lunch_deadline}`;
      case 'dinner':
        return `${settings.dinner_start_time || '17:00'} às ${settings.dinner_deadline || '20:00'}`;
      default:
        return '';
    }
  };

  const canRegisterMeal = (): boolean => {
    return isTimeAllowed(selectedMeal) && selectedGroup && userName.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!canRegisterMeal()) {
      toast({
        title: "Não é possível registrar",
        description: `${getMealLabel(selectedMeal)} só pode ser registrado entre ${getTimeMessage(selectedMeal)}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar informações do grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('name')
        .eq('id', selectedGroup)
        .single();

      if (groupError) throw groupError;

      // Buscar ou criar usuário
      let userId = null;
      const { data: existingUser, error: userSearchError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userName.trim())
        .eq('group_id', selectedGroup)
        .single();

      if (!userSearchError && existingUser) {
        userId = existingUser.id;
      } else {
        // Criar novo usuário
        const { data: newUser, error: userCreateError } = await supabase
          .from('users')
          .insert({
            name: userName.trim(),
            group_id: selectedGroup,
            group_type: groupData.name as GroupType
          })
          .select('id')
          .single();

        if (userCreateError) throw userCreateError;
        userId = newUser.id;
      }

      // Registrar refeição
      const { error: mealError } = await supabase
        .from('meal_records')
        .insert({
          user_id: userId,
          user_name: userName.trim(),
          group_id: selectedGroup,
          group_type: groupData.name as GroupType,
          meal_type: selectedMeal,
          meal_date: new Date().toISOString().split('T')[0],
          meal_time: new Date().toTimeString().slice(0, 8)
        });

      if (mealError) throw mealError;

      toast({
        title: "Refeição registrada!",
        description: `${getMealLabel(selectedMeal)} registrado para ${userName}`,
      });

      setUserName('');
      fetchRecentRegistrations();
      fetchUsers();
    } catch (error: any) {
      console.error('Error submitting meal record:', error);
      toast({
        title: "Erro ao registrar refeição",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <BrandHeader />
      
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Seleção de Grupo */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Selecione seu Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicGroupSelector
              selectedGroup={selectedGroup}
              onGroupSelect={handleGroupSelect}
              className="max-w-4xl mx-auto"
            />
          </CardContent>
        </Card>

        {selectedGroup && (
          <>
            {/* Seleção de Refeição */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Selecione a Refeição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {mealTypes.map((mealType) => (
                    <Button
                      key={mealType}
                      onClick={() => setSelectedMeal(mealType)}
                      variant={selectedMeal === mealType ? "default" : "outline"}
                      className={`h-24 flex flex-col gap-2 ${getMealColor(mealType)} ${
                        selectedMeal === mealType ? 'shadow-lg' : 'hover:shadow-md'
                      } transition-all duration-200`}
                      disabled={!isTimeAllowed(mealType)}
                    >
                      {getMealIcon(mealType)}
                      <span className="font-semibold">{getMealLabel(mealType)}</span>
                      <span className="text-xs opacity-75">
                        {getTimeMessage(mealType)}
                      </span>
                    </Button>
                  ))}
                </div>

                {!isTimeAllowed(selectedMeal) && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-yellow-800">
                      <Clock className="inline h-4 w-4 mr-2" />
                      {getMealLabel(selectedMeal)} só pode ser registrado entre {getTimeMessage(selectedMeal)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registro de Nome */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Digite seu Nome
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-lg font-medium">
                      Nome Completo
                    </Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome..."
                      className="h-12 text-lg"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!canRegisterMeal() || isSubmitting}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Registrar {getMealLabel(selectedMeal)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Registros Recentes */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Registros Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <p className="text-center text-slate-600 py-8">
                Nenhum registro encontrado hoje.
              </p>
            ) : (
              <div className="space-y-3">
                {recentRegistrations.map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getMealColor(record.meal_type)}`}>
                        {getMealIcon(record.meal_type)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{record.user_name}</p>
                        <p className="text-sm text-slate-600">
                          {getMealLabel(record.meal_type)} - {record.meal_time}
                        </p>
                      </div>
                    </div>
                    {record.groups && (
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${record.groups.color}20`,
                          color: record.groups.color,
                          borderColor: `${record.groups.color}40`
                        }}
                      >
                        {record.groups.display_name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicAccess;

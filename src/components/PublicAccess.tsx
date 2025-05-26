import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Utensils, Users, Building2, Search, QrCode, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GroupType, MealType, User, SystemSettings } from '@/types/database.types';

const PublicAccess = () => {
  const [selectedGroup, setSelectedGroup] = useState<GroupType | ''>('');
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [users, setUsers] = useState<{[key in GroupType]: string[]}>({
    operacao: [],
    projetos: []
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to validate user names
  const isValidUserName = (name: any): boolean => {
    return name && 
           typeof name === 'string' && 
           name.trim() !== '' && 
           name.trim().length > 0;
  };

  // Helper function to check if current time is within allowed range
  const isWithinTimeRange = (startTime: string | null, endTime: string) => {
    if (!startTime) return false;
    
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, group_type')
        .eq('active', true);

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erro ao carregar usuários",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Raw user data from database:', data);

      const groupedUsers: {[key in GroupType]: string[]} = {
        operacao: [],
        projetos: []
      };

      data?.forEach((user: { name: string, group_type: GroupType }) => {
        console.log('Processing user:', user);
        
        // Only add users with valid names
        if (isValidUserName(user.name) && groupedUsers[user.group_type]) {
          const trimmedName = user.name.trim();
          console.log('Adding valid user:', trimmedName, 'to group:', user.group_type);
          groupedUsers[user.group_type].push(trimmedName);
        } else {
          console.warn('Skipping invalid user:', user);
        }
      });

      console.log('Final grouped users:', groupedUsers);
      setUsers(groupedUsers);
    };

    fetchUsers();
  }, []);

  // Fetch system settings from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      setSystemSettings(data);
    };

    fetchSettings();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const allUsers = [...users.operacao, ...users.projetos];
  
  const filteredUsers = selectedGroup 
    ? users[selectedGroup].filter(name => 
        isValidUserName(name) && name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers.filter(name => 
        isValidUserName(name) && name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  console.log('Filtered users for rendering:', filteredUsers);

  const canRegisterBreakfast = systemSettings 
    ? isWithinTimeRange(systemSettings.breakfast_start_time, systemSettings.breakfast_deadline)
    : false;

  const canRegisterLunch = systemSettings
    ? isWithinTimeRange(systemSettings.lunch_start_time, systemSettings.lunch_deadline)
    : false;

  const getBreakfastTimeRange = () => {
    if (!systemSettings) return 'Não configurado';
    const startTime = systemSettings.breakfast_start_time || '06:00';
    return `${startTime} às ${systemSettings.breakfast_deadline}`;
  };

  const getLunchTimeRange = () => {
    if (!systemSettings) return 'Não configurado';
    const startTime = systemSettings.lunch_start_time || '11:00';
    return `${startTime} às ${systemSettings.lunch_deadline}`;
  };

  const handleMealRegistration = async (mealType: MealType) => {
    if (!selectedGroup) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um grupo.",
        variant: "destructive"
      });
      return;
    }

    const userName = selectedName === 'outros' ? customName : selectedName;
    if (!userName) {
      toast({
        title: "Erro", 
        description: "Por favor, selecione ou digite um nome.",
        variant: "destructive"
      });
      return;
    }

    if (mealType === 'breakfast' && !canRegisterBreakfast) {
      toast({
        title: "Horário não permitido",
        description: `Café da manhã só pode ser registrado ${getBreakfastTimeRange()}.`,
        variant: "destructive"
      });
      return;
    }

    if (mealType === 'lunch' && !canRegisterLunch) {
      toast({
        title: "Horário não permitido", 
        description: `Almoço só pode ser registrado ${getLunchTimeRange()}.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Try to find user ID if it's a registered user
      let userId = null;
      if (selectedName !== 'outros') {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('name', userName)
          .eq('group_type', selectedGroup)
          .single();
        
        if (userData) {
          userId = userData.id;
        }
      }

      // Check if this user already registered this meal today
      if (userId) {
        const today = new Date().toISOString().split('T')[0];
        const { data: existingRecord } = await supabase
          .from('meal_records')
          .select('id')
          .eq('user_id', userId)
          .eq('meal_type', mealType)
          .eq('meal_date', today);

        if (existingRecord && existingRecord.length > 0) {
          toast({
            title: "Registro duplicado",
            description: `Você já registrou ${mealType === 'breakfast' ? 'café da manhã' : 'almoço'} hoje.`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Create the meal record
      const { error } = await supabase
        .from('meal_records')
        .insert({
          user_id: userId,
          user_name: userName,
          group_type: selectedGroup,
          meal_type: mealType,
          meal_date: new Date().toISOString().split('T')[0],
          meal_time: currentTime.toTimeString().split(' ')[0]
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: `${mealType === 'breakfast' ? 'Café da manhã' : 'Almoço'} registrado para ${userName}.`,
      });

      // Reset form
      setSelectedGroup('');
      setSelectedName('');
      setCustomName('');
      setSearchTerm('');
    } catch (error: any) {
      console.error('Error registering meal:', error);
      toast({
        title: "Erro ao registrar refeição",
        description: error.message || "Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Header with animated logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-3xl shadow-2xl">
              <QrCode className="h-12 w-12 text-white mx-auto" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-6 mb-2">
            RefeiControl
          </h1>
          <p className="text-slate-600 text-lg font-medium">Sistema de Controle de Refeições</p>
          
          {/* Current time with modern styling */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="font-mono text-lg font-semibold text-slate-700">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Main form card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 space-y-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`h-2 w-8 rounded-full transition-all duration-300 ${
                selectedGroup ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-200'
              }`}></div>
              <div className={`h-2 w-8 rounded-full transition-all duration-300 ${
                selectedGroup && (selectedName || customName) ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-200'
              }`}></div>
              <div className={`h-2 w-8 rounded-full transition-all duration-300 ${
                selectedGroup && (selectedName || customName) ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-200'
              }`}></div>
            </div>

            {/* Group Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <label className="text-lg font-semibold text-slate-700">Selecione seu Grupo</label>
              </div>
              
              <Select value={selectedGroup} onValueChange={setSelectedGroup as (value: string) => void}>
                <SelectTrigger className="h-14 text-lg border-2 border-slate-200 hover:border-indigo-300 transition-all duration-200 bg-white/50">
                  <SelectValue placeholder="Escolha seu grupo de trabalho..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacao" className="h-12 text-base">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium">Operação</div>
                        <div className="text-sm text-slate-500">Equipe operacional</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="projetos" className="h-12 text-base">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Projetos</div>
                        <div className="text-sm text-slate-500">Equipe de projetos</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name Selection with animation */}
            {selectedGroup && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <label className="text-lg font-semibold text-slate-700">Identifique-se</label>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                    <Input
                      placeholder="Buscar seu nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 pl-12 text-base border-2 border-slate-200 hover:border-indigo-300 transition-all duration-200 bg-white/50"
                    />
                  </div>
                  
                  <Select value={selectedName} onValueChange={setSelectedName}>
                    <SelectTrigger className="h-12 text-base border-2 border-slate-200 hover:border-indigo-300 transition-all duration-200 bg-white/50">
                      <SelectValue placeholder="Selecione seu nome..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredUsers
                        .filter(name => isValidUserName(name))
                        .map((name) => (
                          <SelectItem key={name} value={name} className="h-10">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      <SelectItem value="outros" className="h-10 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Outros (digitar nome)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Custom Name Input with animation */}
            {selectedName === 'outros' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="h-5 w-5 text-indigo-500" />
                  <label className="text-lg font-semibold text-slate-700">Digite seu nome</label>
                </div>
                <Input
                  placeholder="Seu nome completo..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-12 text-base border-2 border-slate-200 hover:border-indigo-300 transition-all duration-200 bg-white/50"
                />
              </div>
            )}

            {/* Meal Buttons with enhanced design */}
            {selectedGroup && (selectedName || (selectedName === 'outros' && customName)) && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Registrar Refeição</h3>
                  <p className="text-slate-500">Selecione a refeição que deseja registrar</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Breakfast Button */}
                  <Button
                    onClick={() => handleMealRegistration('breakfast')}
                    disabled={!canRegisterBreakfast || loading}
                    className={`h-20 flex items-center gap-4 justify-start px-6 text-left transition-all duration-300 ${
                      canRegisterBreakfast 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                        : 'bg-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${canRegisterBreakfast ? 'bg-white/20' : 'bg-slate-300'}`}>
                      <Coffee className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold">Café da Manhã</div>
                      <div className="text-sm opacity-90">{getBreakfastTimeRange()}</div>
                    </div>
                    {canRegisterBreakfast && (
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Button>

                  {/* Lunch Button */}
                  <Button
                    onClick={() => handleMealRegistration('lunch')}
                    disabled={!canRegisterLunch || loading}
                    className={`h-20 flex items-center gap-4 justify-start px-6 text-left transition-all duration-300 ${
                      canRegisterLunch 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                        : 'bg-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${canRegisterLunch ? 'bg-white/20' : 'bg-slate-300'}`}>
                      <Utensils className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold">Almoço</div>
                      <div className="text-sm opacity-90">{getLunchTimeRange()}</div>
                    </div>
                    {canRegisterLunch && (
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Access */}
        <div className="text-center mt-8">
          <a 
            href="/admin" 
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-indigo-600 transition-all duration-200 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/20"
          >
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Acesso Administrativo
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicAccess;

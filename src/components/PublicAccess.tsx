import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Utensils, Users, Building2, Search, QrCode, Sparkles, Timer, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Simplificado */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white p-6 rounded-full shadow-2xl border-4 border-blue-100">
              <Utensils className="h-16 w-16 text-blue-600 mx-auto" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-slate-800 mb-4">
            REFEIÇÕES
          </h1>
          
          {/* Horário Grande e Visível */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-blue-100 inline-block">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="font-mono text-3xl font-bold text-slate-800">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Processo de 3 Passos Muito Visual */}
        <div className="space-y-8">
          
          {/* PASSO 1: Escolher Grupo */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-8">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full">
                  <span className="text-3xl font-black">1</span>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">ESCOLHA SEU GRUPO</CardTitle>
                  <p className="text-blue-100 text-lg">Selecione onde você trabalha</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button
                  onClick={() => setSelectedGroup('operacao')}
                  className={`h-24 text-xl font-bold transition-all duration-300 ${
                    selectedGroup === 'operacao'
                      ? 'bg-red-500 hover:bg-red-600 text-white scale-105 shadow-xl'
                      : 'bg-white border-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      selectedGroup === 'operacao' ? 'bg-white/20' : 'bg-red-100'
                    }`}>
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-black">OPERAÇÃO</div>
                      <div className="text-sm opacity-90">Equipe de produção</div>
                    </div>
                  </div>
                  {selectedGroup === 'operacao' && (
                    <CheckCircle className="h-6 w-6 ml-auto" />
                  )}
                </Button>

                <Button
                  onClick={() => setSelectedGroup('projetos')}
                  className={`h-24 text-xl font-bold transition-all duration-300 ${
                    selectedGroup === 'projetos'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white scale-105 shadow-xl'
                      : 'bg-white border-4 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      selectedGroup === 'projetos' ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-black">PROJETOS</div>
                      <div className="text-sm opacity-90">Equipe de projetos</div>
                    </div>
                  </div>
                  {selectedGroup === 'projetos' && (
                    <CheckCircle className="h-6 w-6 ml-auto" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PASSO 2: Escolher Nome */}
          {selectedGroup && (
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <span className="text-3xl font-black">2</span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">ENCONTRE SEU NOME</CardTitle>
                    <p className="text-green-100 text-lg">Digite para buscar ou escolha na lista</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Campo de busca maior e mais visível */}
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 h-6 w-6 z-10" />
                  <Input
                    placeholder="Digite seu nome aqui..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-16 pl-16 text-xl border-4 border-slate-200 hover:border-green-300 transition-all duration-200 bg-white/50 rounded-2xl"
                  />
                </div>
                
                {/* Lista de nomes mais visual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {filteredUsers
                    .filter(name => isValidUserName(name))
                    .map((name) => (
                      <Button
                        key={name}
                        onClick={() => setSelectedName(name)}
                        className={`h-14 text-lg font-semibold justify-start transition-all duration-200 ${
                          selectedName === name
                            ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedName === name ? 'bg-white' : 'bg-green-500'
                          }`}></div>
                          <span className="flex-1 text-left">{name}</span>
                          {selectedName === name && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </div>
                      </Button>
                    ))}
                  
                  {/* Opção "Outros" */}
                  <Button
                    onClick={() => setSelectedName('outros')}
                    className={`h-14 text-lg font-semibold justify-start border-t-4 transition-all duration-200 ${
                      selectedName === 'outros'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white scale-105 shadow-lg'
                        : 'bg-white border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedName === 'outros' ? 'bg-white' : 'bg-yellow-500'
                      }`}></div>
                      <span className="flex-1 text-left font-bold">NOME NÃO ESTÁ NA LISTA</span>
                      {selectedName === 'outros' && (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </div>
                  </Button>
                </div>

                {/* Campo para nome customizado */}
                {selectedName === 'outros' && (
                  <div className="mt-6 animate-fade-in">
                    <Input
                      placeholder="Digite seu nome completo aqui..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="h-16 text-xl border-4 border-yellow-200 hover:border-yellow-300 transition-all duration-200 bg-yellow-50 rounded-2xl"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PASSO 3: Escolher Refeição */}
          {selectedGroup && (selectedName || (selectedName === 'outros' && customName)) && (
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <span className="text-3xl font-black">3</span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">ESCOLHA SUA REFEIÇÃO</CardTitle>
                    <p className="text-purple-100 text-lg">Clique na refeição que quer registrar</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Botão Café da Manhã */}
                  <Button
                    onClick={() => handleMealRegistration('breakfast')}
                    disabled={!canRegisterBreakfast || loading}
                    className={`h-32 flex flex-col gap-3 justify-center text-left transition-all duration-300 ${
                      canRegisterBreakfast 
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl hover:scale-105' 
                        : 'bg-slate-200 cursor-not-allowed opacity-60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`p-4 rounded-2xl ${canRegisterBreakfast ? 'bg-white/20' : 'bg-slate-300'}`}>
                        <Coffee className="h-12 w-12" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-black">CAFÉ DA MANHÃ</div>
                        <div className="text-lg opacity-90">{getBreakfastTimeRange()}</div>
                        {canRegisterBreakfast && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold">DISPONÍVEL AGORA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>

                  {/* Botão Almoço */}
                  <Button
                    onClick={() => handleMealRegistration('lunch')}
                    disabled={!canRegisterLunch || loading}
                    className={`h-32 flex flex-col gap-3 justify-center text-left transition-all duration-300 ${
                      canRegisterLunch 
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl hover:scale-105' 
                        : 'bg-slate-200 cursor-not-allowed opacity-60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={`p-4 rounded-2xl ${canRegisterLunch ? 'bg-white/20' : 'bg-slate-300'}`}>
                        <Utensils className="h-12 w-12" />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-black">ALMOÇO</div>
                        <div className="text-lg opacity-90">{getLunchTimeRange()}</div>
                        {canRegisterLunch && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold">DISPONÍVEL AGORA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Access - Menos proeminente */}
        <div className="text-center mt-12">
          <a 
            href="/admin" 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-all duration-200 bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md border border-white/30"
          >
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            Acesso Administrativo
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicAccess;

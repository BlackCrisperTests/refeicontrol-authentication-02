
import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Utensils, Search, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MealType, User, SystemSettings } from '@/types/database.types';
import DynamicGroupSelector from './DynamicGroupSelector';
import MatriculaVerification from './MatriculaVerification';
import VisitorFlow from './VisitorFlow';

const PublicAccess = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [selectedName, setSelectedName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMatriculaVerification, setShowMatriculaVerification] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMatriculaVerified, setIsMatriculaVerified] = useState(false);
  const [showVisitorFlow, setShowVisitorFlow] = useState(false);

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
      if (!selectedGroup) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', selectedGroup)
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
      setUsers(data || []);
    };

    fetchUsers();
  }, [selectedGroup]);

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

  const filteredUsers = users.filter(user => 
    isValidUserName(user.name) && user.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup(groupId);
    setSelectedGroupName(groupName);
    setSelectedName('');
    setSearchTerm('');
    setShowMatriculaVerification(false);
    setIsMatriculaVerified(false);
    setSelectedUser(null);
    setShowVisitorFlow(false);
  };

  const handleNameSelect = (userName: string) => {
    setSelectedName(userName);
    
    // Buscar usuário com matrícula
    const user = users.find(u => u.name === userName);
    if (user && user.matricula) {
      setSelectedUser(user);
      setShowMatriculaVerification(true);
      setIsMatriculaVerified(false);
    } else {
      // Usuário sem matrícula, permitir acesso direto
      setIsMatriculaVerified(true);
      setShowMatriculaVerification(false);
    }
  };

  const handleVisitorFlowStart = () => {
    setShowVisitorFlow(true);
  };

  const handleVisitorFlowCancel = () => {
    setShowVisitorFlow(false);
  };

  const handleMatriculaVerificationSuccess = () => {
    setIsMatriculaVerified(true);
    setShowMatriculaVerification(false);
  };

  const handleMatriculaVerificationCancel = () => {
    setShowMatriculaVerification(false);
    setSelectedName('');
    setSelectedUser(null);
    setIsMatriculaVerified(false);
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

    const userName = selectedName;
    if (!userName) {
      toast({
        title: "Erro", 
        description: "Por favor, selecione um nome.",
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
      const selectedUserData = users.find(user => user.name === userName);
      if (selectedUserData) {
        userId = selectedUserData.id;
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
          group_id: selectedGroup,
          group_type: selectedGroupName as any,
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
      setSelectedGroup(null);
      setSelectedGroupName('');
      setSelectedName('');
      setSearchTerm('');
      setShowMatriculaVerification(false);
      setIsMatriculaVerified(false);
      setSelectedUser(null);
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

  // Show visitor flow if active
  if (showVisitorFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <VisitorFlow
            onCancel={handleVisitorFlowCancel}
            currentTime={currentTime}
            systemSettings={systemSettings}
          />
        </div>
      </div>
    );
  }

  // Show matricula verification if needed
  if (showMatriculaVerification && selectedUser?.matricula) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <MatriculaVerification
            correctMatricula={selectedUser.matricula}
            userName={selectedUser.name}
            onVerificationSuccess={handleMatriculaVerificationSuccess}
            onCancel={handleMatriculaVerificationCancel}
          />
        </div>
      </div>
    );
  }

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

        {/* Opção Visitante no topo */}
        <div className="mb-8">
          <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">É VISITANTE?</h3>
                    <p className="text-purple-100">Clique aqui para registro de visitantes</p>
                  </div>
                </div>
                <Button
                  onClick={handleVisitorFlowStart}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-8 py-3 text-lg"
                >
                  VISITANTE
                </Button>
              </div>
            </CardContent>
          </Card>
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
              <DynamicGroupSelector
                selectedGroup={selectedGroup}
                onGroupSelect={handleGroupSelect}
              />
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
                    .filter(user => isValidUserName(user.name))
                    .map((user) => (
                      <Button
                        key={user.id}
                        onClick={() => handleNameSelect(user.name)}
                        className={`h-14 text-lg font-semibold justify-start transition-all duration-200 ${
                          selectedName === user.name
                            ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedName === user.name ? 'bg-white' : 'bg-green-500'
                          }`}></div>
                          <span className="flex-1 text-left">{user.name}</span>
                          {selectedName === user.name && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </div>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASSO 3: Escolher Refeição */}
          {selectedGroup && selectedName && isMatriculaVerified && (
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

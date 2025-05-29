
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  
  // States for employee flow
  const [showEmployeeFlow, setShowEmployeeFlow] = useState(false);
  const [employeeStep, setEmployeeStep] = useState<'group' | 'name' | 'meal'>('group');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [selectedName, setSelectedName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // States for matricula verification
  const [showMatriculaVerification, setShowMatriculaVerification] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMatriculaVerified, setIsMatriculaVerified] = useState(false);
  
  // States for visitor flow
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

  // Employee flow handlers
  const handleEmployeeFlowStart = () => {
    setShowEmployeeFlow(true);
    setEmployeeStep('group');
    resetEmployeeFlow();
  };

  const resetEmployeeFlow = () => {
    setSelectedGroup(null);
    setSelectedGroupName('');
    setSelectedName('');
    setSearchTerm('');
    setShowMatriculaVerification(false);
    setIsMatriculaVerified(false);
    setSelectedUser(null);
  };

  const handleGroupSelect = (groupId: string, groupName: string) => {
    setSelectedGroup(groupId);
    setSelectedGroupName(groupName);
    setEmployeeStep('name');
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
      setEmployeeStep('meal');
    }
  };

  const handleMatriculaVerificationSuccess = () => {
    setIsMatriculaVerified(true);
    setShowMatriculaVerification(false);
    setEmployeeStep('meal');
  };

  const handleMatriculaVerificationCancel = () => {
    setShowMatriculaVerification(false);
    setSelectedName('');
    setSelectedUser(null);
    setIsMatriculaVerified(false);
    setEmployeeStep('name');
  };

  // Visitor flow handlers
  const handleVisitorFlowStart = () => {
    setShowVisitorFlow(true);
  };

  const handleVisitorFlowCancel = () => {
    setShowVisitorFlow(false);
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
      setShowEmployeeFlow(false);
      resetEmployeeFlow();
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

  // Show employee flow if active
  if (showEmployeeFlow) {
    if (employeeStep === 'group') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Utensils className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">FUNCIONÁRIO</CardTitle>
                    <p className="text-blue-100 text-lg">Selecione seu setor</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    Onde você trabalha?
                  </h3>
                  
                  <DynamicGroupSelector
                    selectedGroup={selectedGroup}
                    onGroupSelect={handleGroupSelect}
                  />

                  <div className="flex justify-center mt-8">
                    <Button onClick={() => setShowEmployeeFlow(false)} variant="outline" className="px-8 py-3 text-gray-600 hover:text-gray-800">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (employeeStep === 'name') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">ENCONTRE SEU NOME</CardTitle>
                    <p className="text-green-100 text-lg">Setor: {selectedGroupName}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 h-6 w-6 z-10" />
                  <Input
                    placeholder="Digite seu nome aqui..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-16 pl-16 text-xl border-4 border-slate-200 hover:border-green-300 transition-all duration-200 bg-white/50 rounded-2xl"
                  />
                </div>
                
                {/* Lista de nomes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                  {filteredUsers
                    .filter(user => isValidUserName(user.name))
                    .map((user) => (
                      <Button
                        key={user.id}
                        onClick={() => handleNameSelect(user.name)}
                        className={`h-16 text-lg font-semibold justify-start transition-all duration-200 rounded-xl ${
                          selectedName === user.name
                            ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className={`w-4 h-4 rounded-full ${
                            selectedName === user.name ? 'bg-white' : 'bg-green-500'
                          }`}></div>
                          <span className="flex-1 text-left">{user.name}</span>
                          {selectedName === user.name && (
                            <CheckCircle className="h-6 w-6" />
                          )}
                        </div>
                      </Button>
                    ))}
                </div>

                <div className="flex gap-4 justify-center mt-8">
                  <Button onClick={() => setEmployeeStep('group')} variant="outline" className="px-8 py-3 text-gray-600 hover:text-gray-800">
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (employeeStep === 'meal' && isMatriculaVerified) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Utensils className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">ESCOLHA SUA REFEIÇÃO</CardTitle>
                    <p className="text-orange-100 text-lg">Olá, {selectedName}!</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-600">
                      Setor: <span className="font-bold">{selectedGroupName}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Botão Café da Manhã */}
                    <Button
                      onClick={() => handleMealRegistration('breakfast')}
                      disabled={!canRegisterBreakfast || loading}
                      className={`h-32 flex flex-col gap-3 justify-center text-left transition-all duration-300 rounded-3xl ${
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
                      className={`h-32 flex flex-col gap-3 justify-center text-left transition-all duration-300 rounded-3xl ${
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

                  <div className="flex justify-center mt-8">
                    <Button onClick={() => setEmployeeStep('name')} variant="outline" className="px-8 py-3 text-gray-600 hover:text-gray-800" disabled={loading}>
                      Voltar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  // Main screen - choice between visitor and employee
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Mais Simples e Maior */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white p-8 rounded-full shadow-2xl border-4 border-blue-100">
              <Utensils className="h-20 w-20 text-blue-600 mx-auto" />
            </div>
          </div>
          
          <h1 className="text-6xl font-black text-slate-800 mb-6">
            REGISTRO DE REFEIÇÕES
          </h1>
          
          {/* Horário Muito Grande e Visível */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-blue-100 inline-block mb-8">
            <div className="flex items-center gap-6">
              <Clock className="h-12 w-12 text-blue-600" />
              <span className="font-mono text-5xl font-bold text-slate-800">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Instruções Simples */}
          <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Escolha se você é <span className="font-bold text-blue-600">FUNCIONÁRIO</span> ou 
            <span className="font-bold text-purple-600"> VISITANTE</span> para registrar sua refeição
          </p>
        </div>

        {/* Duas Opções Principais - MUITO GRANDES - FUNCIONÁRIO PRIMEIRO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Opção Funcionário - PRIMEIRO */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer" onClick={handleEmployeeFlowStart}>
            <CardContent className="p-12 text-center">
              <div className="bg-white/20 p-8 rounded-full mx-auto mb-8 w-fit">
                <Utensils className="h-16 w-16" />
              </div>
              <h2 className="text-4xl font-black mb-4">SOU FUNCIONÁRIO</h2>
              <p className="text-2xl text-blue-100 mb-8">
                Trabalho na empresa
              </p>
              <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-12 py-6 text-2xl h-auto rounded-2xl">
                CLIQUE AQUI
              </Button>
            </CardContent>
          </Card>

          {/* Opção Visitante - SEGUNDO */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer" onClick={handleVisitorFlowStart}>
            <CardContent className="p-12 text-center">
              <div className="bg-white/20 p-8 rounded-full mx-auto mb-8 w-fit">
                <Users className="h-16 w-16" />
              </div>
              <h2 className="text-4xl font-black mb-4">SOU VISITANTE</h2>
              <p className="text-2xl text-purple-100 mb-8">
                Estou visitando a empresa
              </p>
              <Button className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-12 py-6 text-2xl h-auto rounded-2xl">
                CLIQUE AQUI
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access - Discreto */}
        <div className="text-center mt-16">
          <a 
            href="/admin" 
            className="inline-flex items-center gap-2 px-6 py-3 text-sm text-slate-500 hover:text-slate-700 transition-all duration-200 bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md border border-white/30"
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

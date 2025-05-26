
import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Utensils, Users, Building2, Search, QrCode } from 'lucide-react';
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

      const groupedUsers: {[key in GroupType]: string[]} = {
        operacao: [],
        projetos: []
      };

      data.forEach((user: { name: string, group_type: GroupType }) => {
        // Filter out empty or null names to prevent Select.Item errors
        if (user.name && user.name.trim() && groupedUsers[user.group_type]) {
          groupedUsers[user.group_type].push(user.name);
        }
      });

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
        name && name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers.filter(name => 
        name && name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const canRegisterBreakfast = systemSettings 
    ? currentTime.getHours() < parseInt(systemSettings.breakfast_deadline.split(':')[0]) || 
      (currentTime.getHours() === parseInt(systemSettings.breakfast_deadline.split(':')[0]) && 
       currentTime.getMinutes() < parseInt(systemSettings.breakfast_deadline.split(':')[1]))
    : currentTime.getHours() < 9;

  const canRegisterLunch = systemSettings
    ? currentTime.getHours() < parseInt(systemSettings.lunch_deadline.split(':')[0]) || 
      (currentTime.getHours() === parseInt(systemSettings.lunch_deadline.split(':')[0]) && 
       currentTime.getMinutes() < parseInt(systemSettings.lunch_deadline.split(':')[1]))
    : currentTime.getHours() < 14;

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
        title: "Horário encerrado",
        description: "Café da manhã só pode ser marcado até " + 
          (systemSettings?.breakfast_deadline || '09:00') + ".",
        variant: "destructive"
      });
      return;
    }

    if (mealType === 'lunch' && !canRegisterLunch) {
      toast({
        title: "Horário encerrado", 
        description: "Almoço só pode ser marcado até " + 
          (systemSettings?.lunch_deadline || '14:00') + ".",
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              RefeiControl
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">Sistema de Controle de Refeições</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Group Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Selecione o Grupo</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup as (value: string) => void}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha seu grupo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operacao">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Operação
                  </div>
                </SelectItem>
                <SelectItem value="projetos">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Projetos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name Selection */}
          {selectedGroup && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Seu Nome</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedName} onValueChange={setSelectedName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione seu nome..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                    <SelectItem value="outros">Outros (digitar nome)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Custom Name Input */}
          {selectedName === 'outros' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Digite seu nome</label>
              <Input
                placeholder="Seu nome completo..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          {/* Meal Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleMealRegistration('breakfast')}
              disabled={!canRegisterBreakfast || loading}
              className={`h-20 flex flex-col gap-2 ${
                canRegisterBreakfast 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Coffee className="h-6 w-6" />
              <span className="text-sm font-medium">Café da Manhã</span>
              <span className="text-xs opacity-80">até {systemSettings?.breakfast_deadline || '09:00'}</span>
            </Button>

            <Button
              onClick={() => handleMealRegistration('lunch')}
              disabled={!canRegisterLunch || loading}
              className={`h-20 flex flex-col gap-2 ${
                canRegisterLunch 
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Utensils className="h-6 w-6" />
              <span className="text-sm font-medium">Almoço</span>
              <span className="text-xs opacity-80">até {systemSettings?.lunch_deadline || '14:00'}</span>
            </Button>
          </div>

          <div className="text-center pt-4">
            <a 
              href="/admin" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Acesso Administrativo
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicAccess;

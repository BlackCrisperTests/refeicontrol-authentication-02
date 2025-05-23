
import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Utensils, Users, Building2, Search, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const PublicAccess = () => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data for users
  const users = {
    operacao: ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Ferreira'],
    projetos: ['Lucas Pereira', 'Fernanda Lima', 'Roberto Alves', 'Juliana Rocha', 'Marcos Souza']
  };

  const allUsers = [...users.operacao, ...users.projetos];
  
  const filteredUsers = selectedGroup 
    ? users[selectedGroup as keyof typeof users].filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers.filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const canRegisterBreakfast = currentTime.getHours() < 9;
  const canRegisterLunch = currentTime.getHours() < 14;

  const handleMealRegistration = (mealType: 'breakfast' | 'lunch') => {
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
        description: "Café da manhã só pode ser marcado até 09:00.",
        variant: "destructive"
      });
      return;
    }

    if (mealType === 'lunch' && !canRegisterLunch) {
      toast({
        title: "Horário encerrado", 
        description: "Almoço só pode ser marcado até 14:00.",
        variant: "destructive"
      });
      return;
    }

    // Here would be the actual registration logic
    console.log('Registering meal:', {
      group: selectedGroup,
      name: userName,
      mealType,
      date: currentTime.toISOString().split('T')[0],
      time: currentTime.toTimeString().split(' ')[0]
    });

    toast({
      title: "Sucesso!",
      description: `${mealType === 'breakfast' ? 'Café da manhã' : 'Almoço'} registrado para ${userName}.`,
    });

    // Reset form
    setSelectedGroup('');
    setSelectedName('');
    setCustomName('');
    setSearchTerm('');
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
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
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
              disabled={!canRegisterBreakfast}
              className={`h-20 flex flex-col gap-2 ${
                canRegisterBreakfast 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Coffee className="h-6 w-6" />
              <span className="text-sm font-medium">Café da Manhã</span>
              <span className="text-xs opacity-80">até 09:00</span>
            </Button>

            <Button
              onClick={() => handleMealRegistration('lunch')}
              disabled={!canRegisterLunch}
              className={`h-20 flex flex-col gap-2 ${
                canRegisterLunch 
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Utensils className="h-6 w-6" />
              <span className="text-sm font-medium">Almoço</span>
              <span className="text-xs opacity-80">até 14:00</span>
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

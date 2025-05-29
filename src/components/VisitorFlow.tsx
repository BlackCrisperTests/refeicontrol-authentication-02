import React, { useState } from 'react';
import { Clock, Coffee, Utensils, Users, Building, ChevronDown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MealType } from '@/types/database.types';
import { MealRecordService } from '@/services/mealRecordService';

interface VisitorFlowProps {
  onCancel: () => void;
  currentTime: Date;
  systemSettings: any;
  isOnline: boolean;
  updatePendingCount: () => void;
}

const VisitorFlow: React.FC<VisitorFlowProps> = ({
  onCancel,
  currentTime,
  systemSettings,
  isOnline,
  updatePendingCount
}) => {
  const [step, setStep] = useState<'area' | 'info' | 'meal'>('area');
  const [selectedArea, setSelectedArea] = useState<'operacao' | 'projetos' | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [showCustomCompany, setShowCustomCompany] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lista de empresas padrão
  const companies = [
    'PETROBRÁS',
    'VALE',
    'BRASKEM',
    'UNIPAR',
    'SABESP',
    'CEMIG',
    'COPEL',
    'ELETROBRAS',
    'CSN',
    'GERDAU',
    'USIMINAS',
    'JBS',
    'BRF',
    'MARFRIG',
    'MINERVA',
    'KLABIN',
    'SUZANO',
    'FIBRIA',
    'ELDORADO',
    'EMBRAER',
    'WEG',
    'RANDON',
    'TUPY',
    'MAHLE',
    'CONTINENTAL',
    'BOSCH',
    'ZF',
    'DANA',
    'EATON',
    'PARKER',
    'Minha empresa não está na lista'
  ];

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

  const canRegisterBreakfast = systemSettings ? isWithinTimeRange(systemSettings.breakfast_start_time, systemSettings.breakfast_deadline) : false;
  const canRegisterLunch = systemSettings ? isWithinTimeRange(systemSettings.lunch_start_time, systemSettings.lunch_deadline) : false;

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

  const handleAreaSelect = (area: 'operacao' | 'projetos') => {
    setSelectedArea(area);
    setStep('info');
  };

  const handleCompanySelect = (value: string) => {
    setSelectedCompany(value);
    if (value === 'Minha empresa não está na lista') {
      setShowCustomCompany(true);
    } else {
      setShowCustomCompany(false);
      setCustomCompany('');
    }
  };

  const handleInfoSubmit = () => {
    if (!visitorName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu nome.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedCompany) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma empresa.",
        variant: "destructive"
      });
      return;
    }

    if (showCustomCompany && !customCompany.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o nome da empresa.",
        variant: "destructive"
      });
      return;
    }
    
    setStep('meal');
  };

  const getFinalCompanyName = () => {
    return showCustomCompany ? customCompany : selectedCompany;
  };

  const handleMealRegistration = async (mealType: MealType) => {
    if (!selectedArea || !visitorName.trim()) return;

    const finalCompanyName = getFinalCompanyName();
    if (!finalCompanyName.trim()) return;

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
      // Format the user name as "Name | Company (Visitante)"
      const formattedUserName = `${visitorName} | ${finalCompanyName} (Visitante)`;

      // Criar o registro usando o novo serviço
      const mealRecordData = {
        user_id: null,
        user_name: formattedUserName,
        group_id: null,
        group_type: selectedArea,
        meal_type: mealType,
        meal_date: new Date().toISOString().split('T')[0],
        meal_time: currentTime.toTimeString().split(' ')[0]
      };

      await MealRecordService.createMealRecord(mealRecordData, isOnline);

      toast({
        title: "Sucesso!",
        description: `${mealType === 'breakfast' ? 'Café da manhã' : 'Almoço'} registrado para ${visitorName} da empresa ${finalCompanyName}.`
      });

      // Atualizar contador de registros pendentes
      updatePendingCount();

      // Reset and close
      onCancel();
    } catch (error: any) {
      console.error('Error registering visitor meal:', error);
      toast({
        title: isOnline ? "Erro ao registrar refeição" : "Registrado offline",
        description: error.message || (isOnline ? "Por favor, tente novamente." : "Será enviado quando a conexão for restabelecida."),
        variant: isOnline ? "destructive" : "default"
      });

      if (!isOnline) {
        // Atualizar contador e fechar mesmo quando offline
        updatePendingCount();
        onCancel();
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'area') {
    return (
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">VISITANTE</CardTitle>
              <p className="text-purple-100 text-lg">Selecione sua área de visita</p>
            </div>
            {/* Status de conexão */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-6 w-6 text-green-300" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-300" />
              )}
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            {!isOnline && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <p className="text-amber-800 text-center font-medium">
                  📱 Modo Offline - Seu registro será salvo localmente e enviado quando a conexão voltar
                </p>
              </div>
            )}

            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Qual área você está visitando?
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => handleAreaSelect('operacao')}
                className="h-20 flex items-center gap-4 justify-start text-xl font-bold text-white bg-red-500 hover:bg-red-400"
              >
                <div className="bg-white/20 p-3 rounded-xl">
                  <Building className="h-8 w-8" />
                </div>
                <span>OPERAÇÃO</span>
              </Button>
              
              <Button
                onClick={() => handleAreaSelect('projetos')}
                className="h-20 flex items-center gap-4 justify-start text-xl font-bold text-white bg-blue-700 hover:bg-blue-600"
              >
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <span>PROJETOS</span>
              </Button>
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={onCancel} variant="outline" className="px-8 py-3 text-gray-600 hover:text-gray-800">
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'info') {
    return (
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">VISITANTE DE {selectedArea?.toUpperCase()}</CardTitle>
              <p className="text-orange-100 text-lg">Preencha suas informações</p>
            </div>
            {/* Status de conexão */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-6 w-6 text-green-300" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-300" />
              )}
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            {!isOnline && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-center font-medium">
                  📱 Modo Offline - Suas informações serão salvas localmente
                </p>
              </div>
            )}

            <div>
              <label htmlFor="visitorName" className="block text-lg font-semibold text-gray-800 mb-3">
                Seu nome completo:
              </label>
              <Input
                id="visitorName"
                placeholder="Digite seu nome completo aqui..."
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="h-16 text-xl border-4 border-orange-200 hover:border-orange-300 transition-all duration-200 bg-orange-50 rounded-2xl"
              />
            </div>

            <div>
              <label htmlFor="visitorCompany" className="block text-lg font-semibold text-gray-800 mb-3">
                Selecione sua empresa:
              </label>
              <Select value={selectedCompany} onValueChange={handleCompanySelect}>
                <SelectTrigger className="h-16 text-xl border-4 border-orange-200 hover:border-orange-300 transition-all duration-200 bg-orange-50 rounded-2xl">
                  <SelectValue placeholder="Escolha sua empresa..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-orange-200 rounded-xl shadow-xl max-h-80">
                  {companies.map((company) => (
                    <SelectItem 
                      key={company} 
                      value={company}
                      className="text-lg py-3 hover:bg-orange-50 cursor-pointer"
                    >
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showCustomCompany && (
              <div>
                <label htmlFor="customCompany" className="block text-lg font-semibold text-gray-800 mb-3">
                  Digite o nome da sua empresa:
                </label>
                <Input
                  id="customCompany"
                  placeholder="Nome da empresa..."
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="h-16 text-xl border-4 border-orange-200 hover:border-orange-300 transition-all duration-200 bg-orange-50 rounded-2xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleInfoSubmit()}
                />
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setStep('area')}
                variant="outline"
                className="px-8 py-3 text-gray-600 hover:text-gray-800"
              >
                Voltar
              </Button>
              
              <Button
                onClick={handleInfoSubmit}
                disabled={!visitorName.trim() || !selectedCompany || (showCustomCompany && !customCompany.trim())}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'meal') {
    const finalCompanyName = getFinalCompanyName();
    
    return (
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Utensils className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">ESCOLHA SUA REFEIÇÃO</CardTitle>
              <p className="text-green-100 text-lg">Olá, {visitorName}!</p>
            </div>
            {/* Status de conexão */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-6 w-6 text-green-300" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-300" />
              )}
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            {!isOnline && (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 font-medium">
                  📱 Modo Offline - Sua refeição será registrada localmente e enviada quando a conexão voltar
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">
                <span className="font-bold">{finalCompanyName}</span> - Visitante de <span className="font-bold">{selectedArea === 'operacao' ? 'Operação' : 'Projetos'}</span>
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
                    {loading ? <Loader2 className="h-12 w-12 animate-spin" /> : <Coffee className="h-12 w-12" />}
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
                    {loading ? <Loader2 className="h-12 w-12 animate-spin" /> : <Utensils className="h-12 w-12" />}
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
              <Button
                onClick={() => setStep('info')}
                variant="outline"
                className="px-8 py-3 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Voltar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default VisitorFlow;

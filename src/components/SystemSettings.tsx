
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SystemSettings as SystemSettingsType } from '@/types/database.types';
import { Settings, Loader2, Save, Clock } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [breakfastStartTime, setBreakfastStartTime] = useState('06:00');
  const [breakfastDeadline, setBreakfastDeadline] = useState('');
  const [lunchStartTime, setLunchStartTime] = useState('11:00');
  const [lunchDeadline, setLunchDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações atuais
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;

      setSettings(data);
      setBreakfastStartTime(data.breakfast_start_time || '06:00');
      setBreakfastDeadline(data.breakfast_deadline);
      setLunchStartTime(data.lunch_start_time || '11:00');
      setLunchDeadline(data.lunch_deadline);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          breakfast_start_time: breakfastStartTime,
          breakfast_deadline: breakfastDeadline,
          lunch_start_time: lunchStartTime,
          lunch_deadline: lunchDeadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Os horários foram atualizados com sucesso.",
      });

      // Atualizar estado local
      setSettings({
        ...settings,
        breakfast_start_time: breakfastStartTime,
        breakfast_deadline: breakfastDeadline,
        lunch_start_time: lunchStartTime,
        lunch_deadline: lunchDeadline,
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Café da Manhã */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-600">Café da Manhã</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="breakfastStartTime">Horário de Início</Label>
              <Input
                id="breakfastStartTime"
                type="time"
                value={breakfastStartTime}
                onChange={(e) => setBreakfastStartTime(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-600">
                A partir deste horário é possível registrar café
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakfastDeadline">Horário Limite</Label>
              <Input
                id="breakfastDeadline"
                type="time"
                value={breakfastDeadline}
                onChange={(e) => setBreakfastDeadline(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-600">
                Café pode ser registrado até este horário
              </p>
            </div>
          </div>
        </div>

        {/* Almoço */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">Almoço</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="lunchStartTime">Horário de Início</Label>
              <Input
                id="lunchStartTime"
                type="time"
                value={lunchStartTime}
                onChange={(e) => setLunchStartTime(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-600">
                A partir deste horário é possível registrar almoço
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lunchDeadline">Horário Limite</Label>
              <Input
                id="lunchDeadline"
                type="time"
                value={lunchDeadline}
                onChange={(e) => setLunchDeadline(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-600">
                Almoço pode ser registrado até este horário
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {settings && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              Última atualização: {new Date(settings.updated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSettings;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SystemSettings as SystemSettingsType } from '@/types/database.types';
import { Settings, Loader2, Save } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [breakfastDeadline, setBreakfastDeadline] = useState('');
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
      setBreakfastDeadline(data.breakfast_deadline);
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
          breakfast_deadline: breakfastDeadline,
          lunch_deadline: lunchDeadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Os horários limite foram atualizados com sucesso.",
      });

      // Atualizar estado local
      setSettings({
        ...settings,
        breakfast_deadline: breakfastDeadline,
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="breakfastDeadline">Horário Limite - Café da Manhã</Label>
            <Input
              id="breakfastDeadline"
              type="time"
              value={breakfastDeadline}
              onChange={(e) => setBreakfastDeadline(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-gray-600">
              Café da manhã pode ser registrado até este horário
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunchDeadline">Horário Limite - Almoço</Label>
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

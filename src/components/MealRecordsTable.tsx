
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MealRecord } from '@/types/database.types';
import { Trash2, Loader2 } from 'lucide-react';
import PasswordConfirmDialog from './PasswordConfirmDialog';

interface MealRecordsTableProps {
  records: MealRecord[];
  loading: boolean;
  onRecordsUpdated: () => void;
}

const MealRecordsTable = ({ records, loading, onRecordsUpdated }: MealRecordsTableProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MealRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('meal_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      toast({
        title: "Registro removido",
        description: "O registro de refeição foi removido com sucesso.",
      });

      onRecordsUpdated();
    } catch (error: any) {
      console.error('Error deleting meal record:', error);
      toast({
        title: "Erro ao remover registro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setRecordToDelete(null);
    }
  };

  const confirmDelete = (record: MealRecord) => {
    setRecordToDelete(record);
    setShowPasswordDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Refeição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.user_name}</TableCell>
                <TableCell className="capitalize">
                  {record.group_type === 'operacao' ? 'Operação' : 'Projetos'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.meal_type === 'breakfast' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {record.meal_type === 'breakfast' ? 'Café' : 'Almoço'}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(record.meal_date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>{record.meal_time}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => confirmDelete(record)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PasswordConfirmDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setRecordToDelete(null);
        }}
        onConfirm={handleDeleteRecord}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o registro de ${recordToDelete?.meal_type === 'breakfast' ? 'café' : 'almoço'} de ${recordToDelete?.user_name}?`}
      />
    </>
  );
};

export default MealRecordsTable;

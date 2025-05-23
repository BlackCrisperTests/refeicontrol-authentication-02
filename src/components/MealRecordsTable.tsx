
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MealRecord } from '@/types/database.types';
import { Trash2, Loader2, Search, Filter, Calendar, Users, Coffee, Utensils } from 'lucide-react';
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
  
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterMeal, setFilterMeal] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

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

  // Filtrar registros
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesName = record.user_name.toLowerCase().includes(searchName.toLowerCase());
      const matchesGroup = !filterGroup || record.group_type === filterGroup;
      const matchesMeal = !filterMeal || record.meal_type === filterMeal;
      const matchesDate = !filterDate || record.meal_date === filterDate;
      
      return matchesName && matchesGroup && matchesMeal && matchesDate;
    });
  }, [records, searchName, filterGroup, filterMeal, filterDate]);

  // Paginação
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

  // Estatísticas dos registros filtrados
  const stats = useMemo(() => {
    const breakfastCount = filteredRecords.filter(r => r.meal_type === 'breakfast').length;
    const lunchCount = filteredRecords.filter(r => r.meal_type === 'lunch').length;
    const operacaoCount = filteredRecords.filter(r => r.group_type === 'operacao').length;
    const projetosCount = filteredRecords.filter(r => r.group_type === 'projetos').length;
    
    return { breakfastCount, lunchCount, operacaoCount, projetosCount };
  }, [filteredRecords]);

  const clearFilters = () => {
    setSearchName('');
    setFilterGroup('');
    setFilterMeal('');
    setFilterDate('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Café</p>
                <p className="text-2xl font-bold text-orange-600">{stats.breakfastCount}</p>
              </div>
              <Coffee className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Almoço</p>
                <p className="text-2xl font-bold text-blue-600">{stats.lunchCount}</p>
              </div>
              <Utensils className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operação</p>
                <p className="text-2xl font-bold text-green-600">{stats.operacaoCount}</p>
              </div>
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projetos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.projetosCount}</p>
              </div>
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os grupos</SelectItem>
                <SelectItem value="operacao">Operação</SelectItem>
                <SelectItem value="projetos">Projetos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterMeal} onValueChange={setFilterMeal}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as refeições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as refeições</SelectItem>
                <SelectItem value="breakfast">Café</SelectItem>
                <SelectItem value="lunch">Almoço</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filtrar por data"
            />
            
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registros de Refeições
            </div>
            <span className="text-sm font-normal text-gray-600">
              {filteredRecords.length} registro(s) encontrado(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{record.user_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.group_type === 'operacao' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {record.group_type === 'operacao' ? 'Operação' : 'Projetos'}
                      </span>
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
                    <TableCell className="font-mono text-sm">{record.meal_time}</TableCell>
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
                
                {paginatedRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {filteredRecords.length === 0 ? 
                        "Nenhum registro encontrado com os filtros aplicados." :
                        "Nenhum registro encontrado."
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + recordsPerPage, filteredRecords.length)} de {filteredRecords.length} registros
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default MealRecordsTable;

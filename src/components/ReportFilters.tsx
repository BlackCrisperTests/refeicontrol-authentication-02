
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupType } from '@/types/database.types';
import { Filter, X } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

export interface ReportFilters {
  month?: string;
  group?: string;
  date?: string;
  user?: string;
  groupId?: string; // Adicionado para filtrar por grupo específico
}

interface ReportFiltersComponentProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onClearFilters: () => void;
  users: Array<{ name: string; group_type: GroupType }>;
}

const ReportFiltersComponent = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  users 
}: ReportFiltersComponentProps) => {
  const { groups } = useGroups();

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    // Convert "all" back to undefined for the filter logic
    const filterValue = value === "all" ? undefined : value;
    onFiltersChange({
      ...filters,
      [key]: filterValue,
    });
  };

  const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Relatório
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month-filter">Mês</Label>
            <Input
              id="month-filter"
              type="month"
              value={filters.month || ''}
              onChange={(e) => updateFilter('month', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-filter">Data Específica</Label>
            <Input
              id="date-filter"
              type="date"
              value={filters.date || ''}
              onChange={(e) => updateFilter('date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Grupo Específico</Label>
            <Select 
              value={filters.groupId || 'all'} 
              onValueChange={(value) => updateFilter('groupId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Grupo (Legacy)</Label>
            <Select 
              value={filters.group || 'all'} 
              onValueChange={(value) => updateFilter('group', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="operacao">Operação</SelectItem>
                <SelectItem value="projetos">Projetos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Select 
              value={filters.user || 'all'} 
              onValueChange={(value) => updateFilter('user', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.name} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              disabled={!hasFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFiltersComponent;

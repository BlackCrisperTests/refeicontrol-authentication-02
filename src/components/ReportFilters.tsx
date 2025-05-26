
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

export interface ReportFilters {
  month?: string;
  group?: string;
  date?: string;
  user?: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onClearFilters: () => void;
  users: Array<{ name: string }>;
  className?: string;
}

const ReportFiltersComponent: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  users,
  className = ""
}) => {
  const { groups } = useGroups();

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Mês */}
          <div className="space-y-2">
            <Label htmlFor="month-filter">Mês</Label>
            <Select
              value={filters.month || 'all'}
              onValueChange={(value) => handleFilterChange('month', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={`${currentYear}-${month.value}`}>
                    {month.label} {currentYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Grupo */}
          <div className="space-y-2">
            <Label htmlFor="group-filter">Grupo</Label>
            <Select
              value={filters.group || 'all'}
              onValueChange={(value) => handleFilterChange('group', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.display_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data Específica */}
          <div className="space-y-2">
            <Label htmlFor="date-filter">Data Específica</Label>
            <Input
              id="date-filter"
              type="date"
              value={filters.date || ''}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Filtro por Usuário */}
          <div className="space-y-2">
            <Label htmlFor="user-filter">Usuário</Label>
            <Select
              value={filters.user || 'all'}
              onValueChange={(value) => handleFilterChange('user', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFiltersComponent;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

interface DynamicGroupSelectorProps {
  selectedGroup: string | null;
  onGroupSelect: (groupId: string, groupName: string) => void;
  className?: string;
}

const DynamicGroupSelector = ({ selectedGroup, onGroupSelect, className = "" }: DynamicGroupSelectorProps) => {
  const { groups, loading } = useGroups();

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {groups.map((group) => (
        <Button
          key={group.id}
          onClick={() => onGroupSelect(group.id, group.name)}
          variant={selectedGroup === group.id ? "default" : "outline"}
          className={`h-20 flex items-center gap-4 text-left justify-start transition-all duration-200 hover:scale-105 ${
            selectedGroup === group.id 
              ? 'shadow-lg' 
              : 'hover:shadow-md'
          }`}
          style={{
            backgroundColor: selectedGroup === group.id ? group.color : 'transparent',
            borderColor: group.color,
            color: selectedGroup === group.id ? 'white' : group.color,
          }}
        >
          <div 
            className={`p-3 rounded-lg flex items-center justify-center ${
              selectedGroup === group.id 
                ? 'bg-white/20' 
                : ''
            }`}
            style={{
              backgroundColor: selectedGroup === group.id ? 'rgba(255,255,255,0.2)' : `${group.color}20`
            }}
          >
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold text-lg">{group.display_name}</div>
            <div className={`text-sm ${
              selectedGroup === group.id 
                ? 'text-white/80' 
                : 'text-gray-600'
            }`}>
              Selecionar grupo
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default DynamicGroupSelector;

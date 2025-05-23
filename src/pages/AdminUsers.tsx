
import React from 'react';
import AdminUsersManagement from '@/components/AdminUsersManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
        </Button>
        
        <CardTitle className="text-2xl font-bold">
          Gerenciamento de Administradores
        </CardTitle>
      </div>
      
      <AdminUsersManagement />
    </div>
  );
};

export default AdminUsers;


import React from 'react';

interface BrandHeaderProps {
  showRefeiControl?: boolean;
  className?: string;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ 
  showRefeiControl = true, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center gap-8 ${className}`}>
      {/* Logo Mizu */}
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/d38ceb0f-90a2-4150-bb46-ea05261ceb60.png" 
          alt="Mizu Cimentos" 
          className="h-16 w-auto"
        />
      </div>
      
      {showRefeiControl && (
        <div className="flex items-center gap-4">
          <div className="w-px h-12 bg-slate-300"></div>
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/da23f7ca-e2dc-473a-8266-22c9c492e5d0.png" 
              alt="RefeiControl" 
              className="h-12 w-auto"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-800">RefeiControl</h1>
              <p className="text-slate-600 font-medium">Sistema de Controle de Refeições</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandHeader;

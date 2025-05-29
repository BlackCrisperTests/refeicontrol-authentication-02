
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
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/a0cb27d0-3b2e-4eff-a7cb-0ee6fc2ab745.png" 
              alt="RefeiControl - Sistema de Controle de Refeições" 
              className="h-20 w-auto"
            />
          </div>
        </div>
      )}
      
      {/* Logo BlackCrisper */}
      <div className="flex items-center gap-4">
        <div className="w-px h-12 bg-slate-300"></div>
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/2597f083-c6d0-4029-bbd5-01576df05870.png" 
            alt="BlackCrisper" 
            className="h-16 w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;

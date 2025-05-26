
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
              src="/lovable-uploads/56a93187-288c-427c-8201-6fe4029f0a83.png" 
              alt="RefeiControl - Sistema de Controle de Refeições" 
              className="h-20 w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandHeader;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, X, CheckCircle, Backspace } from 'lucide-react';

interface MatriculaVerificationProps {
  correctMatricula: string;
  userName: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

const MatriculaVerification: React.FC<MatriculaVerificationProps> = ({
  correctMatricula,
  userName,
  onVerificationSuccess,
  onCancel
}) => {
  const [inputMatricula, setInputMatricula] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleNumberClick = (number: string) => {
    if (inputMatricula.length < 3) {
      setInputMatricula(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    setInputMatricula(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputMatricula('');
  };

  const handleConfirm = () => {
    if (inputMatricula.length !== 3) {
      return;
    }

    const correct = inputMatricula === correctMatricula;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } else {
      setTimeout(() => {
        setShowResult(false);
        setInputMatricula('');
      }, 2000);
    }
  };

  if (showResult) {
    return (
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
        <CardContent className="p-8 text-center">
          {isCorrect ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600">Verificação Concluída!</h3>
              <p className="text-lg text-gray-600">Matrícula verificada com sucesso para {userName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-600">Matrícula Incorreta!</h3>
              <p className="text-lg text-gray-600">Tente novamente</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-full">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">VERIFICAÇÃO DE MATRÍCULA</CardTitle>
            <p className="text-blue-100 text-lg">Digite sua matrícula para continuar</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Olá, {userName}!
            </h3>
            <p className="text-gray-600">
              Para confirmar sua identidade, digite sua matrícula:
            </p>
          </div>

          {/* Campo de exibição da matrícula */}
          <div className="flex justify-center">
            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6 min-w-[200px]">
              <div className="flex justify-center gap-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="w-16 h-16 bg-white border-2 border-slate-300 rounded-lg flex items-center justify-center text-3xl font-bold text-slate-700"
                  >
                    {inputMatricula[index] || ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <Button
                key={number}
                onClick={() => handleNumberClick(number.toString())}
                className="h-16 text-2xl font-bold bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                disabled={inputMatricula.length >= 3}
              >
                {number}
              </Button>
            ))}
            
            {/* Linha inferior do teclado */}
            <Button
              onClick={handleClear}
              className="h-16 text-lg font-bold bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-200"
            >
              C
            </Button>
            
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-16 text-2xl font-bold bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              disabled={inputMatricula.length >= 3}
            >
              0
            </Button>
            
            <Button
              onClick={handleBackspace}
              className="h-16 font-bold bg-orange-50 border-2 border-orange-300 text-orange-600 hover:bg-orange-100 hover:border-orange-400 transition-all duration-200"
            >
              <Backspace className="h-6 w-6" />
            </Button>
          </div>

          {/* Botão OK */}
          <div className="flex justify-center">
            <Button
              onClick={handleConfirm}
              disabled={inputMatricula.length !== 3}
              className="px-12 py-4 text-xl font-bold bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
            >
              OK
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onCancel}
              variant="outline"
              className="px-8 py-3 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatriculaVerification;

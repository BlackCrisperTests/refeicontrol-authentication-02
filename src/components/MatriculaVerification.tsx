
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, X, CheckCircle } from 'lucide-react';

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
  const [options, setOptions] = useState<string[]>([]);
  const [selectedMatricula, setSelectedMatricula] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Gerar duas matrículas aleatórias de 3 dígitos
    const generateRandomMatricula = () => {
      return Math.floor(100 + Math.random() * 900).toString();
    };

    const randomOptions = [generateRandomMatricula(), generateRandomMatricula()];
    
    // Garantir que as matrículas aleatórias sejam diferentes da correta
    const filteredOptions = randomOptions.filter(option => option !== correctMatricula);
    while (filteredOptions.length < 2) {
      const newOption = generateRandomMatricula();
      if (newOption !== correctMatricula && !filteredOptions.includes(newOption)) {
        filteredOptions.push(newOption);
      }
    }

    // Misturar as opções
    const allOptions = [correctMatricula, ...filteredOptions.slice(0, 2)];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    setOptions(shuffledOptions);
  }, [correctMatricula]);

  const handleMatriculaSelect = (matricula: string) => {
    setSelectedMatricula(matricula);
    const correct = matricula === correctMatricula;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } else {
      setTimeout(() => {
        setShowResult(false);
        setSelectedMatricula('');
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
        </div>
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
            <p className="text-blue-100 text-lg">Selecione sua matrícula para continuar</p>
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
              Para confirmar sua identidade, selecione sua matrícula:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {options.map((matricula, index) => (
              <Button
                key={index}
                onClick={() => handleMatriculaSelect(matricula)}
                className="h-16 text-xl font-bold bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                disabled={selectedMatricula !== ''}
              >
                {matricula}
              </Button>
            ))}
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

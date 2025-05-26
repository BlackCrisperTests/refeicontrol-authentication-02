
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MealRecord, User } from '@/types/database.types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  title: string;
  subtitle: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  adminName: string;
  generatedAt: string;
}

export const generatePDF = (reportData: ReportData): void => {
  const doc = new jsPDF();
  
  // Header com logo/título
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('RefeiControl', 20, 25);
  
  doc.setFontSize(16);
  doc.text(reportData.title, 20, 40);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(reportData.subtitle, 20, 50);
  
  // Informações do relatório
  doc.setFontSize(10);
  doc.text(`Gerado por: ${reportData.adminName}`, 20, 65);
  doc.text(`Data/Hora: ${reportData.generatedAt}`, 20, 72);
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 80, 190, 80);
  
  // Tabela com dados
  doc.autoTable({
    head: [reportData.columns.map(col => col.header)],
    body: reportData.data.map(row => 
      reportData.columns.map(col => row[col.dataKey] || '-')
    ),
    startY: 90,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - RefeiControl Sistema de Controle de Refeições`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Download do arquivo
  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const formatMealRecordForReport = (record: MealRecord) => ({
  data: record.meal_date,
  nome: record.user_name,
  grupo: record.group_type === 'operacao' ? 'Operação' : 'Projetos',
  refeicao: record.meal_type === 'breakfast' ? 'Café da Manhã' : 'Almoço',
  horario: record.meal_time,
});

export const formatUserForReport = (user: User) => ({
  nome: user.name,
  grupo: user.group_type === 'operacao' ? 'Operação' : 'Projetos',
  status: user.active ? 'Ativo' : 'Inativo',
  cadastro: new Date(user.created_at).toLocaleDateString('pt-BR'),
});

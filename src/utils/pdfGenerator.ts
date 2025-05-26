
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MealRecord, User, GroupType } from '@/types/database.types';

export interface ReportData {
  title: string;
  subtitle: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  adminName: string;
  generatedAt: string;
}

export const generatePDF = (reportData: ReportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.title, 20, 30);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(reportData.subtitle, 20, 40);
  
  // Info
  doc.setFontSize(10);
  doc.text(`Gerado por: ${reportData.adminName}`, 20, 55);
  doc.text(`Data/Hora: ${reportData.generatedAt}`, 20, 62);
  
  // Table
  autoTable(doc, {
    head: [reportData.columns.map(col => col.header)],
    body: reportData.data.map(row => 
      reportData.columns.map(col => row[col.dataKey] || '')
    ),
    startY: 75,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 75, left: 20, right: 20 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Download
  const fileName = `${reportData.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const formatMealRecordForReport = (record: MealRecord & { groups?: any }) => {
  const mealTypeMap = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Janta'
  };

  return {
    data: new Date(record.meal_date).toLocaleDateString('pt-BR'),
    nome: record.user_name,
    grupo: record.groups?.display_name || 'Sem grupo',
    refeicao: mealTypeMap[record.meal_type] || record.meal_type,
    horario: record.meal_time,
  };
};

export const formatUserForReport = (user: User & { groups?: any }) => {
  return {
    nome: user.name,
    grupo: user.groups?.display_name || 'Sem grupo',
    status: user.active ? 'Ativo' : 'Inativo',
    cadastro: new Date(user.created_at).toLocaleDateString('pt-BR'),
  };
};

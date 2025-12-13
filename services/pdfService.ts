import type { Soldier, AssignedItem, Taasuka } from '../types';

// TypeScript declarations for jspdf and jspdf-autotable since they are loaded from script tags
declare global {
  interface Window {
    jspdf: any;
    autoTable: any;
    html2canvas: any;
  }
}

// Fallback function to create table manually if autoTable is not available
const createManualTable = (doc: any, headers: string[], rows: any[][], startY: number) => {
  const rtl = (text: string) => text.split('').reverse().join('');
  // Column widths: שם פריט, מס"ד, גורם מספק, כמות (RTL order from right to left)
  const cellWidths = [75, 30, 60, 25];
  const rowHeight = 10;
  let currentY = startY;
  
  // Draw header (RTL - start from right)
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); // Use setFont instead of setFontStyle
  
  // Start from right side (195mm) and draw columns RTL
  let x = 195;
  headers.forEach((header, i) => {
    doc.rect(x - cellWidths[i], currentY - 7, cellWidths[i], rowHeight, 'F');
    doc.text(header, x - 5, currentY, { align: 'right' });
    x -= cellWidths[i];
  });
  
  currentY += rowHeight;
  
  // Draw rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal'); // Use setFont instead of setFontStyle
  rows.forEach((row, rowIndex) => {
    if (currentY > 270) { // New page if needed
      doc.addPage();
      currentY = 20;
    }
    
    x = 195;
    row.forEach((cell, cellIndex) => {
      doc.rect(x - cellWidths[cellIndex], currentY - 7, cellWidths[cellIndex], rowHeight, 'S');
      doc.text(cell || '', x - 5, currentY, { align: 'right' });
      x -= cellWidths[cellIndex];
    });
    currentY += rowHeight;
  });
  
  // Store finalY for footer positioning
  (doc as any).lastAutoTable = { finalY: currentY };
};

export const generateTaasukaEquipmentPdf = async (soldier: Soldier, misgeretName: string, taasuka: Taasuka) => {
  // Use html2canvas approach for better Hebrew support
  if (window.html2canvas) {
    try {
      // Create a hidden HTML element with the form content
      const formHtml = createFormHTML(soldier, misgeretName, taasuka);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formHtml;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.direction = 'rtl';
      tempDiv.style.textAlign = 'right';
      tempDiv.style.color = '#000000';
      tempDiv.style.backgroundColor = '#FFFFFF';
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await window.html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Remove temp element
      document.body.removeChild(tempDiv);

      // Convert canvas to PDF
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`טופס_השאלת_ציוד_1008_${taasuka.name}_${soldier.name}.pdf`);
      return;
    } catch (error) {
      console.error('Error with html2canvas approach:', error);
      // Fallback to jsPDF approach
    }
  }

  // Fallback to jsPDF approach (may have Hebrew display issues)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Helper to reverse string for RTL display in jspdf
  const rtl = (text: string) => text.split('').reverse().join('');

  // Set all text to black
  doc.setTextColor(0, 0, 0);

  // Header - Updated title
  doc.setFontSize(20);
  doc.text(rtl("טופס השאלת ציוד -1008"), 105, 20, { align: 'center' });

  // Soldier Details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Ensure black text
  doc.text(rtl(`שם: ${soldier.name}`), 190, 40, { align: 'right' });
  doc.text(rtl(`מ.א: ${soldier.personalId}`), 190, 48, { align: 'right' });
  doc.text(rtl(`מסגרת: ${misgeretName}`), 190, 56, { align: 'right' });
  doc.text(rtl(`תעסוקה: ${taasuka.name}`), 190, 64, { align: 'right' });

  // Table - Columns in RTL order (right to left): שם פריט | מס"ד | גורם מספק | כמות
  const tableColumn = [
      rtl("שם פריט"),
      rtl("מס\"ד"),
      rtl("גורם מספק"),
      rtl("כמות")
  ];
  const tableRows: any[] = [];

  const taasukaItems = soldier.assignedItems.filter(item => item.taasukaId === taasuka.id);

  taasukaItems.forEach((item: AssignedItem) => {
    // Determine provider display: show if it's from taasuka inventory or external
    let providerDisplay = item.provider;
    if (item.inventoryItemId) {
      // Item is from taasuka inventory - show that it's from the taasuka
      providerDisplay = `רספייה`;
    } else {
      // Item is from external provider - show the provider name
      providerDisplay = `${item.provider} (ספק חיצוני)`;
    }

    const itemData = [
      rtl(item.name),
      item.serialNumber ? rtl(item.serialNumber) : "", // מס"ד (Serial number)
      rtl(providerDisplay),
      item.quantity.toString(),
    ];
    tableRows.push(itemData);
  });

  // Wait for autoTable to be available if scripts are still loading
  // Try different methods to access autoTable
  const getAutoTableFn = () => {
    if (typeof (window as any).autoTable === 'function') {
      return (window as any).autoTable;
    }
    if (typeof (doc as any).autoTable === 'function') {
      return (doc as any).autoTable;
    }
    if ((window as any).jspdf && typeof (window as any).jspdf.autoTable === 'function') {
      return (window as any).jspdf.autoTable;
    }
    return null;
  };
  
  const autoTableFn = getAutoTableFn();
  
  if (autoTableFn) {
    try {
      autoTableFn(doc, {
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: {
            halign: 'center',
            cellPadding: 2,
            fontSize: 9,
            textColor: [0, 0, 0], // Black text for body cells
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 75 }, // שם פריט (Item name) column
          1: { cellWidth: 30 }, // מס"ד (Serial number) column
          2: { cellWidth: 60 }, // גורם מספק (Provider) column - wider for better text display
          3: { cellWidth: 25 }, // כמות (Quantity) column
        },
        didParseCell: (data: any) => {
          // Align Hebrew text to the right in cells
          if(data.section === 'body' || data.section === 'head') {
            data.cell.styles.halign = 'right';
          }
        }
      });
    } catch (error) {
      console.error('Error using autoTable:', error);
      // Fallback to manual table creation
      createManualTable(doc, tableColumn, tableRows, 80);
    }
  } else {
    // Fallback: create table manually
    createManualTable(doc, tableColumn, tableRows, 80);
  }

  // Footer / Declaration
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Ensure black text for footer
  const declaration1 = rtl("ציוד זה באחריות המקבל ועליו להחזירו בתום התקופה כשהוא תקין ושלם.");
  const splitDeclaration1 = doc.splitTextToSize(declaration1, 180);
  doc.text(splitDeclaration1, 195, finalY + 15, { align: 'right' });
  
  doc.setTextColor(0, 0, 0); // Ensure black text
  const declaration2 = rtl("אי החזרת הציוד עלולה לגרור בהשלכות כספיות ומשפטיות.");
  const splitDeclaration2 = doc.splitTextToSize(declaration2, 180);
  doc.text(splitDeclaration2, 195, finalY + 30, { align: 'right' });
  
  // Format current date in Hebrew
  const currentDate = new Date().toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });
  doc.text(rtl(`תאריך: ${currentDate}`), 190, finalY + 55, { align: 'right' });

  // Save the PDF
  doc.save(`טופס_השאלת_ציוד_1008_${taasuka.name}_${soldier.name}.pdf`);
};

// Helper function to create HTML for the form
const createFormHTML = (soldier: Soldier, misgeretName: string, taasuka: Taasuka): string => {
  // Include all items linked to this taasuka (both from inventory and external)
  const taasukaItems = soldier.assignedItems.filter(item => item.taasukaId === taasuka.id);
  
  let tableRows = '';
  taasukaItems.forEach((item: AssignedItem) => {
    let providerDisplay = item.provider;
    if (item.inventoryItemId) {
      providerDisplay = `רספייה`;
    } else {
      providerDisplay = `${item.provider} (ספק חיצוני)`;
    }
    
    tableRows += `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #000000;">${item.name}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; color: #000000;">${item.serialNumber || ''}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #000000;">${providerDisplay}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; color: #000000;">${item.quantity}</td>
      </tr>
    `;
  });

  return `
    <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; color: #000000;">
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px; color: #000000; font-weight: bold;">טופס השאלת ציוד -1008</h1>
      
      <div style="margin-bottom: 20px; color: #000000;">
        <p style="color: #000000;"><strong>שם:</strong> ${soldier.name}</p>
        <p style="color: #000000;"><strong>מ.א:</strong> ${soldier.personalId}</p>
        <p style="color: #000000;"><strong>מסגרת:</strong> ${misgeretName}</p>
        <p style="color: #000000;"><strong>תעסוקה:</strong> ${taasuka.name}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; direction: rtl;">
        <thead>
          <tr style="background-color: #2980b9; color: white;">
            <th style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">שם פריט</th>
            <th style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold;">מס"ד</th>
            <th style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">גורם מספק</th>
            <th style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold;">כמות</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; font-size: 12px; color: #000000;">
        <p style="margin-bottom: 10px; color: #000000;">ציוד זה באחריות המקבל ועליו להחזירו בתום התקופה כשהוא תקין ושלם.</p>
        <p style="color: #000000;">אי החזרת הציוד עלולה לגרור בהשלכות כספיות ומשפטיות.</p>
        <div style="display: flex; justify-content: space-between; margin-top: 30px; color: #000000;">
          <span style="color: #000000;">תאריך: ${new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  `;
};
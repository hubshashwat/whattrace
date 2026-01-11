// exportPdf.js
export function initPdfExport() {
  const exportBtn = document.getElementById('exportPdfBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.innerText = 'GENERATING...';

    try {  
        const { jsPDF } = window.jspdf;  
        const pdf = new jsPDF('p', 'mm', 'a4');  

        const dashboard = document.getElementById('resultsSection');  
        const panels = dashboard.querySelectorAll('.glass-panel, .dashboard-head');  

        let yOffset = 10;  

        for (const panel of panels) {  
          const canvas = await html2canvas(panel, {  
            scale: 2,  
            backgroundColor: '#02040a',  
            useCORS: true  
          });  

          const imgData = canvas.toDataURL('image/png');  
          const imgWidth = 210; // A4 width  
          const imgHeight = (canvas.height * imgWidth) / canvas.width;  

          if (yOffset + imgHeight > 297) {  
            pdf.addPage();  
            yOffset = 10;  
          }  

          pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);  
          yOffset += imgHeight + 8;  
        }  

        pdf.save('WhatTrace_Analytics_Report.pdf');  
    } catch (error) {  
      console.error('Failed to generate PDF:', error);  
    } finally {  
      exportBtn.disabled = false;  
      exportBtn.innerText = '⬇ EXPORT PDF';  
    }
  });  
}  
}

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportChatToPDF = async (conversationName: string, messages: any[]) => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF();
    
    // Set up the document
    pdf.setFontSize(20);
    pdf.text(conversationName, 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Exported on: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add a line separator
    pdf.line(20, 35, 190, 35);
    
    let yPosition = 45;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    
    messages.forEach((message, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Add message header
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${message.role.toUpperCase()} - ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += lineHeight;
      
      // Add message content
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      // Clean and split long messages into multiple lines
      const cleanContent = message.content
        .replace(/\*\*/g, '') // Remove ** bold markers
        .replace(/\*/g, '') // Remove * italic markers
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet points
        .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
        .trim();

      const maxWidth = 170;
      const lines = cleanContent.split('\n');
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach((word: string) => {
          const testLine = currentLine + word + ' ';
          const testWidth = pdf.getTextWidth(testLine);
          
          if (testWidth > maxWidth && currentLine !== '') {
            pdf.text(currentLine, margin, yPosition);
            yPosition += lineHeight;
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          pdf.text(currentLine, margin, yPosition);
          yPosition += lineHeight;
        }
      });
      
      // Add space between messages
      yPosition += lineHeight;
    });
    
    // Save the PDF
    pdf.save(`${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat_export.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export chat to PDF');
  }
};

export const exportAllChatsToPDF = async (conversations: any[]) => {
  try {
    const pdf = new jsPDF();
    
    // Title page
    pdf.setFontSize(24);
    pdf.text('Chit Chat - All Conversations', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Exported on: ${new Date().toLocaleString()}`, 20, 40);
    pdf.text(`Total Conversations: ${conversations.length}`, 20, 50);
    
    pdf.line(20, 55, 190, 55);
    
    let yPosition = 70;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    
    conversations.forEach((conversation, convIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Conversation header
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Conversation ${convIndex + 1}: ${conversation.name}`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Created: ${new Date(conversation.createdAt).toLocaleString()}`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      // Messages
      conversation.chats.forEach((message: any) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Message header
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${message.role.toUpperCase()}`, margin, yPosition);
        yPosition += lineHeight;
        
        // Message content
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        
        const maxWidth = 170;
        const words = message.content.split(' ');
        let line = '';
        
        words.forEach((word: string) => {
          const testLine = line + word + ' ';
          const testWidth = pdf.getTextWidth(testLine);
          
          if (testWidth > maxWidth && line !== '') {
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight;
            line = word + ' ';
          } else {
            line = testLine;
          }
        });
        
        if (line) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight;
      });
      
      // Add space between conversations
      yPosition += lineHeight * 2;
    });
    
    pdf.save('chit_chat_all_conversations_export.pdf');
    return true;
  } catch (error) {
    console.error('Error exporting all chats to PDF:', error);
    throw new Error('Failed to export all chats to PDF');
  }
};

import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class PdfMonkeyService {

  private apiUrl = 'https://api.pdfmonkey.io/v1/documents';
  private apiKey = 'bRzrMx1xbAqQQvnvxWMy';  // Sustituye con tu API key de PDFMonkey

  constructor() { }

  async generateInvoicePDF(invoiceData: any) {
    try {
      // Aquí configuras los datos que van a reemplazar la plantilla de PDFMonkey
      const response = await axios.post(
        this.apiUrl,
        {
          template: 'tu-template-id', // Sustituye con el ID de tu plantilla en PDFMonkey
          data: {
            invoice_number: invoiceData.invoiceNumber,
            invoice_date: invoiceData.invoiceDate,
            client_code: invoiceData.clientCode,
            client_name: invoiceData.clientName,
            client_email: invoiceData.clientEmail,
            line_items: invoiceData.lineItems,
            total_without_vat: invoiceData.totalWithoutVat,
            deposit: invoiceData.deposit || 0,
            due_date: invoiceData.dueDate
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      // Descargar el PDF generado
      const pdfUrl = response.data.url;  // URL del PDF generado
      await this.sendPDFToWhatsApp(pdfUrl, invoiceData.clientPhoneNumber);  // Enviar el PDF a WhatsApp

    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  }

  async sendPDFToWhatsApp(pdfUrl: string, phoneNumber: string) {
    try {
      const data = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "document",
        document: {
          link: pdfUrl,
          filename: "factura.pdf"
        }
      };

      const tokenDeAcceso = 'EAAcMB0dgxPoBO2CD9ePD9fjowZCqiqgV3vp4uSFIJs4TEh4WphgZAHSYGlRqY8BPam7jG1ZBuhS1NpNgy5iVwV02oZCUiKDrUrrA4K4BMhPVSMdUZCBaXnzZA0gZC3uPu3Grv8TyHR59ZBwGyqVinh10Icr9cqEPixpNsTwauUMJZB1RAhi8q7XgWQZAxWt7mKiKzMGzJp0RRZAN8GLA0RmKUHlR274miqZB8lsHZCxoZD';

      const response = await fetch(`https://graph.facebook.com/v22.0/588353174356306/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenDeAcceso}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error al enviar el mensaje: ${errorResponse.error.message}`);
      }

      const result = await response.json();
      console.log("Mensaje enviado con éxito:", result);
    } catch (error) {
      console.error('Error al enviar el PDF a WhatsApp:', error);
    }
  }
}

import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class PdfMonkeyService {

  private backendUrl = 'https://tu-nombre-de-aplicacion.herokuapp.com'; // URL de tu backend en Heroku

  constructor() { }

  async generateInvoicePDF(invoiceData: any) {
    try {
      const response = await axios.post(`${this.backendUrl}/generate-pdf`, invoiceData);
      console.log('PDF generado y almacenado con éxito:', response.data);
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

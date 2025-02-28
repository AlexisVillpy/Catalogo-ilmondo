import { Component } from '@angular/core';
import { ListaService } from '../lista.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import axios from 'axios'; // Importar axios
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lista',
  standalone: true,
  templateUrl: './lista.component.html',
  styleUrls: ['./lista.component.css'],
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
})
export class ListaComponent {
  productosEnLista: any[] = [];
  isLoading: boolean = true;
  showClientForm: boolean = false;
  clientData = { firstName: '', lastName: '', email: '', sucursal: '', phoneNumber: '' }; // Datos del cliente

  constructor(private listaService: ListaService, private http: HttpClient) {}

  ngOnInit() {
    this.productosEnLista = this.listaService.obtenerLista();
    this.productosEnLista.forEach((producto) => {
      if (!producto.cantidad || producto.cantidad < 1) {
        producto.cantidad = 1;
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  // Mostrar el formulario de cliente
  mostrarFormulario() {
    this.showClientForm = true;
  }

  // Cerrar el formulario (cuando se hace clic fuera o en el botón de cancelar)
  cerrarFormulario() {
    this.showClientForm = false;
  }

  // Enviar el formulario y generar el PDF
  onSubmit(clientForm: any): void {
    if (clientForm.valid) {
      this.generarPDF();
    }
  }

  async generarPDF(): Promise<void> {
    try {
      // Función para formatear la fecha en formato dd/mm/yyyy
      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0'); // Asegura que el día tenga dos dígitos
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Asegura que el mes tenga dos dígitos
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
  
      // Obtener el número incremental (si no existe, inicializarlo en 1)
      let invoiceNumber = parseInt(localStorage.getItem('invoiceNumber') || '0', 10);
      invoiceNumber += 1; // Incrementar el número
      localStorage.setItem('invoiceNumber', invoiceNumber.toString()); // Guardar el número actualizado
  
      // Calcular el total global
      const totalGlobal = Math.round(
        this.productosEnLista.reduce((total, producto) => {
          const precio = parseFloat(producto.precio) || 0;
          const cantidad = parseInt(producto.cantidad, 10) || 0;
          return total + precio * cantidad;
        }, 0)
      );
  
      // Función para formatear precios con puntos como separador de miles
      const formatPrice = (price: number): string => {
        return price.toLocaleString('es-ES'); // Muestra el separador de miles como punto.
      };
  
      // Preparar datos para la factura
      const invoiceData = {
        clientName: `${this.clientData.firstName} ${this.clientData.lastName}`,
        clientEmail: this.clientData.email,
        clientSucursal: this.clientData.sucursal, // Aquí se agrega la sucursal
        orderDate: formatDate(new Date()),
        products: this.productosEnLista.map((producto) => ({
          name: producto.nombre,
          quantity: parseInt(producto.cantidad, 10) || 0,
          unitPrice: parseFloat(producto.precio) || 0, // Sin formatear
          formattedUnitPrice: formatPrice(parseFloat(producto.precio) || 0), // Formateado con puntos
          total: formatPrice(
            (parseFloat(producto.precio) || 0) *
              (parseInt(producto.cantidad, 10) || 0)
          ), // Total también formateado
        })),
        invoiceNumber: invoiceNumber.toString().padStart(5, '0'),
        total_without_vat: formatPrice(totalGlobal), // Formatear el total global
      };
  
      // Solicitud a la API de PDFMonkey para generar el documento
      const response = await axios.post(
        'https://api.pdfmonkey.io/api/v1/documents',
        {
          document: {
            document_template_id: '943E4342-96CD-4492-AFD1-7709D450A7DC',
            status: 'pending',
            payload: invoiceData,
            meta: {
              _filename: `${invoiceData.orderDate} ${invoiceData.clientName} ${invoiceData.invoiceNumber}.pdf`,
              clientRef: 'cliente-123',
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer bRzrMx1xbAqQQvnvxWMy`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const documentId = response.data?.document?.id;
      if (documentId) {
        let attempts = 0;
        const maxAttempts = 10;
  
        const checkPdfStatus = async () => {
          if (attempts >= maxAttempts) {
            console.error('El PDF no está listo después de varios intentos.');
            return;
          }
  
          const statusResponse = await axios.get(
            `https://api.pdfmonkey.io/api/v1/documents/${documentId}`,
            {
              headers: {
                Authorization: `Bearer bRzrMx1xbAqQQvnvxWMy`,
              },
            }
          );
  
          const documentStatus = statusResponse.data?.document?.status;
          if (documentStatus === 'success') {
            const pdfUrl = statusResponse.data?.document?.download_url;
            if (pdfUrl) {
              // Enviar el PDF a WhatsApp Business
              await this.enviarPDFaWhatsApp(pdfUrl);
            } else {
              console.error('No se encontró la URL de descarga del PDF.');
            }
          } else if (documentStatus === 'failure') {
            const failureCause = statusResponse.data?.document?.failure_cause;
            console.error('Error en la generación del PDF:', failureCause);
          } else {
            attempts++;
            console.log(
              `Intento ${attempts}: El PDF aún no está listo. Verificando de nuevo...`
            );
            setTimeout(checkPdfStatus, 2000);
          }
        };
  
        checkPdfStatus();
      } else {
        console.error(
          'No se encontró el ID del documento en la respuesta:',
          response
        );
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  }

  async enviarPDFaWhatsApp(pdfUrl: string): Promise<void> {
    try {
      let telefonoDestino = '';
      if (this.clientData.sucursal === 'CDE') {
        telefonoDestino = '595975550907';
      } else if (this.clientData.sucursal === 'Asuncion') {
        telefonoDestino = '595XXXXXXXXX'; // Reemplaza con el número de teléfono de Asunción
      }

      if (!telefonoDestino) {
        throw new Error('El número de teléfono es requerido.');
      }

      const message = `Hola ${this.clientData.firstName}, adjunto encontrarás tu factura: ${pdfUrl}`;
  
      // Estructura del mensaje para enviar a la API de WhatsApp
      const data = {
        messaging_product: "whatsapp",
        to: telefonoDestino,
        type: "document",
        document: {
          link: pdfUrl,
          filename: "factura.pdf"
        }
      };
  
      const tokenDeAcceso = 'EAAcMB0dgxPoBO2CD9ePD9fjowZCqiqgV3vp4uSFIJs4TEh4WphgZAHSYGlRqY8BPam7jG1ZBuhS1NpNgy5iVwV02oZCUiKDrUrrA4K4BMhPVSMdUZCBaXnzZA0gZC3uPu3Grv8TyHR59ZBwGyqVinh10Icr9cqEPixpNsTwauUMJZB1RAhi8q7XgWQZAxWt7mKiKzMGzJp0RRZAN8GLA0RmKUHlR274miqZB8lsHZCxoZD';
  
      // Enviar la solicitud POST a la API de WhatsApp
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
  
  eliminarProducto(producto: any): void {
    this.listaService.eliminarProducto(producto);
    this.productosEnLista = this.listaService.obtenerLista();
  }

  sumarCantidad(producto: any): void {
    producto.cantidad = (producto.cantidad || 1) + 1;
    this.listaService.actualizarCantidad(producto.nombre, producto.cantidad); // Guardar cambios
  }

  restarCantidad(producto: any): void {
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.listaService.actualizarCantidad(producto.nombre, producto.cantidad); // Guardar cambios
    }
  }

  validarCantidad(producto: any): void {
    if (producto.cantidad < 1 || isNaN(producto.cantidad)) {
      producto.cantidad = 1;
    }
    this.listaService.actualizarCantidad(producto.nombre, producto.cantidad); // Guardar cambios
  }
}

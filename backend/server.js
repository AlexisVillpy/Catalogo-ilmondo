const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.post('/generate-pdf', async (req, res) => {
  const invoiceData = req.body;

  try {
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
            // Descargar el PDF y guardarlo en el servidor
            const pdfResponse = await axios.get(pdfUrl, { responseType: 'stream' });
            const pdfPath = path.join(__dirname, 'pdfs', `${invoiceData.invoiceNumber}.pdf`);
            pdfResponse.data.pipe(fs.createWriteStream(pdfPath));

            res.json({ message: 'PDF generado y almacenado con éxito', pdfPath });
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
      console.error('No se encontró el ID del documento en la respuesta:', response);
    }
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

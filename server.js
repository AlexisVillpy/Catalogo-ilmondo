const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const data = req.body;

  // Manejar la respuesta del webhook aquí
  console.log('Webhook recibido:', data);

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

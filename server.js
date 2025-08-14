// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS: en desarrollo puedes usar '*', en prod pon tu dominio o app
app.use(cors({ origin: '*', methods: ['POST', 'GET'] }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY;

// Healthcheck
app.get('/health', (_, res) => res.send('ok'));

// Seguridad básica: valida API key
if (!API_KEY) {
  console.warn('Falta GEMINI_API_KEY en variables de entorno');
}

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ response: 'Prompt inválido o no enviado.' });
  }

  const systemPrompt = `
    Eres un asesor experto en finanzas personales.
    Brindas información clara, relevante y precisa sobre ahorro, inversión, presupuesto, economía, educación financiera y finanzas personales en general.
    Si te preguntan algo fuera de finanzas, responde amablemente que solo puedes ayudar en temas financieros.
    Responde siempre en español.
  `;
  const inputPrompt = `${systemPrompt.trim()}\nUsuario: ${prompt}`;

  // Endpoint de Gemini
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await axios.post(
      apiUrl,
      { contents: [{ parts: [{ text: inputPrompt }] }] },
      { timeout: 30000 } // 30s
    );

    const candidates = response.data?.candidates;
    const botResponseText =
      candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener respuesta de la IA.';

    res.json({ response: botResponseText });
  } catch (error) {
    if (error.response) {
      console.error('Error IA:', error.response.data);
    } else {
      console.error('Error IA:', error.message);
    }
    res.status(500).json({
      response: 'Lo siento, tuve un problema técnico. ¿Podrías intentarlo de nuevo?',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

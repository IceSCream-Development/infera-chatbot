// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;
const API_KEY = process.env.GEMINI_API_KEY; // Tu API KEY se lee del archivo .env

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  // Aquí defines el rol experto
  const systemPrompt = `
    Eres un asesor experto en finanzas personales.
    Brindas información clara, relevante y precisa sobre ahorro, inversión, presupuesto, economía, educación financiera y finanzas personales en general.
    Si te preguntan algo fuera de finanzas, responde amablemente que solo puedes ayudar en temas financieros.
    Responde siempre en español.
  `;
  const inputPrompt = `${systemPrompt.trim()}\nUsuario: ${prompt}`;

  // Verifica que llega un prompt
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      response: "Prompt inválido o no enviado.",
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    // Llamada a Gemini
    const response = await axios.post(apiUrl, {
      contents: [{ parts: [{ text: inputPrompt }] }],
    });

    // Logging de la respuesta raw
    console.log('Respuesta raw Gemini:', response.data);

    // Obtiene el texto de la IA (seguro)
    const candidates = response.data.candidates;
    let botResponseText = "No se pudo obtener respuesta de la IA.";
    if (
      Array.isArray(candidates) &&
      candidates[0] &&
      candidates[0].content &&
      candidates[0].content.parts &&
      candidates[0].content.parts[0] &&
      candidates[0].content.parts[0].text
    ) {
      botResponseText = candidates[0].content.parts[0].text;
    }

    res.json({
      response: botResponseText,
    });

  } catch (error) {
    // Logging detallado de error
    if (error.response) {
      console.error('Error IA:', error.response.data);
    } else {
      console.error('Error IA:', error.message);
    }
    res.status(500).json({
      response: "Lo siento, tuve un problema técnico. ¿Podrías intentarlo de nuevo?",
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor intermediario corriendo en http://localhost:${PORT}`);
});

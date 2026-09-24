import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "public")));

  // Gemini AI endpoint for generating Proyecto PRESENTE social activities
  app.post("/api/gemini/suggest-activities", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Clave de API de Gemini no configurada.",
          details: "Por favor, configure GEMINI_API_KEY en las variables de entorno."
        });
      }

      const { areaName, areaCategory, groupName, shift, durationMinutes } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Eres un asesor pedagógico especialista en el 'Proyecto PRESENTE' del Sistema de Educación Media Superior (SEMS) de la Universidad de Guadalajara (UdeG), implementado en la Preparatoria Regional de Chapala.

El 'Proyecto PRESENTE' busca regular el uso de dispositivos móviles y pantallas dentro del aula fomentando espacios de convivencia cara a cara, socialización activa, integración grupal y juego recreativo durante recesos o momentos de pausa activa.

Por favor genera 3 dinámicas de convivencia específicas sin pantallas para:
- Área: "${areaName || 'Área de Convivencia'}" (Categoría: ${areaCategory || 'Recreativa'})
- Grupo participante: ${groupName || 'Grupo de Preparatoria'} (${shift === 'matutino' ? 'Turno Matutino' : 'Turno Vespertino'})
- Tiempo estimado disponible: ${durationMinutes || 20} minutos.

Instrucciones:
1. Responde exclusivamente en formato JSON válido estructurado como un arreglo de objetos.
2. Cada objeto debe tener los campos:
   - "title": Nombre atractivo y dinámico del juego o actividad
   - "category": Tipo de actividad (ej. 'Juego de Integración', 'Reto Deportivo', 'Cultura/Arte', 'Juego de Mesa / Estrategia', 'Diálogo / Rompehielos')
   - "description": Explicación clara en 2 o 3 oraciones de cómo jugarlo o realizarlo sin dispositivos.
   - "materialsNeeded": Materiales simples requeridos (o 'Ninguno' si es a voz/cuerpo).
   - "keyBenefit": Beneficio en convivencia (ej. 'Fomenta el trabajo en equipo', 'Promueve el diálogo cara a cara').

Devuelve ÚNICAMENTE el código JSON sin bloques markdown markdown triples como \`\`\`json si es posible, o un JSON limpio.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const responseText = response.text || "[]";
      let activities = [];
      try {
        activities = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback cleanup if model wrapped JSON in text
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        activities = JSON.parse(cleaned);
      }

      return res.json({ activities });
    } catch (error: any) {
      console.error("Error generating activities with Gemini:", error);
      return res.status(500).json({
        error: "No se pudieron generar las dinámicas en este momento.",
        details: error.message || String(error)
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "PRESENTE Chapala UdeG" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Proyecto PRESENTE iniciado en puerto ${PORT}`);
  });
}

startServer();

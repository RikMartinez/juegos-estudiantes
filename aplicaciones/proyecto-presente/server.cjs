var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(import_express.default.json());
  app.use(import_express.default.static(import_path.default.join(process.cwd(), "public")));
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
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const prompt = `
Eres un asesor pedag\xF3gico especialista en el 'Proyecto PRESENTE' del Sistema de Educaci\xF3n Media Superior (SEMS) de la Universidad de Guadalajara (UdeG), implementado en la Preparatoria Regional de Chapala.

El 'Proyecto PRESENTE' busca regular el uso de dispositivos m\xF3viles y pantallas dentro del aula fomentando espacios de convivencia cara a cara, socializaci\xF3n activa, integraci\xF3n grupal y juego recreativo durante recesos o momentos de pausa activa.

Por favor genera 3 din\xE1micas de convivencia espec\xEDficas sin pantallas para:
- \xC1rea: "${areaName || "\xC1rea de Convivencia"}" (Categor\xEDa: ${areaCategory || "Recreativa"})
- Grupo participante: ${groupName || "Grupo de Preparatoria"} (${shift === "matutino" ? "Turno Matutino" : "Turno Vespertino"})
- Tiempo estimado disponible: ${durationMinutes || 20} minutos.

Instrucciones:
1. Responde exclusivamente en formato JSON v\xE1lido estructurado como un arreglo de objetos.
2. Cada objeto debe tener los campos:
   - "title": Nombre atractivo y din\xE1mico del juego o actividad
   - "category": Tipo de actividad (ej. 'Juego de Integraci\xF3n', 'Reto Deportivo', 'Cultura/Arte', 'Juego de Mesa / Estrategia', 'Di\xE1logo / Rompehielos')
   - "description": Explicaci\xF3n clara en 2 o 3 oraciones de c\xF3mo jugarlo o realizarlo sin dispositivos.
   - "materialsNeeded": Materiales simples requeridos (o 'Ninguno' si es a voz/cuerpo).
   - "keyBenefit": Beneficio en convivencia (ej. 'Fomenta el trabajo en equipo', 'Promueve el di\xE1logo cara a cara').

Devuelve \xDANICAMENTE el c\xF3digo JSON sin bloques markdown markdown triples como \`\`\`json si es posible, o un JSON limpio.
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const responseText = response.text || "[]";
      let activities = [];
      try {
        activities = JSON.parse(responseText);
      } catch (parseError) {
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        activities = JSON.parse(cleaned);
      }
      return res.json({ activities });
    } catch (error) {
      console.error("Error generating activities with Gemini:", error);
      return res.status(500).json({
        error: "No se pudieron generar las din\xE1micas en este momento.",
        details: error.message || String(error)
      });
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "PRESENTE Chapala UdeG" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Proyecto PRESENTE iniciado en puerto ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

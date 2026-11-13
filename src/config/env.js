// Archivo de configuracion general del servidor (puerto, clave JWT y ruta de la base de datos).
// Si no existe un archivo .env, usa valores por defecto para que el proyecto funcione de inmediato.

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");

// configuracion base con valores por defecto seguros para ejecucion inmediata
export const ENV = {
  PORT: Number(process.env.PORT) || 3001,
  JWT_SECRET: process.env.JWT_SECRET || "cc_analytics_clave_secreta_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  DB_PATH: path.join(ROOT_DIR, process.env.DB_FILE || "cc_analytics.db"),
};

// archivo principal que levanta el servidor backend de cc analytics.
// configura express y cors, inicia sqlite con datos base, expone /api/health y conecta las rutas de la api.

import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { initDb, queryOne } from "./database/db.js";
import { seedIfEmpty } from "./database/seed.js";
import authRoutes from "./routes/authRoutes.js";
import jugadoresRoutes from "./routes/jugadoresRoutes.js";
import { listarJugadoresV2, eliminarDirectriz } from "./controllers/jugadoresController.js";
import { verificarToken, autorizarRoles } from "./middlewares/authMiddleware.js";

const app = express();

// middlewares globales
app.use(cors());
app.use(express.json());

// ruta publica de verificacion de estado y base de datos
app.get("/api/health", (req, res) => {
  const usuarios = queryOne("SELECT COUNT(*) AS total FROM usuarios")?.total || 0;
  const jugadores = queryOne("SELECT COUNT(*) AS total FROM jugadores")?.total || 0;
  const partidos = queryOne("SELECT COUNT(*) AS total FROM partidos")?.total || 0;

  res.json({
    ok: true,
    servicio: "CC Analytics API REST",
    version: "v1",
    baseDeDatos: {
      motor: "SQLite (sql.js)",
      usuarios,
      jugadores,
      partidos,
    },
  });
});

// rutas de la version 1 y version 2 de la api
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jugadores", jugadoresRoutes);
app.delete("/api/v1/directrices/:id", verificarToken, autorizarRoles("ADMIN", "CUERPO_TECNICO"), eliminarDirectriz);
app.get("/api/v2/jugadores", verificarToken, listarJugadoresV2);

// arranque ordenado: inicializar sqlite, poblar si esta vacio y levantar servidor
async function iniciarServidor() {
  try {
    await initDb();
    const poblado = await seedIfEmpty(false);
    if (poblado) {
      console.log("Seed inicial ejecutado en cc_analytics.db");
    }

    app.listen(ENV.PORT, () => {
      console.log(`Servidor CC Analytics corriendo en http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();

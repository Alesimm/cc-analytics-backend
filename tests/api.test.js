// suite de pruebas automatizadas del backend usando el runner nativo node:test.
// usa una base de datos aislada (cc_analytics.test.db) para nunca alterar la base real de trabajo.

import fs from "node:fs";
import path from "node:path";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

const ARCHIVO_BD_TEST = "cc_analytics.test.db";
process.env.DB_FILE = ARCHIVO_BD_TEST;

const PUERTO_TEST = 3099;
const BASE = `http://localhost:${PUERTO_TEST}`;

let server;
let tokenAdmin;
let tokenTecnico;
let tokenAnalista;

// helper corto para hacer peticiones json al servidor de prueba
async function peticion(ruta, metodo = "GET", token = null, body = null) {
  const res = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== null ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== null ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  });

  const esJson = (res.headers.get("content-type") || "").includes("application/json");
  const datos = esJson ? await res.json() : await res.text();
  return { status: res.status, datos };
}

describe("CC Analytics Backend — API REST, JWT, RBAC y Swagger", () => {
  before(async () => {
    const { iniciarServidor } = await import("../src/index.js");
    server = await iniciarServidor(PUERTO_TEST);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(path.resolve(ARCHIVO_BD_TEST), { force: true });
  });

  it("1. responde 200 en /api/health y expone Swagger en /api-docs y /api-docs.json", async () => {
    const health = await peticion("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.datos.ok, true);
    assert.equal(health.datos.baseDeDatos.usuarios, 3);

    const spec = await peticion("/api-docs.json");
    assert.equal(spec.status, 200);
    assert.equal(spec.datos.openapi, "3.0.0");

    const ui = await peticion("/api-docs/");
    assert.equal(ui.status, 200);
  });

  it("2. autentica los 3 roles con JWT, valida /me y rechaza credenciales invalidas", async () => {
    const rAdmin = await peticion("/api/v1/auth/login", "POST", null, { correo: "admin@colocolo.cl", password: "colo2026" });
    assert.equal(rAdmin.status, 200);
    assert.equal(rAdmin.datos.usuario.rol, "ADMIN");
    tokenAdmin = rAdmin.datos.token;

    const rTec = await peticion("/api/v1/auth/login", "POST", null, { correo: "tecnico@colocolo.cl", password: "tecnico2026" });
    assert.equal(rTec.status, 200);
    assert.equal(rTec.datos.usuario.rol, "CUERPO_TECNICO");
    tokenTecnico = rTec.datos.token;

    const rAna = await peticion("/api/v1/auth/login", "POST", null, { correo: "consulta@colocolo.cl", password: "consulta2026" });
    assert.equal(rAna.status, 200);
    assert.equal(rAna.datos.usuario.rol, "ANALISTA_LECTURA");
    tokenAnalista = rAna.datos.token;

    const rMalo = await peticion("/api/v1/auth/login", "POST", null, { correo: "admin@colocolo.cl", password: "incorrecta" });
    assert.equal(rMalo.status, 401);

    const rMe = await peticion("/api/v1/auth/me", "GET", tokenAdmin);
    assert.equal(rMe.status, 200);
    assert.equal(rMe.datos.usuario.correo, "admin@colocolo.cl");

    const rMeSinToken = await peticion("/api/v1/auth/me", "GET");
    assert.equal(rMeSinToken.status, 401);
  });

  it("3. gestiona jugadores en /v1 y /v2 y respeta restricciones por rol", async () => {
    const v1 = await peticion("/api/v1/jugadores", "GET", tokenAnalista);
    assert.equal(v1.status, 200);
    assert.equal(v1.datos.total, 15);

    const v2 = await peticion("/api/v2/jugadores", "GET", tokenAnalista);
    assert.equal(v2.status, 200);
    const vidal = v2.datos.jugadores.find((j) => j.id === "jug-8");
    assert.ok(Array.isArray(vidal.directrices));

    const prohibido = await peticion("/api/v1/jugadores", "POST", tokenTecnico, {
      nombre: "Prueba",
      dorsal: 99,
      posicion: "Delantero",
      edad: 21,
      altura: "1.80 m",
      pie: "Derecho",
      rol: "Reserva",
      estado: "Disponible",
    });
    assert.equal(prohibido.status, 403);

    const creado = await peticion("/api/v1/jugadores", "POST", tokenAdmin, {
      nombre: "Juvenal Test",
      dorsal: 99,
      posicion: "Delantero",
      edad: 21,
      altura: "1.80 m",
      pie: "Derecho",
      rol: "Reserva",
      estado: "Disponible",
    });
    assert.equal(creado.status, 201);
    const idJug = creado.datos.jugador.id;

    const borrado = await peticion(`/api/v1/jugadores/${idJug}`, "DELETE", tokenAdmin);
    assert.equal(borrado.status, 200);
  });

  it("4. aplica permisos clinicos en /api/v1/medico y tacticos en /api/v1/formaciones", async () => {
    const medAnalista = await peticion("/api/v1/medico", "GET", tokenAnalista);
    assert.equal(medAnalista.status, 403);

    const medTecnico = await peticion("/api/v1/medico", "GET", tokenTecnico);
    assert.equal(medTecnico.status, 200);

    const formCreada = await peticion("/api/v1/formaciones", "POST", tokenTecnico, {
      nombre: "4-1-4-1 Test",
      descripcion: "Esquema de prueba",
    });
    assert.equal(formCreada.status, 201);
    const idForm = formCreada.datos.formacion.id;

    const borrarTec = await peticion(`/api/v1/formaciones/${idForm}`, "DELETE", tokenTecnico);
    assert.equal(borrarTec.status, 403);

    const borrarAdmin = await peticion(`/api/v1/formaciones/${idForm}`, "DELETE", tokenAdmin);
    assert.equal(borrarAdmin.status, 200);
  });

  it("5. valida calendario y ciclo completo de soporte (filtros, creacion, cambio de estado y borrado)", async () => {
    const part = await peticion("/api/v1/partidos?tipo=proximo", "GET", tokenAnalista);
    assert.equal(part.status, 200);
    assert.equal(part.datos.total, 4);

    const filtroOk = await peticion("/api/v1/soporte?estado=Abierto", "GET", tokenAnalista);
    assert.equal(filtroOk.status, 200);
    assert.equal(filtroOk.datos.total, 2);

    const filtroMalo = await peticion("/api/v1/soporte?estado=Invalido", "GET", tokenAnalista);
    assert.equal(filtroMalo.status, 400);

    const tkInvalido = await peticion("/api/v1/soporte", "POST", tokenAnalista, {
      nombreSolicitante: "Al",
      email: "sin-arroba",
      asunto: "Corto",
      descripcion: "Muy corto",
    });
    assert.equal(tkInvalido.status, 400);

    const tk = await peticion("/api/v1/soporte", "POST", tokenAnalista, {
      nombreSolicitante: "Nicolás Córdova",
      email: "consulta@colocolo.cl",
      asunto: "Prueba automatica",
      descripcion: "Ticket generado desde la suite de pruebas del backend.",
    });
    assert.equal(tk.status, 201);
    const idTk = tk.datos.ticket.id;

    const patchAna = await peticion(`/api/v1/soporte/${idTk}/estado`, "PATCH", tokenAnalista, { estado: "Resuelto" });
    assert.equal(patchAna.status, 403);

    const patchAdmin = await peticion(`/api/v1/soporte/${idTk}/estado`, "PATCH", tokenAdmin, { estado: "Resuelto" });
    assert.equal(patchAdmin.status, 200);
    assert.equal(patchAdmin.datos.ticket.estado, "Resuelto");

    const borrarAna = await peticion(`/api/v1/soporte/${idTk}`, "DELETE", tokenAnalista);
    assert.equal(borrarAna.status, 403);

    const borrarAdmin = await peticion(`/api/v1/soporte/${idTk}`, "DELETE", tokenAdmin);
    assert.equal(borrarAdmin.status, 200);
  });

  it("6. devuelve 404 en JSON para rutas inexistentes y 400 para JSON malformado", async () => {
    const noExiste = await peticion("/api/v1/ruta-falsa");
    assert.equal(noExiste.status, 404);
    assert.equal(noExiste.datos.ok, false);

    const jsonMalo = await peticion("/api/v1/jugadores", "POST", tokenAdmin, "{json-roto");
    assert.equal(jsonMalo.status, 400);
    assert.equal(jsonMalo.datos.ok, false);
  });
});

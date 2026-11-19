// configuracion de swagger (openapi 3.0) para documentar y probar todos los endpoints en /api-docs.
// incluye el boton authorize para pegar el token jwt y ejemplos listos para probar en vivo.

const seguridadJwt = [{ bearerAuth: [] }];

// respuestas comunes para no repetir el mismo bloque en cada ruta
const resp401 = { description: "Falta el token o es invalido (401)" };
const resp403 = { description: "El rol del usuario no tiene permiso (403)" };
const resp404 = { description: "Recurso no encontrado (404)" };

// helper simple para definir un body json con ejemplo en swagger
function bodyJson(ejemplo) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { type: "object", example: ejemplo },
      },
    },
  };
}

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "CC Analytics — API REST (Colo-Colo)",
    version: "1.0.0",
    description:
      "API RESTful oficial de CC Analytics (Evaluacion Parcial 3 - Duoc UC). " +
      "Credenciales de prueba: admin@colocolo.cl / colo2026 (ADMIN), " +
      "tecnico@colocolo.cl / tecnico26 (CUERPO_TECNICO), " +
      "consulta@colocolo.cl / consulta26 (ANALISTA_LECTURA).",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Servidor local de desarrollo",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Pega aqui el token devuelto por POST /api/v1/auth/login",
      },
    },
  },
  tags: [
    { name: "Sistema", description: "Estado del servidor y conexion a SQLite" },
    { name: "Autenticacion", description: "Inicio de sesion JWT y perfil activo (/me)" },
    { name: "Jugadores (v1 y v2)", description: "Gestion del plantel profesional y vista enriquecida v2" },
    { name: "Directrices", description: "Indicaciones tacticas individuales de rendimiento" },
    { name: "Formaciones", description: "Esquemas tacticos de la pizarra" },
    { name: "Centro Medico", description: "Fichas clinicas, lesiones y altas medicas" },
    { name: "Partidos", description: "Calendario oficial, proximo encuentro y resultados" },
    { name: "Soporte", description: "Mesa de ayuda y tickets tecnicos" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Sistema"],
        summary: "Verifica el estado del servidor y conteo base de SQLite (publica)",
        responses: {
          200: { description: "Servidor operativo (200)" },
        },
      },
    },

    "/api/v1/auth/login": {
      post: {
        tags: ["Autenticacion"],
        summary: "Inicia sesion y devuelve el token JWT junto al usuario y su rol (publica)",
        requestBody: bodyJson({
          correo: "admin@colocolo.cl",
          password: "colo2026",
        }),
        responses: {
          200: { description: "Credenciales validas, entrega token JWT (200)" },
          400: { description: "Faltan datos de correo o contraseña (400)" },
          401: { description: "Correo o contraseña incorrectos (401)" },
        },
      },
    },

    "/api/v1/auth/me": {
      get: {
        tags: ["Autenticacion"],
        summary: "Devuelve el usuario dueño del token activo para mantener la sesion con F5",
        security: seguridadJwt,
        responses: {
          200: { description: "Sesion valida (200)" },
          401: resp401,
        },
      },
    },

    "/api/v1/jugadores": {
      get: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Lista los jugadores del plantel ordenados por dorsal (todos los roles)",
        security: seguridadJwt,
        responses: {
          200: { description: "Lista de jugadores v1 (200)" },
          401: resp401,
        },
      },
      post: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Ficha un nuevo jugador en el plantel (solo ADMIN)",
        security: seguridadJwt,
        requestBody: bodyJson({
          nombre: "Claudio Aquino",
          dorsal: 10,
          posicion: "Mediocampista",
          edad: 33,
          altura: "1.72 m",
          pie: "Derecho",
          rol: "Titular",
          estado: "Disponible",
          partidos: 5,
        }),
        responses: {
          201: { description: "Jugador creado (201)" },
          400: { description: "Datos invalidos o dorsal repetido (400)" },
          401: resp401,
          403: resp403,
        },
      },
    },

    "/api/v2/jugadores": {
      get: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Version 2: entrega jugadores con sus directrices tacticas anidadas y promedio",
        security: seguridadJwt,
        responses: {
          200: { description: "Lista enriquecida de jugadores v2 (200)" },
          401: resp401,
        },
      },
    },

    "/api/v1/jugadores/{id}": {
      get: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Obtiene un jugador por su ID (todos los roles)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "jug-8" } }],
        responses: {
          200: { description: "Jugador encontrado (200)" },
          401: resp401,
          404: resp404,
        },
      },
      put: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Actualiza los datos de un jugador (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "jug-8" } }],
        requestBody: bodyJson({
          estado: "Disponible",
          partidos: 25,
        }),
        responses: {
          200: { description: "Jugador actualizado (200)" },
          400: { description: "Datos invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
      delete: {
        tags: ["Jugadores (v1 y v2)"],
        summary: "Da de baja a un jugador del plantel (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "jug-15" } }],
        responses: {
          200: { description: "Jugador eliminado (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/jugadores/{id}/directrices": {
      get: {
        tags: ["Directrices"],
        summary: "Lista las directrices tacticas de un jugador (todos los roles)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "jug-8" } }],
        responses: {
          200: { description: "Directrices del jugador (200)" },
          401: resp401,
          404: resp404,
        },
      },
      post: {
        tags: ["Directrices"],
        summary: "Registra una nueva directriz tactica para un jugador (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "jug-8" } }],
        requestBody: bodyJson({
          area: "Táctica",
          prioridad: "Alta",
          calificacion: 8.9,
          indicacion: "Romper lineas en conduccion cuando el rival repliegue en bloque bajo.",
        }),
        responses: {
          201: { description: "Directriz creada (201)" },
          400: { description: "Calificacion o campos invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/directrices/{id}": {
      put: {
        tags: ["Directrices"],
        summary: "Actualiza una directriz tactica existente (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "dir-1" } }],
        requestBody: bodyJson({
          area: "Estrategia",
          prioridad: "Alta",
          calificacion: 9.0,
          indicacion: "Ajustar basculacion en bloque medio.",
        }),
        responses: {
          200: { description: "Directriz actualizada (200)" },
          400: { description: "Datos invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
      delete: {
        tags: ["Directrices"],
        summary: "Elimina una directriz tactica (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "dir-1" } }],
        responses: {
          200: { description: "Directriz eliminada (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/formaciones": {
      get: {
        tags: ["Formaciones"],
        summary: "Lista los esquemas tacticos de la pizarra (todos los roles)",
        security: seguridadJwt,
        responses: {
          200: { description: "Lista de formaciones (200)" },
          401: resp401,
        },
      },
      post: {
        tags: ["Formaciones"],
        summary: "Guarda un nuevo esquema tactico en la pizarra (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        requestBody: bodyJson({
          nombre: "4-4-2 Rombo",
          descripcion: "Control de mediocampo con enganche libre y doble punta.",
          alturaBloque: 70,
          anchuraEquipo: 65,
          intensidadPresion: 75,
          ritmoPosesion: 60,
        }),
        responses: {
          201: { description: "Formacion creada (201)" },
          400: { description: "Datos invalidos (400)" },
          401: resp401,
          403: resp403,
        },
      },
    },

    "/api/v1/formaciones/{id}": {
      put: {
        tags: ["Formaciones"],
        summary: "Actualiza parametros o titulares de una formacion (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "4-3-3" } }],
        requestBody: bodyJson({
          alturaBloque: 80,
          intensidadPresion: 85,
        }),
        responses: {
          200: { description: "Formacion actualizada (200)" },
          400: { description: "Ajustes invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
      delete: {
        tags: ["Formaciones"],
        summary: "Elimina una formacion de la pizarra (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "form-demo" } }],
        responses: {
          200: { description: "Formacion eliminada (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/medico": {
      get: {
        tags: ["Centro Medico"],
        summary: "Lista las fichas clinicas del plantel (ADMIN y CUERPO_TECNICO; 403 para ANALISTA)",
        security: seguridadJwt,
        responses: {
          200: { description: "Lista de registros medicos (200)" },
          401: resp401,
          403: resp403,
        },
      },
      post: {
        tags: ["Centro Medico"],
        summary: "Registra una nueva ficha medica y pasa al jugador a recuperacion (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        requestBody: bodyJson({
          jugadorId: "jug-12",
          tipoLesion: "Muscular",
          diagnostico: "Contractura leve en isquiotibial izquierdo",
          gravedad: "Leve",
          diasRecuperacion: 7,
          medicoTratante: "Dr. Roberto Yáñez",
          observaciones: "Reposo deportivo de 48 horas y fisioterapia.",
        }),
        responses: {
          201: { description: "Ficha medica creada (201)" },
          400: { description: "Faltan datos obligatorios (400)" },
          401: resp401,
          403: resp403,
          404: { description: "El jugador indicado no existe (404)" },
        },
      },
    },

    "/api/v1/medico/{id}": {
      put: {
        tags: ["Centro Medico"],
        summary: "Actualiza diagnostico, fase o dias restantes de una ficha (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "med-1" } }],
        requestBody: bodyJson({
          diasRestantes: 3,
          fase: "Reintegro Deportivo",
        }),
        responses: {
          200: { description: "Ficha actualizada (200)" },
          400: { description: "Datos invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
      delete: {
        tags: ["Centro Medico"],
        summary: "Elimina una ficha medica y sincroniza el estado del jugador (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "med-5" } }],
        responses: {
          200: { description: "Ficha eliminada (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/medico/{id}/alta": {
      patch: {
        tags: ["Centro Medico"],
        summary: "Otorga el alta medica inmediata y deja al jugador Disponible (ADMIN y CUERPO_TECNICO)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "med-1" } }],
        responses: {
          200: { description: "Alta medica otorgada (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/partidos": {
      get: {
        tags: ["Partidos"],
        summary: "Lista el calendario de partidos (acepta ?tipo=proximo o ?tipo=anterior)",
        security: seguridadJwt,
        parameters: [
          {
            name: "tipo",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["proximo", "anterior"] },
          },
        ],
        responses: {
          200: { description: "Lista de partidos (200)" },
          401: resp401,
        },
      },
      post: {
        tags: ["Partidos"],
        summary: "Programa un nuevo encuentro en el calendario (solo ADMIN)",
        security: seguridadJwt,
        requestBody: bodyJson({
          rival: "Huachipato",
          condicion: "Local",
          torneo: "Campeonato Nacional",
          fecha: "2026-12-06",
          hora: "18:00",
          estadio: "Estadio Monumental David Arellano",
        }),
        responses: {
          201: { description: "Partido creado (201)" },
          400: { description: "Faltan datos obligatorios (400)" },
          401: resp401,
          403: resp403,
        },
      },
    },

    "/api/v1/partidos/{id}": {
      get: {
        tags: ["Partidos"],
        summary: "Obtiene el detalle y estadisticas de un partido por ID (todos los roles)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "part-ant-1" } }],
        responses: {
          200: { description: "Detalle del partido (200)" },
          401: resp401,
          404: resp404,
        },
      },
      put: {
        tags: ["Partidos"],
        summary: "Actualiza estado, horario o marcador de un partido (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "part-prox-1" } }],
        requestBody: bodyJson({
          estado: "Confirmado",
          hora: "19:00",
        }),
        responses: {
          200: { description: "Partido actualizado (200)" },
          400: { description: "Datos invalidos (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
      delete: {
        tags: ["Partidos"],
        summary: "Elimina un encuentro del calendario (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "part-prox-4" } }],
        responses: {
          200: { description: "Partido eliminado (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/soporte": {
      get: {
        tags: ["Soporte"],
        summary: "Lista los tickets de soporte tecnico (acepta ?estado=Abierto)",
        security: seguridadJwt,
        parameters: [
          {
            name: "estado",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["Abierto", "En Revisión", "Resuelto"] },
          },
        ],
        responses: {
          200: { description: "Lista de tickets (200)" },
          400: { description: "Filtro de estado invalido (400)" },
          401: resp401,
        },
      },
      post: {
        tags: ["Soporte"],
        summary: "Crea un nuevo ticket en la mesa de ayuda (todos los roles autenticados)",
        security: seguridadJwt,
        requestBody: bodyJson({
          nombreSolicitante: "Nicolás Córdova",
          email: "consulta@colocolo.cl",
          departamento: "Scouting",
          categoria: "Métricas & Estadísticas",
          prioridad: "Media",
          asunto: "Solicitud de informe comparativo sub-21",
          descripcion: "Requerimos exportar las metricas de pases progresivos de los juveniles del plantel.",
        }),
        responses: {
          201: { description: "Ticket creado (201)" },
          400: { description: "Validacion fallida en correo o longitudes (400)" },
          401: resp401,
        },
      },
    },

    "/api/v1/soporte/{id}/estado": {
      patch: {
        tags: ["Soporte"],
        summary: "Cambia el estado y respuesta tecnica de un ticket (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "tk-103" } }],
        requestBody: bodyJson({
          estado: "Resuelto",
          respuestaTecnica: "Credenciales habilitadas por administracion deportiva.",
        }),
        responses: {
          200: { description: "Estado del ticket actualizado (200)" },
          400: { description: "Estado invalido (400)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },

    "/api/v1/soporte/{id}": {
      delete: {
        tags: ["Soporte"],
        summary: "Elimina un ticket de soporte (solo ADMIN)",
        security: seguridadJwt,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "tk-104" } }],
        responses: {
          200: { description: "Ticket eliminado (200)" },
          401: resp401,
          403: resp403,
          404: resp404,
        },
      },
    },
  },
};

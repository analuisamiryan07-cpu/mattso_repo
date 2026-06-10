-- SCRIPT MAESTRO UNIFICADO MATSSO

-- >>> INICIO DE 01_matsso_ddl_create.sql <<<
-- =============================================================================
-- MATSSO ECUADOR - BASE DE DATOS DE CERTIFICACIONES 2026
-- Script 01: DDL - Creación de estructura de base de datos
-- Motor: PostgreSQL 15+
-- Autor: Generado automáticamente desde Matsso_Ecuador_Certificaciones_2026.xlsx
-- Fecha: 2026-05-01
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN INICIAL
-- -----------------------------------------------------------------------------
SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;

-- Crear schema dedicado
CREATE SCHEMA IF NOT EXISTS matsso;
SET search_path = matsso, public;

-- -----------------------------------------------------------------------------
-- EXTENSIONES NECESARIAS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Para UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Para búsqueda full-text trigrama
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Para búsqueda sin tildes

-- =============================================================================
-- TABLAS DE CATÁLOGOS / LOOKUP TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FAMILIA (clasificación macro del sector productivo)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.familia (
    id_familia        SERIAL          PRIMARY KEY,
    nombre            VARCHAR(120)    NOT NULL,
    descripcion       TEXT,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_familia_nombre UNIQUE (nombre),
    CONSTRAINT ck_familia_nombre_not_empty CHECK (TRIM(nombre) <> '')
);

COMMENT ON TABLE  matsso.familia                IS 'Clasificación macro de familias de ocupaciones (Electricidad, Construcción, etc.)';
COMMENT ON COLUMN matsso.familia.id_familia      IS 'Identificador interno autoincremental';
COMMENT ON COLUMN matsso.familia.nombre          IS 'Nombre único de la familia';
COMMENT ON COLUMN matsso.familia.activo          IS 'Control lógico: FALSE = familia dada de baja';

-- -----------------------------------------------------------------------------
-- 2. SECTOR (clasificación CIIU / sector económico)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.sector (
    id_sector         SERIAL          PRIMARY KEY,
    id_familia        INTEGER         NOT NULL,
    nombre            VARCHAR(200)    NOT NULL,
    codigo_ciiu       VARCHAR(10),
    descripcion       TEXT,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sector_nombre          UNIQUE (nombre),
    CONSTRAINT ck_sector_nombre_not_empty CHECK (TRIM(nombre) <> ''),
    CONSTRAINT fk_sector_familia
        FOREIGN KEY (id_familia) REFERENCES matsso.familia(id_familia)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE  matsso.sector             IS 'Sectores económicos CIIU asociados a una familia';
COMMENT ON COLUMN matsso.sector.codigo_ciiu  IS 'Código CIIU (si aplica), ej: C2599';

-- -----------------------------------------------------------------------------
-- 3. VIGENCIA (catálogo de períodos de validez de certificaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.vigencia (
    id_vigencia       SERIAL          PRIMARY KEY,
    anos              SMALLINT        NOT NULL,
    etiqueta          VARCHAR(20)     NOT NULL,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_vigencia_anos     UNIQUE (anos),
    CONSTRAINT ck_vigencia_anos_pos CHECK (anos > 0 AND anos <= 10)
);

COMMENT ON TABLE  matsso.vigencia         IS 'Catálogo de períodos de vigencia (2, 3, 4, 5 años)';
COMMENT ON COLUMN matsso.vigencia.etiqueta IS 'Etiqueta legible: "2 años", "5 años"';

-- =============================================================================
-- TABLAS PRINCIPALES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4. CERTIFICACION (entidad central del modelo)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.certificacion (
    id_certificacion  SERIAL          PRIMARY KEY,
    codigo            VARCHAR(20)     NOT NULL,   -- Código interno Matsso (ej: CERT-001)
    nombre            VARCHAR(300)    NOT NULL,
    descripcion       TEXT            NOT NULL,
    id_vigencia       INTEGER         NOT NULL,
    id_familia        INTEGER         NOT NULL,
    id_sector         INTEGER         NOT NULL,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(100)    NOT NULL DEFAULT CURRENT_USER,
    updated_by        VARCHAR(100)    NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT uq_certificacion_nombre  UNIQUE (nombre),
    CONSTRAINT uq_certificacion_codigo  UNIQUE (codigo),
    CONSTRAINT ck_cert_nombre_not_empty CHECK (TRIM(nombre) <> ''),
    CONSTRAINT fk_cert_vigencia
        FOREIGN KEY (id_vigencia) REFERENCES matsso.vigencia(id_vigencia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cert_familia
        FOREIGN KEY (id_familia) REFERENCES matsso.familia(id_familia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cert_sector
        FOREIGN KEY (id_sector) REFERENCES matsso.sector(id_sector)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE  matsso.certificacion                IS 'Catálogo maestro de certificaciones Matsso Ecuador 2026';
COMMENT ON COLUMN matsso.certificacion.codigo         IS 'Código único interno (CERT-001 ... CERT-049)';
COMMENT ON COLUMN matsso.certificacion.nombre         IS 'Nombre oficial de la certificación';
COMMENT ON COLUMN matsso.certificacion.descripcion    IS 'Descripción / objetivo de la certificación';
COMMENT ON COLUMN matsso.certificacion.activo         IS 'FALSE = certificación dada de baja del catálogo';

-- -----------------------------------------------------------------------------
-- 5. PERFIL_DIRIGIDO (público objetivo de la certificación — relación 1:N)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.perfil_dirigido (
    id_perfil         SERIAL          PRIMARY KEY,
    id_certificacion  INTEGER         NOT NULL,
    descripcion       TEXT            NOT NULL,
    orden             SMALLINT        NOT NULL DEFAULT 1,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_perfil_orden_pos CHECK (orden > 0),
    CONSTRAINT fk_perfil_certificacion
        FOREIGN KEY (id_certificacion) REFERENCES matsso.certificacion(id_certificacion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE  matsso.perfil_dirigido              IS 'Perfiles profesionales a los que va dirigida cada certificación';
COMMENT ON COLUMN matsso.perfil_dirigido.orden        IS 'Orden de presentación del perfil en la lista';

-- -----------------------------------------------------------------------------
-- 6. REQUISITO (requisitos de ingreso a la certificación)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.requisito (
    id_requisito      SERIAL          PRIMARY KEY,
    id_certificacion  INTEGER         NOT NULL,
    tipo              VARCHAR(50)     NOT NULL,   -- 'FORMACION', 'EXPERIENCIA', 'CAPACITACION', 'OTRO'
    descripcion       TEXT            NOT NULL,
    orden             SMALLINT        NOT NULL DEFAULT 1,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_requisito_tipo CHECK (
        tipo IN ('FORMACION', 'EXPERIENCIA', 'CAPACITACION', 'OTRO')
    ),
    CONSTRAINT ck_requisito_orden_pos CHECK (orden > 0),
    CONSTRAINT fk_requisito_certificacion
        FOREIGN KEY (id_certificacion) REFERENCES matsso.certificacion(id_certificacion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE  matsso.requisito        IS 'Requisitos de admisión por certificación (formación, experiencia, capacitación)';
COMMENT ON COLUMN matsso.requisito.tipo   IS 'Categoría del requisito: FORMACION | EXPERIENCIA | CAPACITACION | OTRO';

-- -----------------------------------------------------------------------------
-- 7. CONOCIMIENTO (contenidos / competencias que se evalúan)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.conocimiento (
    id_conocimiento   SERIAL          PRIMARY KEY,
    id_certificacion  INTEGER         NOT NULL,
    descripcion       TEXT            NOT NULL,
    orden             SMALLINT        NOT NULL DEFAULT 1,
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_conocimiento_orden_pos CHECK (orden > 0),
    CONSTRAINT fk_conocimiento_certificacion
        FOREIGN KEY (id_certificacion) REFERENCES matsso.certificacion(id_certificacion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE  matsso.conocimiento IS 'Áreas de conocimiento / competencias requeridas por certificación';

-- -----------------------------------------------------------------------------
-- 8. EVALUACION (método de evaluación de la certificación)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.evaluacion (
    id_evaluacion     SERIAL          PRIMARY KEY,
    id_certificacion  INTEGER         NOT NULL,
    modalidad         VARCHAR(20)     NOT NULL,   -- 'TEORICO', 'PRACTICO'
    descripcion       TEXT            NOT NULL,
    porcentaje_minimo NUMERIC(5,2),               -- ej: 70.00
    porcentaje_max    NUMERIC(5,2),               -- ej: 100.00
    activo            BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_evaluacion_cert_modalidad UNIQUE (id_certificacion, modalidad),
    CONSTRAINT ck_evaluacion_modalidad CHECK (modalidad IN ('TEORICO', 'PRACTICO')),
    CONSTRAINT ck_evaluacion_pct_min CHECK (
        porcentaje_minimo IS NULL OR (porcentaje_minimo >= 0 AND porcentaje_minimo <= 100)
    ),
    CONSTRAINT ck_evaluacion_pct_max CHECK (
        porcentaje_max IS NULL OR (porcentaje_max >= 0 AND porcentaje_max <= 100)
    ),
    CONSTRAINT ck_evaluacion_pct_orden CHECK (
        porcentaje_minimo IS NULL OR porcentaje_max IS NULL OR
        porcentaje_minimo <= porcentaje_max
    ),
    CONSTRAINT fk_evaluacion_certificacion
        FOREIGN KEY (id_certificacion) REFERENCES matsso.certificacion(id_certificacion)
        ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE  matsso.evaluacion                   IS 'Métodos de evaluación teórica y práctica por certificación';
COMMENT ON COLUMN matsso.evaluacion.modalidad         IS 'TEORICO: banco de preguntas | PRACTICO: ejercicios prácticos';
COMMENT ON COLUMN matsso.evaluacion.porcentaje_minimo IS 'Nota mínima de aprobación (ej: 70 = 70%)';

-- =============================================================================
-- TABLAS DE AUDITORÍA / LOGGING
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 9. AUDIT_LOG (log de cambios en tablas críticas — triggers)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.audit_log (
    id_log            BIGSERIAL       PRIMARY KEY,
    esquema           VARCHAR(50)     NOT NULL,
    tabla             VARCHAR(100)    NOT NULL,
    operacion         VARCHAR(10)     NOT NULL,   -- INSERT, UPDATE, DELETE
    id_registro       TEXT            NOT NULL,   -- PK del registro afectado (convertida a text)
    datos_anteriores  JSONB,                      -- fila antes del cambio (UPDATE/DELETE)
    datos_nuevos      JSONB,                      -- fila después del cambio (INSERT/UPDATE)
    usuario_bd        VARCHAR(100)    NOT NULL DEFAULT CURRENT_USER,
    usuario_app       VARCHAR(100),               -- usuario de la app (si pasa por SET app.user)
    ip_origen         INET,
    momento           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    transaccion_id    BIGINT          DEFAULT txid_current(),

    CONSTRAINT ck_audit_operacion CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);

COMMENT ON TABLE  matsso.audit_log                  IS 'Log de auditoría: registra todos los INSERT/UPDATE/DELETE en tablas críticas';
COMMENT ON COLUMN matsso.audit_log.datos_anteriores IS 'Snapshot JSON de la fila ANTES del cambio';
COMMENT ON COLUMN matsso.audit_log.datos_nuevos     IS 'Snapshot JSON de la fila DESPUÉS del cambio';
COMMENT ON COLUMN matsso.audit_log.usuario_app      IS 'Usuario de aplicación capturado vía SET LOCAL app.current_user';

-- Particionado por mes para escalabilidad (requiere PG14+)
-- ALTER TABLE matsso.audit_log PARTITION BY RANGE (momento);
-- (Descomentar si se espera alto volumen de auditoría)

-- -----------------------------------------------------------------------------
-- 10. SESSION_LOG (log de accesos / sesiones de la aplicación)
-- -----------------------------------------------------------------------------
CREATE TABLE matsso.session_log (
    id_session        BIGSERIAL       PRIMARY KEY,
    usuario_app       VARCHAR(100)    NOT NULL,
    accion            VARCHAR(200)    NOT NULL,
    endpoint          VARCHAR(300),
    ip_origen         INET,
    user_agent        TEXT,
    resultado         VARCHAR(20)     NOT NULL DEFAULT 'OK',  -- OK, ERROR, FORBIDDEN
    detalle_error     TEXT,
    duracion_ms       INTEGER,
    momento           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_session_resultado CHECK (resultado IN ('OK', 'ERROR', 'FORBIDDEN'))
);

COMMENT ON TABLE matsso.session_log IS 'Log de sesiones y acciones de usuario en la aplicación';

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================================

-- Familia
CREATE INDEX ix_familia_nombre         ON matsso.familia  USING gin (nombre gin_trgm_ops);

-- Sector
CREATE INDEX ix_sector_id_familia      ON matsso.sector   (id_familia);
CREATE INDEX ix_sector_nombre          ON matsso.sector   USING gin (nombre gin_trgm_ops);

-- Certificacion
CREATE INDEX ix_cert_id_vigencia       ON matsso.certificacion (id_vigencia);
CREATE INDEX ix_cert_id_familia        ON matsso.certificacion (id_familia);
CREATE INDEX ix_cert_id_sector         ON matsso.certificacion (id_sector);
CREATE INDEX ix_cert_activo            ON matsso.certificacion (activo) WHERE activo = TRUE;
CREATE INDEX ix_cert_nombre_trgm       ON matsso.certificacion USING gin (nombre gin_trgm_ops);
CREATE INDEX ix_cert_descripcion_trgm  ON matsso.certificacion USING gin (descripcion gin_trgm_ops);

-- Perfil dirigido
CREATE INDEX ix_perfil_id_cert         ON matsso.perfil_dirigido (id_certificacion);
CREATE INDEX ix_perfil_descripcion_trgm ON matsso.perfil_dirigido USING gin (descripcion gin_trgm_ops);

-- Requisito
CREATE INDEX ix_req_id_cert            ON matsso.requisito (id_certificacion);
CREATE INDEX ix_req_tipo               ON matsso.requisito (tipo);

-- Conocimiento
CREATE INDEX ix_conoc_id_cert          ON matsso.conocimiento (id_certificacion);
CREATE INDEX ix_conoc_descripcion_trgm ON matsso.conocimiento USING gin (descripcion gin_trgm_ops);

-- Evaluacion
CREATE INDEX ix_eval_id_cert           ON matsso.evaluacion (id_certificacion);
CREATE INDEX ix_eval_modalidad         ON matsso.evaluacion (modalidad);

-- Audit log
CREATE INDEX ix_audit_tabla            ON matsso.audit_log (tabla, operacion);
CREATE INDEX ix_audit_momento          ON matsso.audit_log (momento DESC);
CREATE INDEX ix_audit_id_registro      ON matsso.audit_log (id_registro);
CREATE INDEX ix_audit_usuario_bd       ON matsso.audit_log (usuario_bd);

-- Session log
CREATE INDEX ix_session_usuario        ON matsso.session_log (usuario_app);
CREATE INDEX ix_session_momento        ON matsso.session_log (momento DESC);
CREATE INDEX ix_session_resultado      ON matsso.session_log (resultado) WHERE resultado <> 'OK';

-- =============================================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Función genérica para trigger de updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION matsso.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION matsso.fn_set_updated_at IS 'Actualiza updated_at automáticamente en cada UPDATE';

-- Triggers updated_at en todas las tablas principales
CREATE TRIGGER tg_familia_updated_at
    BEFORE UPDATE ON matsso.familia
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_sector_updated_at
    BEFORE UPDATE ON matsso.sector
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_vigencia_updated_at
    BEFORE UPDATE ON matsso.vigencia
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_cert_updated_at
    BEFORE UPDATE ON matsso.certificacion
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_perfil_updated_at
    BEFORE UPDATE ON matsso.perfil_dirigido
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_req_updated_at
    BEFORE UPDATE ON matsso.requisito
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_conoc_updated_at
    BEFORE UPDATE ON matsso.conocimiento
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

CREATE TRIGGER tg_eval_updated_at
    BEFORE UPDATE ON matsso.evaluacion
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- Función genérica de auditoría (INSERT/UPDATE/DELETE → audit_log)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION matsso.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    v_old_data  JSONB;
    v_new_data  JSONB;
    v_pk        TEXT;
    v_user_app  TEXT;
BEGIN
    -- Intentar capturar usuario de aplicación si fue establecido vía SET LOCAL
    BEGIN
        v_user_app := current_setting('app.current_user', TRUE);
    EXCEPTION WHEN OTHERS THEN
        v_user_app := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_pk       := (v_old_data->>'id_' || lower(TG_TABLE_NAME));
        INSERT INTO matsso.audit_log
            (esquema, tabla, operacion, id_registro, datos_anteriores, datos_nuevos,
             usuario_bd, usuario_app)
        VALUES
            (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP,
             COALESCE(v_pk, 'UNKNOWN'), v_old_data, NULL,
             CURRENT_USER, v_user_app);
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_pk       := (v_new_data->>'id_' || lower(TG_TABLE_NAME));
        -- Solo loguear si hubo cambios reales
        IF v_old_data <> v_new_data THEN
            INSERT INTO matsso.audit_log
                (esquema, tabla, operacion, id_registro, datos_anteriores, datos_nuevos,
                 usuario_bd, usuario_app)
            VALUES
                (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP,
                 COALESCE(v_pk, 'UNKNOWN'), v_old_data, v_new_data,
                 CURRENT_USER, v_user_app);
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_pk       := (v_new_data->>'id_' || lower(TG_TABLE_NAME));
        INSERT INTO matsso.audit_log
            (esquema, tabla, operacion, id_registro, datos_anteriores, datos_nuevos,
             usuario_bd, usuario_app)
        VALUES
            (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP,
             COALESCE(v_pk, 'UNKNOWN'), NULL, v_new_data,
             CURRENT_USER, v_user_app);
        RETURN NEW;
    END IF;
END;
$$;

COMMENT ON FUNCTION matsso.fn_audit_trigger IS 'Trigger de auditoría genérico: registra INSERT/UPDATE/DELETE con snapshot JSON';

-- Activar auditoría en tablas críticas
CREATE TRIGGER tg_audit_certificacion
    AFTER INSERT OR UPDATE OR DELETE ON matsso.certificacion
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_audit_trigger();

CREATE TRIGGER tg_audit_familia
    AFTER INSERT OR UPDATE OR DELETE ON matsso.familia
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_audit_trigger();

CREATE TRIGGER tg_audit_sector
    AFTER INSERT OR UPDATE OR DELETE ON matsso.sector
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_audit_trigger();

CREATE TRIGGER tg_audit_vigencia
    AFTER INSERT OR UPDATE OR DELETE ON matsso.vigencia
    FOR EACH ROW EXECUTE FUNCTION matsso.fn_audit_trigger();

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista completa desnormalizada (útil para reportes y APIs de consulta)
CREATE OR REPLACE VIEW matsso.v_certificaciones_completa AS
SELECT
    c.id_certificacion,
    c.codigo,
    c.nombre                                    AS certificacion,
    c.descripcion,
    v.etiqueta                                  AS vigencia,
    v.anos                                      AS vigencia_anos,
    f.nombre                                    AS familia,
    s.nombre                                    AS sector,
    c.activo,
    c.created_at,
    c.updated_at
FROM matsso.certificacion  c
JOIN matsso.vigencia        v ON v.id_vigencia = c.id_vigencia
JOIN matsso.familia         f ON f.id_familia  = c.id_familia
JOIN matsso.sector          s ON s.id_sector   = c.id_sector
ORDER BY c.nombre;

COMMENT ON VIEW matsso.v_certificaciones_completa IS 'Vista desnormalizada de certificaciones con sus catálogos resueltos';

-- Vista de certificaciones con conteo de perfiles, requisitos y conocimientos
CREATE OR REPLACE VIEW matsso.v_cert_resumen AS
SELECT
    c.id_certificacion,
    c.codigo,
    c.nombre,
    f.nombre                AS familia,
    s.nombre                AS sector,
    v.etiqueta              AS vigencia,
    COUNT(DISTINCT p.id_perfil)       AS cant_perfiles,
    COUNT(DISTINCT r.id_requisito)    AS cant_requisitos,
    COUNT(DISTINCT k.id_conocimiento) AS cant_conocimientos,
    COUNT(DISTINCT e.id_evaluacion)   AS cant_evaluaciones
FROM matsso.certificacion c
JOIN matsso.familia        f ON f.id_familia  = c.id_familia
JOIN matsso.sector         s ON s.id_sector   = c.id_sector
JOIN matsso.vigencia       v ON v.id_vigencia = c.id_vigencia
LEFT JOIN matsso.perfil_dirigido p ON p.id_certificacion = c.id_certificacion AND p.activo
LEFT JOIN matsso.requisito       r ON r.id_certificacion = c.id_certificacion AND r.activo
LEFT JOIN matsso.conocimiento    k ON k.id_certificacion = c.id_certificacion AND k.activo
LEFT JOIN matsso.evaluacion      e ON e.id_certificacion = c.id_certificacion AND e.activo
GROUP BY c.id_certificacion, c.codigo, c.nombre, f.nombre, s.nombre, v.etiqueta;

COMMENT ON VIEW matsso.v_cert_resumen IS 'Resumen de cada certificación con conteos de sub-elementos';

-- =============================================================================
-- ROL Y PERMISOS SUGERIDOS
-- =============================================================================

-- Rol de solo lectura (para aplicaciones de consulta / BI)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'matsso_reader') THEN
        CREATE ROLE matsso_reader NOLOGIN;
    END IF;
END $$;

GRANT USAGE ON SCHEMA matsso TO matsso_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA matsso TO matsso_reader;

-- Rol de escritura (para la API backend)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'matsso_app') THEN
        CREATE ROLE matsso_app NOLOGIN;
    END IF;
END $$;

GRANT USAGE ON SCHEMA matsso TO matsso_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA matsso TO matsso_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA matsso TO matsso_app;
-- Audit_log y session_log solo INSERT desde la app
REVOKE UPDATE ON matsso.audit_log   FROM matsso_app;
REVOKE UPDATE ON matsso.session_log FROM matsso_app;

-- =============================================================================
-- FIN DEL SCRIPT DDL
-- =============================================================================

-- >>> FIN DE 01_matsso_ddl_create.sql <<<

-- >>> INICIO DE 01_creacion_tablas.sql <<<
-- ==============================================================================
-- SCRIPT 1: CREACIÓN DE BASE DE DATOS Y TABLAS
-- ==============================================================================

-- Nota: Asegúrate de estar conectado a tu base de datos destino (ej. 'matsso_db') antes de correr esto.

-- 1. Tabla original de Clientes (Se mantiene la estructura de Laravel)
CREATE TABLE IF NOT EXISTS public.clientes
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    nombre character varying(255) NOT NULL,
    cedula character varying(15) NOT NULL,
    telefono character varying(255),
    correo character varying(255),
    direccion text,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    ciudad character varying(255),
    lugar character varying(255),
    esquema character varying(255),
    tipo_examen character varying(255),
    puntaje_teorico character varying(255),
    puntaje_practico character varying(255),
    id_familia bigint,
    id_sector bigint,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
    nombre_examinador character varying(255),
    cedula_examinador character varying(20),
    telefono_examinador character varying(20),
    edad integer,
    celular1 character varying(20),
    cv_metadata json,
    CONSTRAINT clientes_pkey PRIMARY KEY (id),
    CONSTRAINT clientes_cedula_unique UNIQUE (cedula)
);

-- 2. Tabla de Usuarios Web (Para el login del E-commerce)
-- Separamos las credenciales web de la tabla operativa de clientes.
CREATE TABLE IF NOT EXISTS public.usuarios_web
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    cliente_id bigint, -- Relación con la tabla clientes de Laravel
    correo character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(50) NOT NULL DEFAULT 'ESTUDIANTE', -- ADMIN o ESTUDIANTE
    activo boolean DEFAULT true,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_web_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_web_correo_unique UNIQUE (correo),
    CONSTRAINT fk_usuario_cliente FOREIGN KEY (cliente_id)
        REFERENCES public.clientes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);

-- 3. Tabla de Productos (Capacitaciones y Certificaciones)
CREATE TABLE IF NOT EXISTS public.productos
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    tipo character varying(50) NOT NULL, -- 'CAPACITACION' o 'CERTIFICACION'
    titulo character varying(255) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    horas integer,
    modalidad character varying(100), -- PRESENCIAL, ONLINE
    imagen_url character varying(255),
    activo boolean DEFAULT true,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT productos_pkey PRIMARY KEY (id)
);

-- 4. Tabla de Esquemas de Certificación (Relacionado al producto)
CREATE TABLE IF NOT EXISTS public.esquemas_certificacion
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    producto_id bigint NOT NULL,
    perfil_profesional character varying(255) NOT NULL,
    nombre_esquema character varying(255) NOT NULL,
    CONSTRAINT esquemas_pkey PRIMARY KEY (id),
    CONSTRAINT fk_esquema_producto FOREIGN KEY (producto_id)
        REFERENCES public.productos (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 5. Tabla de Órdenes (Carritos pagados)
CREATE TABLE IF NOT EXISTS public.ordenes
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    usuario_id bigint NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADO, CANCELADO
    fecha_orden timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
    metodo_pago character varying(100),
    CONSTRAINT ordenes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_orden_usuario FOREIGN KEY (usuario_id)
        REFERENCES public.usuarios_web (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- 6. Tabla de Detalles de la Orden
CREATE TABLE IF NOT EXISTS public.orden_items
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    orden_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    cantidad integer NOT NULL DEFAULT 1,
    CONSTRAINT orden_items_pkey PRIMARY KEY (id),
    CONSTRAINT fk_item_orden FOREIGN KEY (orden_id)
        REFERENCES public.ordenes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_item_producto FOREIGN KEY (producto_id)
        REFERENCES public.productos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- >>> FIN DE 01_creacion_tablas.sql <<<


-- =============================================================================
-- PUENTE ENTRE SCHEMAS (E-COMMERCE Y CATÁLOGO)
-- =============================================================================
ALTER TABLE public.productos ADD COLUMN id_certificacion INTEGER;
ALTER TABLE public.clientes ADD CONSTRAINT fk_cliente_familia FOREIGN KEY (id_familia) REFERENCES matsso.familia(id_familia) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD CONSTRAINT fk_cliente_sector FOREIGN KEY (id_sector) REFERENCES matsso.sector(id_sector) ON DELETE SET NULL;


-- >>> INICIO DE 02_roles_usuarios.sql <<<
-- ==============================================================================
-- SCRIPT 2: ROLES DE BASE DE DATOS Y PERMISOS
-- ==============================================================================

-- NOTA: Estos son roles a nivel de Motor de Base de Datos PostgreSQL.
-- Son útiles si quieres restringir qué hace la API de NestJS vs la API de Laravel.

-- Crear un rol para la API de NestJS
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'matsso_api_user') THEN

      CREATE ROLE matsso_api_user WITH LOGIN PASSWORD 'MatssoApi2026!';
   END IF;
END
$do$;

-- Otorgar permisos al rol sobre las tablas del e-commerce
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_web TO matsso_api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO matsso_api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esquemas_certificacion TO matsso_api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes TO matsso_api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orden_items TO matsso_api_user;

-- Permisos específicos para la tabla 'clientes' de Laravel
-- La API Web puede leer clientes y actualizar algunos datos, pero tal vez no borrar.
GRANT SELECT, INSERT, UPDATE ON public.clientes TO matsso_api_user;

-- Permitir uso de secuencias para los IDs autoincrementales
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO matsso_api_user;

-- >>> FIN DE 02_roles_usuarios.sql <<<

-- >>> INICIO DE 03_sp_crud.sql <<<
-- ==============================================================================
-- SCRIPT 3: STORED PROCEDURES (PROCEDIMIENTOS ALMACENADOS PARA CRUD)
-- ==============================================================================

-- Aunque NestJS y TypeORM/Prisma manejan el CRUD a nivel de código,
-- aquí se definen funciones almacenadas críticas como solicitaste.

-- 1. SP: Crear Usuario Web y Cliente al mismo tiempo (Transaccional)
CREATE OR REPLACE PROCEDURE sp_registrar_usuario_web(
    p_nombre VARCHAR,
    p_cedula VARCHAR,
    p_correo VARCHAR,
    p_password_hash VARCHAR,
    p_telefono VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cliente_id BIGINT;
BEGIN
    -- Verificar si el cliente ya existe por cédula
    SELECT id INTO v_cliente_id FROM public.clientes WHERE cedula = p_cedula LIMIT 1;
    
    -- Si no existe, lo creamos
    IF v_cliente_id IS NULL THEN
        INSERT INTO public.clientes(nombre, cedula, correo, telefono, fecha)
        VALUES (p_nombre, p_cedula, p_correo, p_telefono, CURRENT_DATE)
        RETURNING id INTO v_cliente_id;
    END IF;

    -- Crear el usuario web
    INSERT INTO public.usuarios_web(cliente_id, correo, password_hash, rol)
    VALUES (v_cliente_id, p_correo, p_password_hash, 'ESTUDIANTE');
    
    COMMIT;
END;
$$;

-- 2. SP: Crear una Orden con sus Items
CREATE OR REPLACE PROCEDURE sp_crear_orden(
    p_usuario_id BIGINT,
    p_total NUMERIC,
    p_metodo_pago VARCHAR,
    p_productos_ids BIGINT[], -- Array de IDs de productos
    p_cantidades INTEGER[] -- Array de cantidades
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_orden_id BIGINT;
    i INTEGER;
    v_precio_unitario NUMERIC;
BEGIN
    -- Crear la orden cabecera
    INSERT INTO public.ordenes(usuario_id, total, metodo_pago, estado)
    VALUES (p_usuario_id, p_total, p_metodo_pago, 'COMPLETADO')
    RETURNING id INTO v_orden_id;

    -- Iterar e insertar los items
    FOR i IN 1 .. array_length(p_productos_ids, 1)
    LOOP
        -- Obtener precio del producto
        SELECT precio INTO v_precio_unitario FROM public.productos WHERE id = p_productos_ids[i];
        
        INSERT INTO public.orden_items(orden_id, producto_id, precio_unitario, cantidad)
        VALUES (v_orden_id, p_productos_ids[i], v_precio_unitario, p_cantidades[i]);
    END LOOP;
    
    COMMIT;
END;
$$;

-- 3. FUNCTION: Obtener historial de compras de un cliente (Usada para vistas o NestJS)
CREATE OR REPLACE FUNCTION fn_historial_compras(p_cliente_cedula VARCHAR)
RETURNS TABLE (
    orden_id BIGINT,
    fecha TIMESTAMP,
    producto VARCHAR,
    monto_pagado NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id, o.fecha_orden, p.titulo, oi.precio_unitario * oi.cantidad
    FROM public.ordenes o
    JOIN public.usuarios_web uw ON o.usuario_id = uw.id
    JOIN public.clientes c ON uw.cliente_id = c.id
    JOIN public.orden_items oi ON o.id = oi.orden_id
    JOIN public.productos p ON oi.producto_id = p.id
    WHERE c.cedula = p_cliente_cedula;
END;
$$;

-- >>> FIN DE 03_sp_crud.sql <<<

-- >>> INICIO DE 04_indices_vistas_datos.sql <<<
-- ==============================================================================
-- SCRIPT 4: ÍNDICES, TRIGGERS, VISTAS Y DATOS DE INICIALIZACIÓN
-- ==============================================================================

-- ================= ÍNDICES =================
-- Índices para búsquedas rápidas en el backend (NestJS)
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON public.clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_usuarios_web_correo ON public.usuarios_web(correo);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON public.productos(tipo);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON public.ordenes(usuario_id);

-- ================= VISTAS =================
-- Vista para el Dashboard del Administrador: Resumen de Ventas
CREATE OR REPLACE VIEW vista_resumen_ventas AS
SELECT 
    p.tipo,
    p.titulo,
    COUNT(oi.id) as cantidad_vendida,
    SUM(oi.precio_unitario * oi.cantidad) as total_recaudado
FROM public.productos p
LEFT JOIN public.orden_items oi ON p.id = oi.producto_id
LEFT JOIN public.ordenes o ON oi.orden_id = o.id AND o.estado = 'COMPLETADO'
GROUP BY p.tipo, p.titulo;

-- Vista del perfil completo del estudiante (Cruza Laravel + Web)
CREATE OR REPLACE VIEW vista_perfil_estudiante AS
SELECT 
    uw.id as usuario_web_id,
    c.cedula,
    c.nombre,
    uw.correo,
    c.telefono,
    c.esquema as ultimo_esquema_laravel,
    COUNT(o.id) as total_compras_web
FROM public.usuarios_web uw
JOIN public.clientes c ON uw.cliente_id = c.id
LEFT JOIN public.ordenes o ON uw.id = o.usuario_id
GROUP BY uw.id, c.cedula, c.nombre, uw.correo, c.telefono, c.esquema;

-- ================= TRIGGERS =================
-- Trigger para actualizar el updated_at de clientes automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_cliente_modtime
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- ================= DATOS DE INICIALIZACIÓN (MOCKS) =================
-- Insertar Usuario Admin
INSERT INTO public.usuarios_web(correo, password_hash, rol)
VALUES ('admin@matsso.com', '$2b$10$hashed_password_example', 'ADMIN')
ON CONFLICT (correo) DO NOTHING;

-- Insertar Cursos y Certificaciones (Basado en la imagen de Esquemas)
INSERT INTO public.productos(tipo, titulo, precio, horas, modalidad) VALUES
('CERTIFICACION', 'Cuidado de Personas Adultas Mayores', 120.00, 40, 'PRESENCIAL'),
('CERTIFICACION', 'Entrenamiento Canino: Detección y Defensa', 150.00, 60, 'PRESENCIAL'),
('CERTIFICACION', 'Instalaciones Hidrosanitarias', 90.00, 30, 'PRESENCIAL'),
('CAPACITACION', 'Gestión Administrativa en Salud', 80.00, 20, 'ONLINE')
ON CONFLICT DO NOTHING;

-- Insertar Esquemas vinculados a productos
INSERT INTO public.esquemas_certificacion(producto_id, perfil_profesional, nombre_esquema)
SELECT id, 'ENTRENAMIENTO CANINO', 'DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS'
FROM public.productos WHERE titulo LIKE '%Canino%' LIMIT 1;

INSERT INTO public.esquemas_certificacion(producto_id, perfil_profesional, nombre_esquema)
SELECT id, 'ENTRENAMIENTO CANINO', 'DEFENSA Y PROTECCIÓN'
FROM public.productos WHERE titulo LIKE '%Canino%' LIMIT 1;

-- >>> FIN DE 04_indices_vistas_datos.sql <<<

-- >>> INICIO DE 02_matsso_dml_inserts.sql <<<
-- =============================================================================
-- MATSSO ECUADOR - BASE DE DATOS DE CERTIFICACIONES 2026
-- Script 02: DML - Inserción de datos desde Excel
-- Motor: PostgreSQL 15+
-- Fuente: Matsso_Ecuador_Certificaciones_2026.xlsx
-- Fecha: 2026-05-01
-- =============================================================================

SET search_path = matsso, public;
BEGIN;

-- =============================================================================
-- 1. VIGENCIAS
-- =============================================================================
INSERT INTO matsso.vigencia (anos, etiqueta) VALUES (2, '2 años') ON CONFLICT (anos) DO NOTHING;
INSERT INTO matsso.vigencia (anos, etiqueta) VALUES (3, '3 años') ON CONFLICT (anos) DO NOTHING;
INSERT INTO matsso.vigencia (anos, etiqueta) VALUES (4, '4 años') ON CONFLICT (anos) DO NOTHING;
INSERT INTO matsso.vigencia (anos, etiqueta) VALUES (5, '5 años') ON CONFLICT (anos) DO NOTHING;

-- =============================================================================
-- 2. FAMILIAS
-- =============================================================================
INSERT INTO matsso.familia (nombre) VALUES ('Actividades Tipo Servicios') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Actividades de Enseñanza') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Actividades de Salud') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Comercialización y Venta de productos') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Construcción') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Electricidad Gas y Agua') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Electricidad gas y agua') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Metalmecánica') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Servicios Financieros') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Tecnología: Hardware y Software (Incluye TICS)') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Transformación de Alimentos') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.familia (nombre) VALUES ('Transporte Almacenamiento y Logística') ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- 3. SECTORES
-- =============================================================================
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Electricidad Gas y Agua'), 'Suministro de Electricidad') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades Administrativas y de Apoyo de Oficina y Otras Actividades de Apoyo') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Metalmecánica'), 'Fabricación de Productos Elaborados de Metal Excepto Maquinaria de Equipo') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Otras Actividades de Servicios Profesionales') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Construcción'), 'Actividades Especializadas de la Construcción') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Servicios Financieros'), 'Actividades Jurídicas de Contabilidad') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades de Asistencia Social sin Alojamiento') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades de Bibliotecas Archivos Museos y Otras') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Otras Actividades Profesionales, Científicas y Técnicas') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Transporte Almacenamiento y Logística'), 'Transporte por Vía Terrestre y por Tuberías') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades de Atención de la Salud Humana') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Otras Actividades Profesionales, Científicas y Técnicas') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Otras Actividades Profesionales') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Administración Pública y Defensa') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades de Enseñanza'), 'Enseñanza') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades Administrativas y de Apoyo de Oficina') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades de Oficinas Principales') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Metalmecánica'), 'Fabricación de Productos Elaborados de Metal') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Comercialización y Venta de productos'), 'Publicidad y Estudio de Mercado') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Servicios Financieros'), 'Actividades Auxiliares de las Actividades de Servicios') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Electricidad gas y agua'), 'Suministro de Electricidad, Gas, Vapor y Aire Acondicionado') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Actividades de Descontaminación') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Electricidad Gas y Agua'), 'Suministro de Electricidad Gas Vapor y Aire Acondicionado') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Transformación de Alimentos'), 'Elaboración de Productos Alimenticios') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Otras Actividades Profesionales Técnicas') ON CONFLICT (nombre) DO NOTHING;
INSERT INTO matsso.sector (id_familia, nombre) VALUES ((SELECT id_familia FROM matsso.familia WHERE nombre = 'Actividades Tipo Servicios'), 'Administración Pública y Defensa; Planes de Seguridad') ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- 4. CERTIFICACIONES (con perfiles, requisitos, conocimientos y evaluaciones)
-- =============================================================================
-- -----------------------------------------------------------------------
-- Cert 01: ACTIVIDADES AUXILIARES DE LINIERO
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-001',
    'ACTIVIDADES AUXILIARES DE LINIERO',
    'Realizar actividades de apoyo en las labores de construcción, operación, mantenimiento de redes de los sistemas de distribución eléctrica y de alumbrado público de acuerdo a procedimientos establecidos y normativa legal vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Electricidad Gas y Agua'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Suministro de Electricidad')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Electricistas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Maestros eléctrico – electrónicos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Instaladores eléctricos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Personal técnico del sector eléctrico', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Linieros', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Capataces', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Ayudantes de linieros', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'FORMACION', 'Educación formal: Bachiller técnico.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'EXPERIENCIA', 'Experiencia: 1 año de experiencia en la actividad laboral evidenciable.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en temas de seguridad inherentes a la actividad.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Normativa legal vigente', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Normativas relacionadas con seguridad y salud ocupacional', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Identificación de equipos y herramientas para realizar trabajos en contacto con redes de distribución', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'Conocimientos básicos en ofimática', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-001'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 02: ADMINISTRACIÓN DE EMPRESAS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-002',
    'ADMINISTRACIÓN DE EMPRESAS',
    'Gestionar las distintas áreas de la empresa en niveles de estrategia, operación y administración, estableciendo objetivos e indicadores de gestión en relación a las tendencias del mercado.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Administrativas y de Apoyo de Oficina y Otras Actividades de Apoyo')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Especialistas en organización y administración de empresas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Administrador de empresas', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Técnico, administración de empresas', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Gerentes de Operaciones', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Directores de Estrategia Empresarial', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Analistas de Tendencias de Mercado', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Consultores en Gestión Empresarial', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Jefes de Planificación y Desarrollo Estratégico', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Coordinadores de Administración y Operaciones', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Emprendedores y dueños de pequeñas y medianas empresas', 10);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'FORMACION', 'Nivel de Formación: Tercer nivel o egresado en Administración o afines (deseable).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'EXPERIENCIA', 'Experiencia: 1 año en actividades administrativas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'CAPACITACION', 'Capacitación: 40 Horas de capacitación en técnicas de gestión administrativa y materias afines al perfil (deseable).', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Administrar procesos de planificación y comercialización de la empresa, de acuerdo a los procedimientos establecidos.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Planificación Básica.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Marketing Básico.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Manejo de aplicaciones informáticas (Office) e internet.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Normativa de seguridad, salud e higiene en el trabajo.', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'Gestionar procesos administrativos.', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-002'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 03: ARMADO DE ESTRUCTURAS METÁLICAS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-003',
    'ARMADO DE ESTRUCTURAS METÁLICAS',
    'Realizar el armado montaje y acabado de estructuras metálicas conforme al diseño y especificaciones técnicas requeridas, cumpliendo con normas de calidad, seguridad y salud en el trabajo y medio ambiente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Metalmecánica'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Fabricación de Productos Elaborados de Metal Excepto Maquinaria de Equipo')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Soldadores', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Arquitectos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Ingenieros Civiles', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Estudiantes de Ingeniería Civil y Arquitectura', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Consultores y profesionales del sector de Construcción', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Encargados de la gestión, diseño y construcción de proyectos de Estructuras Metálicas', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Diseñadores industriales', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Diseñadores de estructuras metálicas', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Profesionales y técnicos vinculados al sector de la ingeniería y la construcción', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'FORMACION', 'Nivel de Formación: Lecto escritura básica.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'EXPERIENCIA', 'Experiencia: 2 años en Armado y montaje estructural.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'CAPACITACION', 'Capacitación: Seguridad Industrial (40 Horas).', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Leer e interpretar planos estructurales.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Cumplir con las normas de seguridad y salud ocupacional.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Conocimientos de los diferentes procesos de soldadura y corte, además de los diferentes elementos de unión de una estructura metálica.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Conocimientos básicos de metrología (Pesos, Medidas, Volúmenes, Conversiones).', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'Conocimientos básicos de electricidad.', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-003'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 04: ASESORÍA DE IMAGEN
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-004',
    'ASESORÍA DE IMAGEN',
    'Brindar el asesoramiento y ayuda a una persona (o grupo de personas) a potencializar su imagen, según procedimientos establecidos, de acuerdo al estudio de las características propias de cada individuo.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades de Servicios Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Asesores de belleza', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Asesores de imagen en general', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Asesores de imagen personal', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Maquilladores', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Profesionales de costura y modas', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Profesionales en peluquería, barbería', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Diseñadores de ropa, de moda de todos los estilos y edades', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'EXPERIENCIA', 'Experiencia: 1 año en actividades relacionadas al perfil.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'CAPACITACION', 'Capacitación: 40 horas en temas relacionados al perfil.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Vestuario, materiales y siluetas', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Estilos, colometría y morfología', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Historia de la moda y Estilo de vida', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Fotografía', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Maquillaje, estilismo de cabello (cuidado personal)', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Etiqueta - protocolo y Cultura general', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Habilidades comunicacionales y sociales', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Personal branding, medios y líderes de opinión', 8);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'Imagen profesional y colectiva', 9);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-004'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 05: ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN - ESTRUCTUR
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-005',
    'ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN - ESTRUCTURA E INFRAESTRUCTURA',
    'Asistir a la supervisión de edificaciones y obras civiles cumpliendo las normas de seguridad y salud en el trabajo, medio ambiente y especificaciones técnicas del proyecto de la obra.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Construcción'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Especializadas de la Construcción')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Maestros mayores de obra', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Maestros de albañilería', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Maestros de obras en edificios y construcciones', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Técnicos en construcción civil', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Supervisores de obra en formación', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Ayudantes de construcción con experiencia en supervisión', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Capataces de obra', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Inspectores de calidad en construcción', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Coordinadores de seguridad en obras civiles', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Profesionales interesados en la supervisión de edificaciones y obras civiles', 10);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'FORMACION', 'Nivel de Formación: Educación general básica media o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'EXPERIENCIA', 'Experiencia: 2 años como Maestro Mayor en ejecución de obras debidamente documentada.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'CAPACITACION', 'Capacitación: 60 horas de capacitación.', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'OTRO', 'Otro: Certificado de honorabilidad emitido por el último patrono.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Unidades e instrumentos de medición utilizados en obra', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Interpretación de planos de obra (arquitectónicos, estructurales, hidrosanitarios y eléctricos)', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Especificaciones técnicas', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Criterios de ejecución identificados en los planos de obra', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'Cálculo de materiales para la construcción.', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-005'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 06: ASISTENCIA DE CONTABILIDAD
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-006',
    'ASISTENCIA DE CONTABILIDAD',
    'Asistir en el registro y cálculo de la información financiera contable en empresas e instituciones públicas, privadas, con sujeción a las leyes, normas, principios y procedimientos contables, laborales, tributarios y mercantiles, de acuerdo al avance tecnológico, con eficacia, eficiencia, economía y ética profesional.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Servicios Financieros'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Jurídicas de Contabilidad')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Asistentes financieros', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Asistentes de contabilidad', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Responsables contables', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Financieros', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Asistentes contables', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Profesionales con un mínimo de 2 años de experiencia en contabilidad y similares', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Bachilleres contables', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'FORMACION', 'Experiencia: Para Bachiller técnico: Título de Bachiller Técnico a fin al perfil. Para Bachiller: 2 años de experiencia en actividades afines.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'CAPACITACION', 'Capacitación: Ninguna.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Normativa legal vigente', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Ofimática (hojas de cálculo Excel)', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Software Tributario (DIMM)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'Contabilidad básica', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-006'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 07: ASISTENCIA EN ACTIVIDADES DE ARTICULACIÓN LOCAL PARA LA PREVENCIÓN Y R
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-007',
    'ASISTENCIA EN ACTIVIDADES DE ARTICULACIÓN LOCAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL',
    'Fomentar el uso de los servicios gratuitos que oferta el Ministerio de Salud Pública con énfasis en la desnutrición crónica infantil, de acuerdo a normativa legal vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Profesionales y trabajadores de la salud', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Promotores de salud comunitaria', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Trabajadores en programas de desarrollo comunitario', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Educadores interesados en la salud infantil', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Trabajadores sociales involucrados en comunidades', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Individuos interesados en contribuir a la prevención de la desnutrición infantil', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Personal de ONGs centradas en la salud infantil', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'FORMACION', 'Nivel de Formación: Lectoescritura y manejo de las 4 operaciones básicas (suma, resta, multiplicación y división).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'EXPERIENCIA', 'Experiencia: 6 meses de experiencia comprobada en actividades de prevención de la salud y/o promoción de la salud y/o vigilancia comunitaria.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'CAPACITACION', 'Capacitación: 40 horas relacionadas a la Desnutrición Crónica Infantil – DCI.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Plan Estratégico Intersectorial para la Prevención y Reducción de la desnutrición Crónica Infantil', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Decreto Ejecutivo No.1211', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Plan decenal de Salud 2022-2031', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Manual de Atención Integral de Salud Familiar, Comunitario e Intercultural (MAIS-FCI)', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Libreta Integral de Salud - LIS', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'Rotafolio de la concepción hasta los 5 años', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-007'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 08: ASISTENCIA EN GESTIÓN DOCUMENTAL Y ARCHIVO
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-008',
    'ASISTENCIA EN GESTIÓN DOCUMENTAL Y ARCHIVO',
    'Asistir en las actividades de Gestión Documental y Archivo de acuerdo a los procedimientos establecidos y normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '2 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Bibliotecas Archivos Museos y Otras')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Archivistas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Auxiliares de archivo', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Profesionales de gestión documental', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Secretarios y personal administrativo', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Estudiantes o graduados en áreas relacionadas', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Personal de bibliotecas y centros de información', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Empleados de instituciones gubernamentales o empresariales responsables de la gestión de documentos', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Personas interesadas en la organización eficiente de documentos y archivos', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'EXPERIENCIA', 'Experiencia: 2 años de experiencia en actividades a fines.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en gestión documental y archivo en los últimos 5 años.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Normativa técnica de Gestión Documental y Archivo', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Normativa Legal Vigente', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Conocimientos básicos en Manejo de herramienta ofimática', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'Técnicas de atención al usuario', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-008'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 09: ASISTENCIA EN SEGURIDAD INDUSTRIAL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-009',
    'ASISTENCIA EN SEGURIDAD INDUSTRIAL',
    'Realizar actividades de apoyo a la gestión de seguridad industrial de la entidad, observando la normativa legal vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales, Científicas y Técnicas')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Responsables y delegados de seguridad industrial y salud ocupacional', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Encargados o designados en actividades de seguridad y salud', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Asistentes, supervisores, consultores de seguridad y salud', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Miembros del Comité Paritario', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Paramédicos', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Personal de recursos humanos relacionados con la prevención de riesgos laborales', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Técnicos e inspectores de seguridad en las minas', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Técnico en seguridad y salud ocupacional', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'FORMACION', 'Experiencia: Para Bachiller técnico: Título de Bachiller Técnico a fin al perfil. Para Bachiller: 2 años de experiencia en actividades afines.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'CAPACITACION', 'Capacitación: Ninguna.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Reglamentos y normativas legales vigentes relacionadas a Seguridad industrial', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Normativa de calidad relacionada a Seguridad Industrial', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Lectura de planos', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Ofimática básica', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Metodologías de estimación de riesgos', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Estadística básica', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'Redacción y ortografía', 7);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-009'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 10: ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-010',
    'ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL',
    'Realizar la atención integral (cuidado, desarrollo y aprendizaje) de niños de 12 a 36 meses de edad en los Centros de Desarrollo Infantil (CDI); promoviendo acciones de protección de acuerdo a los lineamientos establecido en la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
);

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Administradoras de centros infantiles', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Administradoras de centros de cuidado infantil', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Trabajadoras administrativas, de gestión y responsables de centros de cuidado infantil privados y de Guaguacentros', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Dueños de centros de cuidado infantil', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Auxiliar de guardería escolar', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Institutriz (asistente de niños)', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Niñera en centro parvulario', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'EXPERIENCIA', 'Experiencia: 1 año como educador en la atención de niños menores de cinco años.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en la atención de niños menores de cinco años.', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'OTRO', 'Otro: Certificado de honorabilidad emitido por el último patrono.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Características de desarrollo de niños de 0 a 36 meses de edad', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Norma técnica, Acuerdos Ministeriales e interministeriales vigentes.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'Normativa legal vigente (Constitución, Convención de los Derechos de los Niños, Código de la Niñez y Adolescencia y Plan Nacional de Desarrollo vigente).', 3);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-010'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 11: CONDUCTOR PROFESIONAL DE BUS - NTE INEN 2 463: 2008
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-011',
    'CONDUCTOR PROFESIONAL DE BUS - NTE INEN 2 463: 2008',
    'El conductor de transporte turístico terrestre se ocupa, principalmente, de trasladar a los turistas en vehículos tipo autobús, furgoneta y automóvil, en ambientes urbanos, carreteras rurales, para excursiones, paseo local, traslados y desplazamientos especiales.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Transporte Almacenamiento y Logística'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Transporte por Vía Terrestre y por Tuberías')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Conductores de buses de pasajeros', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Choferes y asistentes de conductores de buses de pasajeros', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Choferes y ayudantes conductores de buses escolares', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Conductores de furgonetas para pasajeros', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Ayudantes de conductores de furgonetas para pasajeros', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'FORMACION', 'Nivel de Formación: Educación básica terminada.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'EXPERIENCIA', 'Experiencia: 3 años en la conducción de transporte terrestre (bus).', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'CAPACITACION', 'Capacitación: Seguridad vial 20 horas, Normas de tránsito 15 horas.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Reglas de urbanidad y cuidados de higiene personal.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Reglamentos y procedimientos para minimizar el impacto ambiental del vehículo.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Rutas de los principales atractivos turísticos y ubicación de los hoteles, restaurantes, mercados.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Seguridad vial.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Señalización turística y de tránsito.', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Primeros auxilios básicos.', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'Leyes y reglamentos aplicables a la conducción.', 7);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-011'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 12: CONSEJERÍAS DE ATENCIÓN FAMILIAR DEL SERVICIO CRECIENDO CON NUESTROS H
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-012',
    'CONSEJERÍAS DE ATENCIÓN FAMILIAR DEL SERVICIO CRECIENDO CON NUESTROS HIJOS (CNH)',
    'Brindar consejerías familiares individuales y/o grupales del servicio Creciendo con Nuestros Hijos, promoviendo la protección integral de mujeres gestantes, niñas y niños de 0 a 3 años de edad de conformidad a los lineamientos establecidos en la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Consejeros de familia', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Consejeros de niños y jóvenes', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Educadores en primera infancia', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Psicólogos comunitarios', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Trabajadores sociales con enfoque familiar', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Orientadores familiares en programas de protección infantil', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Promotores de salud y bienestar familiar', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Facilitadores de programas de apoyo a mujeres gestantes', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Coordinadores de proyectos de desarrollo infantil temprano', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'EXPERIENCIA', 'Experiencia: 1 año como educador/a en la atención de niños menores de cinco años.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en temas de desarrollo infantil integral (aprobado).', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'OTRO', 'Otro: Certificado de honorabilidad.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Características de desarrollo evolutivo de los niños de 0 a 3 años de edad.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Norma técnica, Acuerdos Ministeriales e Interministeriales vigentes.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Normativa legal vigente (Constitución y Código de la Niñez y Adolescencia)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'Estimulación prenatal', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-012'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 13: COORDINACIÓN EN CENTROS DE DESARROLLO INFANTIL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-013',
    'COORDINACIÓN EN CENTROS DE DESARROLLO INFANTIL',
    'Coordinar la atención infantil integral (Actividades de juego, aprendizaje, cuidado diario, acciones que contribuyan a la salud y nutrición) de niñas y niños de 1 a 3 años de edad, en los centros de desarrollo infantil (CDI) de acuerdo a los lineamientos establecidos en la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Gerentes de centro de cuidado de niños', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Administradoras de centros infantiles', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Administradoras de centros de cuidado infantil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Trabajadoras administrativas, de gestión y responsables de centros de cuidado infantil privados y de Guaguacentros', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Dueños de centros de cuidado infantil', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'FORMACION', 'Educación formal: Tercer año o sexto semestre aprobado la licenciatura o tecnología a fines al perfil.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'EXPERIENCIA', 'Experiencia: 1 año como coordinador/a, jefe de programa o proyectos relacionados con la niñez y adolescencia, estimulación temprana o actividades similares en la atención de niños menores de cinco años.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'CAPACITACION', 'Capacitación: 80 horas de capacitación en la atención infantil integral (aprobado).', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Características de desarrollo evolutivo de las niñas y niños de 0 a 36 meses de edad', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Norma técnica, protocolos, Acuerdos Ministeriales e Interministeriales vigentes', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'Normativa legal vigente (Constitución, Código de la Niñez y Adolescencia)', 3);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-013'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 14: COORDINACIÓN TERRITORIAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRI
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-014',
    'COORDINACIÓN TERRITORIAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL',
    'Coordinar las actividades de articulación y seguimiento a la intervención territorial, vinculada a la dotación de bienes y servicios del paquete priorizado a mujeres gestantes y niños y niñas menores de 24 meses, en el marco de la estrategia Ecuador Crece sin desnutrición infantil, conforme normativa vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Coordinadores de programas de salud infantil', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Profesionales de la salud especializados en pediatría', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Trabajadores sociales enfocados en el bienestar infantil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Nutricionistas y dietistas interesados en la salud infantil', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Responsables de políticas públicas relacionadas con la nutrición y la infancia', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Educadores que deseen contribuir a la conciencia y educación sobre nutrición infantil en comunidades locales', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'FORMACION', 'Educación formal: Tercer nivel.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'EXPERIENCIA', 'Experiencia: 2 años de experiencia comprobada en actividades de coordinación y/o supervisión o cargos similares en programas o proyectos sociales.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'CAPACITACION', 'Capacitación: 20 horas en Metodologías o mecanismos de articulación y vinculación territorial. 20 horas de capacitación planes sociales dirigidos a niños y niñas o afines.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Normativa legal vigente', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Plan Estratégico Intersectorial para la Prevención y Reducción de la Desnutrición Crónica Infantil.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Decretos Ejecutivos relacionados a la DCI', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'Conocimientos sobre Metodologías de ejecución de Mesas Intersectoriales para la prevención y reducción de la desnutrición crónica infantil (DCI)', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-014'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 15: COSMETOLOGÍA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-015',
    'COSMETOLOGÍA',
    'Ejecutar servicios y procedimientos de cosmetología, no invasivos de acuerdo con la normativa vigente, los requerimientos del cliente y protocolos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades de Servicios Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Cosmetólogos', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Instructores de cosmetología', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Especialistas en maquillaje', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Especialistas en cosmetología', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Dueñas o trabajadoras en centros de maquillaje y estética', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Trabajadoras y trabajadores en centros de belleza', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Maquilladoras y maquilladores', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Vendedores de productos cosméticos', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'FORMACION', 'Educación formal: Bachiller (para los títulos extranjeros deberán ser debidamente apostillados).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'EXPERIENCIA', 'Experiencia: 2 años en actividades de cosmetología o cosmiatría debidamente comprobadas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'CAPACITACION', 'Capacitación: 300 horas de capacitación aprobados en temas de cosmetología.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Cosmetología (Estructura y capas de la piel, fototipo de piel, biotipo de piel)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Conocimiento básico de anatomía y fisiología de la piel', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Conocimiento básico para valoración de piel sana', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Protocolos cosmetológicos faciales y corporales no invasivos', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'Productos cosmetológicos faciales y corporales para piel sana', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-015'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 16: COSMIATRÍA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-016',
    'COSMIATRÍA',
    'Ejecutar servicios y procedimientos de cosmiatría no invasivos de acuerdo con la normativa vigente, los requerimientos del cliente y protocolos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades de Servicios Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Especialistas en tratamientos de belleza', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Consultores de belleza', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Esteticistas', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Cosmetólogos', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Técnicos en estética y cuidado de la piel', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Profesionales de la salud con interés en cosmiatría', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Terapeutas faciales y corporales', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Dueños y administradores de spas y centros de estética', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Personas con formación en estética que deseen especializarse en cosmiatría', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'FORMACION', 'Educación formal: Educación general básica – básica media (séptimo).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'EXPERIENCIA', 'Experiencia: 2 años de experiencia en actividades laborales de cosmiatría (certificados laborales emitido por persona natural, persona jurídica o clientes, o declaración jurada).', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'CAPACITACION', 'Capacitación: 300 horas en cosmetología y 360 horas en cosmiatría.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Cosmetología y Cosmiatría (estructura y capas de la piel, alteraciones estéticas de la piel facial, corporal y capilar, fototipo de piel, biotipo de piel)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Anatomía, fisiología de la piel y anexos cutáneos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Conocimiento para la valoración de la piel', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Protocolos y técnicas cosmiátricos faciales, corporales y capilar', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'Productos cosmetológicos faciales', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-016'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 17: CUIDADO DE PERSONAS ADULTAS MAYORES
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-017',
    'CUIDADO DE PERSONAS ADULTAS MAYORES',
    'Proveer el cuidado integral a las personas adultas mayores, con base a sus preferencias y necesidades individuales determinadas por profesionales socio sanitarios cumpliendo la normativa legal vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Atención de la Salud Humana')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Auxiliares de Geriatría', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Profesionales y cuidadores de personas mayores', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Estudiantes o profesionales que deseen ampliar sus conocimientos en el área de geriatría', 3);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'FORMACION', 'Educación formal: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'EXPERIENCIA', 'Experiencia: Certificado laboral mínimo 1 año 6 meses.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'CAPACITACION', 'Capacitación: 240 horas mínimas en temas a fines al cuidado a personas adultas mayores en instituciones legalmente establecidas.', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'OTRO', 'Otro: Certificado de no tener antecedentes penales.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Norma técnica de Centros y Servicios Gerontológicos Residenciales, Atención Diurna, Espacios de Socialización y Encuentro y Atención Domiciliaria', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Ley Orgánica de las Personas Adultas Mayores', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Reglamento de la Ley Orgánica de las Personas Adultas Mayores', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'Convención Interamericana de los Derechos de las Personas Mayores', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-017'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 18: DISEÑO GRÁFICO Y COMUNICACIÓN VISUAL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-018',
    'DISEÑO GRÁFICO Y COMUNICACIÓN VISUAL',
    'Realizar la interpretación y definición de propuestas de diseño gráfico y comunicación visual de complejidad media, utilizando herramientas computacionales de vanguardia y tecnología acordes con las nuevas formas de comunicación e información para lograr respuestas creativas en plazos razonables que incorporen conceptos de identidad, universalidad, contemporaneidad y calidad, ajustadas a los requerimientos del cliente y características de la población objetivo.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales, Científicas y Técnicas')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Diseñador gráfico', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Técnico en comunicación visual', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Auxiliar en diseño gráfico', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Asistente de comunicación y publicidad', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Operador de herramientas digitales de diseño', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'FORMACION', 'Educación formal: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'EXPERIENCIA', 'Experiencia: 1 año de experiencia en la actividad laboral.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'CAPACITACION', 'Capacitación: 20 horas (mínimo), en temas afines a la actividad laboral.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Manejo de la legislación y normativas en el campo de la comunicación.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Bases de la comunicación y la semiótica.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Manejo de la composición visual y fotográfica.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Conocimientos esenciales en el Diseño Gráfico.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Conocimientos básicos de la comunicación visual.', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'Manejo de herramientas tecnológicas.', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-018'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 19: ENTRENAMIENTO CANINO: DEFENSA Y PROTECCIÓN
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-019',
    'ENTRENAMIENTO CANINO: DEFENSA Y PROTECCIÓN',
    'Realizar el adiestramiento canino por especialidad de acuerdo con la normativa nacional e internacional vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Entrenador de perros', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Adiestrador de perros', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Profesionales del mundo de la seguridad y medio ambiente, concretamente en instrucción canina en operaciones de seguridad y protección civil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Personas interesadas en adquirir conocimientos relacionados con el adiestramiento de perros para la defensa y vigilancia', 4);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'FORMACION', 'Educación formal: Bachillerato General Unificado o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'EXPERIENCIA', 'Experiencia: 1 año de experiencia en áreas de entrenamiento de canes en defensa y protección debidamente comprobados.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'CAPACITACION', 'Capacitación: 200 horas de capacitación de técnicas de adiestramiento canino en los últimos 5 años.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Conocimientos básicos de psicología y etología canina', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Conocimientos básicos de comportamiento humano', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Conocimientos básicos de primeros auxilios veterinarios', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Conocimiento de cuidado y mantenimiento de canes y caniles.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'Conocimientos de técnicas de adiestramiento canino en guarda, protección y defensa.', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-019'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 20: ENTRENAMIENTO CANINO: DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSON
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-020',
    'ENTRENAMIENTO CANINO: DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS',
    'Realizar el adiestramiento canino por especialidad de acuerdo con la normativa nacional e internacional vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Entrenador de perros', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Adiestrador de perros', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Profesionales del mundo de la seguridad y medio ambiente, concretamente en instrucción canina en operaciones de seguridad y protección civil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Personas interesadas en adquirir conocimientos relacionados con la instrucción al perro en habilidades de defensa y vigilancia, detección, búsqueda, salvamento y rescate de víctimas', 4);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'FORMACION', 'Educación formal: Bachillerato General Unificado o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'EXPERIENCIA', 'Experiencia: 1 año de experiencia en áreas de entrenamiento de canes en detección de sustancias y localización de personas debidamente comprobadas mediante certificados de trabajo, historia laboral o facturas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'CAPACITACION', 'Capacitación: 200 horas de capacitación de técnicas de adiestramiento canino.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Conocimientos básicos de psicología y etología canina', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Conocimientos básicos de comportamiento humano', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Conocimientos básicos de primeros auxilios veterinarios', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Conocimiento de cuidado y mantenimiento de canes y caniles.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'Conocimientos de técnicas de adiestramiento canino en guarda, protección y defensa.', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-020'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 21: ENTRENAMIENTO CANINO: INTERVENCIÓN ASISTIDA CON CANES
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-021',
    'ENTRENAMIENTO CANINO: INTERVENCIÓN ASISTIDA CON CANES',
    'Realizar el adiestramiento canino por especialidad de acuerdo con la normativa nacional e internacional vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Entrenador de perros', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Adiestrador de perros', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Docentes (inicial, secundaria, bachiller, universidad)', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Consejeros y orientadores escolares', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Docente de enseñanza especial', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Educadores para necesidades especiales', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Psicólogos', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Psicólogos y psicólogas de niños', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Psicólogas de los departamentos de orientación vocacional', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'FORMACION', 'Educación formal: Bachillerato General Unificado o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'EXPERIENCIA', 'Experiencia: Entrenamiento canino (1 año) además de atención a grupos de atención prioritaria (1 año).', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'FORMACION', 'Capacitación: 80 horas de técnicas de adiestramiento canino, 120 horas en el ámbito grupos de atención prioritaria, 50 horas en ciencias de la educación.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Conocimientos básicos de psicología y etología canina', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Conocimientos básicos de comportamiento humano', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Conocimientos de técnicas de adiestramiento canino en guarda, protección y defensa.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'Normativas y leyes: Constitución de la República, Convención sobre los derechos de las personas con discapacidad, Ley Orgánica de discapacidades y su reglamento.', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-021'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 22: EVALUACIÓN DE LA CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-022',
    'EVALUACIÓN DE LA CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA',
    'Determinar el nivel de madurez de la gestión pública, identificando puntos fuertes y áreas de mejora acorde a los criterios del modelo ecuatoriano de calidad y excelencia y su normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Administración Pública y Defensa')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Administradores públicos', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Coordinadores, jefes y responsables de recursos humanos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Gestores de calidad y sistemas de gestión', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Auditores de calidad', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Gestores administrativos y producción', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Lideres y supervisores, jefes y coordinadores, lideres y jefes de área, departamento', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'FORMACION', 'Educación formal: Título de tercer nivel reconocido por el ente rector.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'EXPERIENCIA', 'Experiencia: 2 años en áreas de gestión estratégica, mejora continua; planificación o administración de procesos.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'CAPACITACION', 'Capacitación: 8 horas en el Modelo Ecuatoriano de Calidad y Excelencia. 30 horas de capacitación en otros sistemas de gestión, normas de calidad o Gestión Pública.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Modelo Ecuatoriano de Calidad y Excelencia', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Guía Metodológica de Aplicación del Modelo Ecuatoriano de Calidad y Excelencia', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Gestión Pública (Plan Nacional de Desarrollo, LOTAIP, Código orgánico de planificación y finanzas públicas, LOSEP, Norma Técnica: GPR, Procesos, Servicios, Calidad y Gestión del Cambio)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'Gestión de calidad y mejora continua', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-022'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 23: FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-023',
    'FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN',
    'Facilitar el proceso de enseñanza - aprendizaje en función del grupo objetivo, necesidades de capacitación, estrategias, metodologías y requerimientos institucionales.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades de Enseñanza'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Enseñanza')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Docentes (inicial, secundaria, bachiller, universidad)', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Instructores', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Trainers', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Facilitadores', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Capacitadores', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Toda persona que trabaje en el mundo de la enseñanza - aprendizaje', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'FORMACION', 'Educación formal: Título de Tercer Nivel registrado en la entidad reguladores de la educación.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'EXPERIENCIA', 'Experiencia: 1 año como educador debidamente comprobado.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'CAPACITACION', 'Capacitación: 60 horas de capacitación en temática relacionada con el perfil de cualificación de FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Conocimiento de Metodologías de enseñanza – aprendizaje', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Conocimiento de diseño curricular', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Conocimiento de manejo de conflictos', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Conocimiento de Metodologías de evaluación', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'Conocimiento básico de la Ley Orgánica de Educación Superior y Ley Orgánica de Educación Intercultural', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-023'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 24: FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN - FORMACIÓN DUAL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-024',
    'FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN - FORMACIÓN DUAL',
    'Facilitar el proceso de enseñanza - aprendizaje en función del grupo objetivo, necesidades de capacitación, estrategias, metodologías y requerimientos institucionales.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades de Enseñanza'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Enseñanza')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Docentes de nivel inicial, primaria, secundaria, bachillerato y educación superior', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Instructores de formación técnica o profesional', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Trainers y facilitadores de aprendizaje en contextos empresariales o comunitarios', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Capacitadores de instituciones públicas o privadas', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Formadores técnicos vinculados a la administración educativa o formación profesional', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Toda persona que trabaje en el diseño o ejecución de procesos de enseñanza-aprendizaje, especialmente en contextos de formación profesional o técnica', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'FORMACION', 'Educación formal: Título de Tercer Nivel registrado en la entidad reguladores de la educación.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'FORMACION', 'Experiencia: 6 meses como educador de formación debidamente comprobado.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'FORMACION', 'Capacitación: 40 horas de capacitación en temas de formación de modalidad dual.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Conocimiento de Metodologías de enseñanza – aprendizaje', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Conocimiento de Diseño curricular y elaboración de plan de rotación', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Conocimiento de Manejo de conflictos', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Conocimiento de Metodologías de evaluación relacionado con el entorno laboral-real e institucional', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'Conocimiento básico del Reglamento de Régimen Académico, Reglamento para las carreras y programas en modalidad de formación dual y demás normativa relacionada con prácticas duales', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-024'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 25: FOTÓGRAFO EN MEDIOS Y MULTIMEDIA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-025',
    'FOTÓGRAFO EN MEDIOS Y MULTIMEDIA',
    'Realizar la cobertura periodística a través de registros fotográficos y/o video de hechos y/o asignaciones tomando en consideración las técnicas establecidas (composición, contenido, iluminación) y normas de seguridad y salud en el trabajo.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales, Científicas y Técnicas')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Fotógrafos de prensa', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Videoperiodistas', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Profesionales de medios de comunicación', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Fotógrafos freelance', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Personal multimedia', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'FORMACION', 'Educación formal: Educación básica concluida (séptimo año de educación básica o sexto grado de la educación primaria) o manejo de técnicas instrumentales básicas de lectura, escritura y comprensión de instrucciones verbales y escritas.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'EXPERIENCIA', 'Experiencia: 3 años de experiencia en el campo fotográfico avalados por certificados y/o documentos y/o credenciales y/o contratos y/o publicaciones en medios de comunicación por lo menos uno anual.', 2);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Logística y estrategias para cubrir eventos', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Primeros auxilios básicos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Ley Orgánica de Comunicación y Código del Trabajo', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Formatos para elaborar plan de trabajo', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Tipos de cobertura', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Informática Básica.', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Manejo de equipos fotográficos digitales y analógicos.', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Normas de seguridad y salud en el trabajo', 8);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'Riesgos de trabajo vinculados al campo laboral', 9);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-025'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 26: GESTIÓN ADMINISTRATIVA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-026',
    'GESTIÓN ADMINISTRATIVA',
    'Realizar las operaciones de la gestión administrativa de compraventa de productos y servicios, tesorería y personal, así como la introducción de registros contables predefinidos, previa obtención y procesamiento y archivo de la información necesaria.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Administrativas y de Apoyo de Oficina')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Auxiliares de contabilidad', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Asistentes administrativos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Asistentes financieros', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Asistentes de contabilidad', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Responsables contables', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Profesionales con un mínimo de 2 años de experiencia en contabilidad y similares', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Bachilleres contables', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'FORMACION', 'Educación formal: Bachillerato.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'FORMACION', 'Experiencia: Para Bachiller técnico: Título de Bachiller Técnico a fin al perfil. Para Bachiller: 2 años de experiencia en actividades afines.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'CAPACITACION', 'Capacitación: Ninguna.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Principios y normas de contabilidad', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Leyes tributarias y laborales', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Proceso contable', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Documentos comerciales', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Seguridad social', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'Hoja de cálculo', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-026'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 27: GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-027',
    'GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO',
    'Gestionar la funcionalidad del modelo de atención integral de salud, mediante la coordinación, supervisión y control de los procesos agregadores de valor y habilitantes de apoyo y asesoría, en su jurisdicción.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades de Salud'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Administración Pública y Defensa')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Gerentes de hospitales o clínicas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Directores generales de organizaciones de salud', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Profesionales de la salud', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Profesionales en Gestión Administrativa de la salud', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Administradores de los servicios de salud', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Directores de servicios de salud', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Administradores de grupos de atención médica', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Consultores en gestión de salud', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'FORMACION', 'Educación formal: Profesionales de la salud con título de tercer nivel.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'EXPERIENCIA', 'Experiencia: 3 años en actividades de gestión administrativa en salud.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'CAPACITACION', 'Capacitación: 120 horas en temas relacionados al perfil.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Constitución de la República del Ecuador – referente a la Salud', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Modelo de Atención Integral de Salud y normativa relacionada', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Ley Orgánica de Salud', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Ley del Sistema Nacional de Salud', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Ley Orgánica de Contratación Pública', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Ley Orgánica del Servicio Público', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Código de Trabajo', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'Normas Técnicas de Control Interno', 8);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-027'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 28: GESTIÓN AMBIENTAL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-028',
    'GESTIÓN AMBIENTAL',
    'Implementar el Sistema de Gestión Ambiental (SGA) de la organización, de acuerdo a la normativa ambiental vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Oficinas Principales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Asesores ambientales', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Consultores ambientales', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Planificadores ambientales', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Analistas ambientales', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Diseñador ambientalista', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Profesionales del ambiente, estudiantes o egresados de carreras ambientales o afines', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'FORMACION', 'Educación formal: 6 semestre de universidad (aprobado), en carreras afines a la actividad laboral.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'EXPERIENCIA', 'Experiencia: 2 años de experiencia en la actividad laboral. Con certificados de prácticas o pasantías pre profesionales.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'CAPACITACION', 'Capacitación: 40 horas mínimas en temas afines a la actividad laboral. Con una vigencia máxima de 5 años.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Prevención y reducción de la contaminación ambiental', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Manejo de desechos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Emergencias y contingencias ambientales', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Auditoría Ambiental', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'Normativa Ambiental vigente', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-028'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 29: GESTIÓN DE SOLDADURA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-029',
    'GESTIÓN DE SOLDADURA',
    'Realizar operaciones de soldadura sobre metales y corte por proyección térmica, aplicando procesos O.A.W (soldadura oxiacetilénica), S.M.A.W (soldadura por arco metálico protegido), G.M.A.W (soldadura por arco metálico con protección gaseosa).',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Metalmecánica'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Fabricación de Productos Elaborados de Metal')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Tecnólogos en soldadura', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Soldadores especializados en gas, gas y electricidad, horno, y oxiacetileno', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Profesionales con conocimientos en electricidad básica aplicada a la soldadura', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Individuos versados en tipos de materiales y características de los materiales de aportación en soldadura', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Trabajadores con sólidos conocimientos en seguridad e higiene industrial específicos para el ámbito de la soldadura', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Especialistas en ensayo de materiales relacionados con procesos de soldadura', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'FORMACION', 'Educación formal: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'FORMACION', 'Experiencia: Para Bachiller técnico: Título de Bachiller Técnico a fin al perfil. Para Bachiller: 3 años de experiencia en actividades afines.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'CAPACITACION', 'Capacitación: No aplica.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Electricidad básica', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Tipos de materiales', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Seguridad e higiene Industrial', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Dibujo técnico', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Ensayo de materiales', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Tipos de cordones', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Posiciones de soldadura', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Características de los materiales de aportación', 8);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Metrología básica', 9);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'Tipos de juntas', 10);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-029'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 30: GESTIÓN EN PROMOCIÓN DE MARCAS, PRODUCTOS Y SERVICIOS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-030',
    'GESTIÓN EN PROMOCIÓN DE MARCAS, PRODUCTOS Y SERVICIOS',
    'Gestionar actividades de participación, posicionamiento, promoción y/o activación de marcas, productos o servicios, acorde a los objetivos organizacionales establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '4 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Comercialización y Venta de productos'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Publicidad y Estudio de Mercado')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Jefes de departamento de publicidad', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Especialistas en marketing', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Especialistas en publicidad', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Licenciados en marketing y publicidad', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Jefes de departamento de comercialización y ventas', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Publicistas y responsables de campaña publicitaria', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Ingenieros comerciales', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Estudiantes de marketing, ingeniería comercial, publicidad o comunicación', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'FORMACION', 'Educación formal: Cursando carreras de Tercer nivel en marketing, ingeniería comercial, publicidad, comunicación, administración, gestión empresarial o afines.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'EXPERIENCIA', 'Experiencia: 1 año en actividades afines al perfil.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'CAPACITACION', 'Capacitación: 8 horas en temas relacionados a marketing o promoción.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Marketing MIX y Trade Marketing', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Diseño gráfico y Ofimática media', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Redacción publicitaria', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Benchmarking', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Merchandising', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Publicidad y Canales de distribución', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Relaciones públicas', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Análisis de mercado', 8);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Marketing de servicios', 9);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'Administrativos', 10);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-030'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 31: GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-031',
    'GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS',
    'Gestionar los riesgos dentro y fuera del balance para evitar afectaciones económicas en el patrimonio de las instituciones considerando la normativa nacional y las mejores prácticas internacionales.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Servicios Financieros'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Auxiliares de las Actividades de Servicios')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Estudiante de cuarto semestre en carreras como Contabilidad y Auditoría, Gestión Financiera, Administración, Economía, Derecho, y Sistemas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Estudiante en Desarrollo en el área de Cumplimiento Normativo', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Director financiero (10 empleados y más)', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Planificador financiero', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Consultor financiero', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'FORMACION', 'Educación formal: Estudiantes de cuarto semestre en carreras como Comercial y Administración, Matemáticas, Economía, Derecho y Sistemas.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'EXPERIENCIA', 'Experiencia: 4 años de experiencia en diversos sectores financieros. Verificada mediante certificados, historial laboral, RUC y facturación.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'CAPACITACION', 'Capacitación: 60 horas en Riesgos Financieros y 20 horas en Excel en los últimos 5 años.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Conocimientos financieros', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Conocimientos contables', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Conocimientos administrativos', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Conocimientos estadísticos', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Conocimientos en administración integral de riesgos', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Código Orgánico Monetario y Financiero', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'Codificación de Resoluciones Monetarias, Financieras, de Valores y de Seguros.', 7);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-031'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 32: INSTALACIONES ELÉCTRICAS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-032',
    'INSTALACIONES ELÉCTRICAS',
    'Realizar instalaciones eléctricas en edificios, locales comerciales y viviendas, cumpliendo con normas de higiene, salud y seguridad en el trabajo.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Especializadas de la Construcción')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Electricistas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Maestros eléctrico – electrónicos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Instaladores eléctricos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Instaladores de equipos eléctricos', 4);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'FORMACION', 'Educación formal: Leer y escribir; manejo de 4 operaciones aritméticas: sumar, restar, multiplicar y dividir.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'CAPACITACION', 'Capacitación: Instalaciones eléctricas 40 horas y control industrial 40 horas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'EXPERIENCIA', 'Experiencia: Haber participado en al menos cinco instalaciones eléctricas, ya sean en edificios, locales comerciales o viviendas.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Interpretación de Planos Eléctricos.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Conocimiento de las "cinco reglas de oro de las instalaciones eléctricas"', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Conocimiento de la Norma INEN 019 (Normativa relacionada a Prevención de Incendios-Instalaciones a prueba de explosión)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Detección de averías', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'Mantenimiento de equipos', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-032'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 33: INSTALACIONES HIDROSANITARIAS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-033',
    'INSTALACIONES HIDROSANITARIAS',
    'Realizar las instalaciones hidrosanitarias, mantenimiento y reparación de aparatos hidrosanitarios, cumpliendo el requerimiento del contratante, las normas técnicas de la construcción, de seguridad y salud en el trabajo y medio ambiente vigentes.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Construcción'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Especializadas de la Construcción')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Constructores', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Ingenieros', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Arquitectos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Estudiantes de ingeniería y arquitectura', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Técnicos de mantenimiento', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Plomeros', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Instaladores hidrosanitarios', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Estudiantes de Ingeniería Civil', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Estudiantes y profesionales involucrados en el sector de la construcción y en el diseño de instalaciones eléctricas e hidrosanitarias', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'FORMACION', 'Educación formal: Educación General Básica (primaria).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'EXPERIENCIA', 'Experiencia: 3 años mínimo desarrollando la actividad de instalaciones de hidrosanitarias comprobado mediante facturas, certificados laborales, mecanizados del IESS.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'CAPACITACION', 'Capacitación: 40 horas en temas relacionados a las unidades de competencia de los últimos 5 años.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Interpretación de planos y detalles', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Manejo de equipos y herramientas', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Mantenimiento y reparación de aparatos hidrosanitarios', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Normativa de seguridad y salud en el trabajo y Reglamento de seguridad para la construcción', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Normativa ambiental', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'Normas Ecuatorianas de la Construcción – Hidrosanitarias', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-033'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 34: MAQUILLAJE
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-034',
    'MAQUILLAJE',
    'Aplicar técnicas de maquillaje de acuerdo al requerimiento del cliente, factores externos y protocolos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades de Servicios Profesionales')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Especialistas en maquillaje y cosmetología', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Dueñas o trabajadoras en centros de maquillaje y estética', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Trabajadoras y trabajadores en centros de belleza', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Maquilladoras y maquilladores', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Vendedores de productos cosméticos', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Maquilladores de artistas, cine, salón y teatro', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'FORMACION', 'Educación formal: Educación general básica (hasta 7mo de básica).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'EXPERIENCIA', 'Experiencia: 1 año en actividad de maquillaje debidamente comprobadas mediante certificado de trabajo, copia de RUC con sus facturas, contrato del trabajo.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'CAPACITACION', 'Capacitación: 80 horas aprobadas en temas de maquillaje.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Colorimetría aplicada al maquillaje', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Técnicas de maquillaje', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Equipos, herramientas, insumos de maquillaje', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Tipos y cuidado de la piel', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Productos cosméticos de maquillaje', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Conocimiento sobre condiciones fisiológicas y fisonomía (Visagismo y morfología)', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'Conocimiento básico de normativa de higiene, seguridad y salud en el trabajo.', 7);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-034'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 35: NEURODESARROLLO Y NECESIDADES EDUCATIVAS ESPECIALES EN EL PERIODO INFA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-035',
    'NEURODESARROLLO Y NECESIDADES EDUCATIVAS ESPECIALES EN EL PERIODO INFANTOJUVENIL',
    'Atender a niños, adolescentes y jóvenes con necesidades educativas especiales de acuerdo a lo establecido en la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Psicólogos y psicólogas de niños', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Psicólogas de los departamentos de orientación vocacional', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Profesionales que dirigen institutos o centros de desarrollo y neurodesarrollo infantil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Consejero estudiantiles', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Orientadores escolares', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Educadores para necesidades especiales', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Docentes de enseñanza especial', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'FORMACION', 'Educación formal: 4to semestre mínimo de Universidad en carreras afines (Si no se cuenta con experiencia laboral). Bachillerato para personal de salud o educación que ya estuvieran o hubiese ejerciendo funciones.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'EXPERIENCIA', 'Experiencia: Mínimo un año acumulable en el cargo o funciones en centros educativos.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'FORMACION', 'Capacitación: 40 horas relacionadas a la educación o salud mental.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Neurodesarrollo', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Adaptaciones curriculares significativas y no significativas', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Gestión del DECE', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'Intervención neurocognitiva a los trastornos del neurodesarrollo.', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-035'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 36: OFIMÁTICA: ASISTENCIA ADMINISTRATIVA CON MANEJO DE OFIMÁTICA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-036',
    'OFIMÁTICA: ASISTENCIA ADMINISTRATIVA CON MANEJO DE OFIMÁTICA',
    'Ejecutar actividades operativas de apoyo de gestión administrativa internas y externas mediante el uso de las herramientas de ofimática, tomando en consideración los procedimientos y políticas internas vigentes.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Tecnología: Hardware y Software (Incluye TICS)'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Administrativas y de Apoyo de Oficina')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Asistente administrativo', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Auxiliar administrativo', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Secretaria/o', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Recepcionista', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Digitador de datos', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Auxiliar de archivo', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Personal de atención al cliente', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Auxiliar de gestión documental', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Operador de ofimática en oficinas públicas o privadas', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'FORMACION', 'Nivel de Formación: Educación básica reconocido por la autoridad competente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'EXPERIENCIA', 'Experiencia: No aplica.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'CAPACITACION', 'Capacitación: No aplica.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Uso de equipos tecnológicos', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Clasificación de documentos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Atención al cliente', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Técnicas de archivo', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Procesador de textos', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Hoja de Cálculo', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Aplicación para presentaciones', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'Manejo de internet', 8);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-036'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 37: OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE 
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-037',
    'OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA - LÍNEAS AÉREAS',
    'Ejecutar la operación y mantenimiento (predictivo, preventivo y/o correctivo) del sistema de distribución de energía eléctrica (área y subterránea), asegurando su operatividad y disponibilidad del servicio de acuerdo con estándares de calidad, protocolos y procedimientos de la empresa.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '4 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Electricidad gas y agua'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Suministro de Electricidad, Gas, Vapor y Aire Acondicionado')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Electricista de alta tensión', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Electrotécnico en alta tensión', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Electrotécnico en energía eléctrica / distribución', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Técnico electricista en general', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Operador de redes de distribución eléctrica', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Técnico en mantenimiento de instalaciones eléctricas', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Personal de empresas distribuidoras de energía eléctrica', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'FORMACION', 'Nivel de Formación: Bachiller General, Bachiller Técnico o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'EXPERIENCIA', 'Experiencia: 2 años en actividades relacionadas en instalaciones con energía eléctrica en líneas aéreas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en temas del sistema de distribución de energía eléctrica.', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'OTRO', 'Otro: Certificación en competencias laborales en Prevención de Riesgos Laborales: energía eléctrica (obligatorio) emitido por OEC reconocido por el Ministerio del Trabajo.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Componentes y funcionamiento del sistema de distribución eléctrico (redes aéreas)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Técnicas de diagnóstico (pruebas, medidas)', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Tipos de mantenimiento (predictivo, preventivo, correctivo)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Las 5 reglas de oro del electricista', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Normativa de seguridad y salud en el trabajo y normativa de ambiente y agua relacionado con su actividad', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'Conocimiento básico de regulación de calidad del servicio y mantenimiento', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-037'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 38: OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE 
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-038',
    'OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA - LÍNEAS SUBTERRÁNEAS',
    'Ejecutar la operación y mantenimiento (predictivo, preventivo y/o correctivo) del sistema de distribución de energía eléctrica (área y subterránea), asegurando su operatividad y disponibilidad del servicio de acuerdo con estándares de calidad, protocolos y procedimientos de la empresa.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '4 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Electricidad gas y agua'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Suministro de Electricidad, Gas, Vapor y Aire Acondicionado')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Electricista de alta tensión', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Electrotécnico en energía eléctrica (líneas subterráneas)', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Técnico electricista en mantenimiento de redes subterráneas', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Operador de sistemas de distribución eléctrica subterránea', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Técnico en mantenimiento predictivo, preventivo y correctivo de instalaciones eléctricas', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Personal de empresas distribuidoras de energía eléctrica', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'FORMACION', 'Nivel de Formación: Bachiller General, Bachiller Técnico o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'EXPERIENCIA', 'Experiencia: 2 años en actividades relacionadas en instalaciones con energía eléctrica en líneas subterráneas.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en temas del sistema de distribución de energía eléctrica.', 3);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'OTRO', 'Otro: Certificación en competencias laborales en Prevención de Riesgos Laborales: energía eléctrica (obligatorio) emitido por OEC reconocido por el Ministerio del Trabajo.', 4);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Componentes y funcionamiento del sistema de distribución eléctrico (redes subterráneas)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Técnicas de diagnóstico (pruebas, medidas)', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Tipos de mantenimiento (predictivo, preventivo, correctivo)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Las 5 reglas de oro del electricista', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Normativa de seguridad y salud en el trabajo y normativa de ambiente y agua relacionado con su actividad', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'Conocimiento básico de regulación de calidad del servicio y mantenimiento', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-038'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 39: OPERACIONES ARCHIVÍSTICAS / ADMINISTRACIÓN DE ARCHIVOS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-039',
    'OPERACIONES ARCHIVÍSTICAS / ADMINISTRACIÓN DE ARCHIVOS',
    'Administrar la información manual o automatizada de la gestión documental y archivo de acuerdo a normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Bibliotecas Archivos Museos y Otras')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Archivistas profesionales', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Auxiliares de archivo', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Profesionales de gestión documental', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Personal administrativo con responsabilidades en archivo', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Estudiantes o graduados en áreas relacionadas con la documentación y archivos', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Empleados de empresas privadas responsables de archivos y documentos', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Personas interesadas en adquirir habilidades en la administración eficiente de archivos y documentos', 7);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'FORMACION', 'Nivel de Formación: Bachiller.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'EXPERIENCIA', 'Experiencia: 3 años de experiencia en ejecución de procesos de archivo.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'CAPACITACION', 'Capacitación: 40 horas de capacitación en actividades afines a la actividad (asistencia y aprobación).', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Constitución de la República (Derecho y acceso a la información)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Ley del sistema Nacional de archivo y sus reglamentos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Ley Orgánica de Transparencia y acceso a la información pública', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Normas de control interno de la Contraloría General del Estado', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Código Orgánico Administrativo', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'Regla Técnica Nacional', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-039'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 40: OPERACIONES AUXILIARES EN LIMPIEZA DE UNIDADES DE SALUD
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-040',
    'OPERACIONES AUXILIARES EN LIMPIEZA DE UNIDADES DE SALUD',
    'Realizar la limpieza y manejo de desechos de las unidades de salud de acuerdo a la normativa legal vigente y procedimientos establecidos.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '2 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Descontaminación')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Auxiliar de limpieza en unidades de salud', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Personal de apoyo en bioseguridad', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Operador de limpieza hospitalaria', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Técnico en manejo de desechos sanitarios', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Personal de mantenimiento y aseo en instituciones de salud', 5);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'FORMACION', 'Nivel de Formación: Educación general básica.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'EXPERIENCIA', 'Experiencia: 6 meses en actividades relacionadas al perfil.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'CAPACITACION', 'Capacitación: 60 horas en temas relacionados al perfil.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Manejo y uso de productos químicos', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Manejo y utilización de maquinaria, equipos, insumos y materiales', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Manual de Bioseguridad', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'Manejo de desechos', 4);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-040'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 41: OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-041',
    'OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS',
    'Realizar trabajos de operación y mantenimiento en redes y líneas energizadas de transmisión y distribución, de acuerdo a procedimientos internos y normativa legal vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Electricidad Gas y Agua'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Suministro de Electricidad Gas Vapor y Aire Acondicionado')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Ayudante operador de instalaciones de central hidroeléctrica', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Operador de instalaciones, central de producción de energía eléctrica', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Operador de máquinas fijas de producción eléctrica', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Operador de planta energía eléctrica', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Electricistas', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Maestros eléctrico – electrónicos', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Instaladores eléctricos', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Instaladores de equipos eléctricos', 8);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'FORMACION', 'Educación formal: Bachiller en electricidad o electromecánica.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'EXPERIENCIA', 'Experiencia: 1 año de experiencia en trabajos con líneas energizadas, evidenciable a través de Certificados.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'CAPACITACION', 'Capacitación: 80 horas de capacitación como: liniero u operador de red aérea o líneas energizadas y red subterránea, o redes de distribución y 40 horas de capacitación en temas de seguridad inherentes a la actividad.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Normativa legal vigente', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Normativas relacionadas con seguridad y salud ocupacional', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Identificación de equipos de protección y seccionamiento en los sistemas de distribución.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Trabajo en altura', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Identificación de equipos y herramientas para realizar trabajos en contacto con redes de distribución', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'Conocimientos básicos en ofimática.', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-041'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 42: PREPARACIÓN GASTRONÓMICA DE COCINA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-042',
    'PREPARACIÓN GASTRONÓMICA DE COCINA',
    'Ejecutar procesos de pre-elaboración, elaboración y montaje de alimentos de acuerdo con los protocolos establecidos y la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Transformación de Alimentos'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Elaboración de Productos Alimenticios')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en restaurantes y locales comerciales', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en barcos y cruceros (incluyendo servicio a la tripulación)', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en hospitales, cárceles y comedores institucionales', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en campamentos de trabajo y brigadas', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros especializados en dietas especiales y alimentación saludable', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en servicio doméstico', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros de comida rápida', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en catering, banquetería y eventos', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Cocineros en programas sociales y comunitarios', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'FORMACION', 'Educación formal: Bachiller general unificado o su equivalente.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'EXPERIENCIA', 'Experiencia: 3 años de experiencia en la actividad de preparaciones gastronómicas de cocina debidamente comprobadas (certificado laboral, RUC o declaración juramentada).', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'CAPACITACION', 'Capacitación: 60 horas de capacitación en temas relacionados con el perfil.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Normas de seguridad industrial y ocupacional', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Materia prima y características organolépticas', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Técnicas de cocina', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Métodos de cocción', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Conocimientos básicos de nutrición', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Técnicas de montaje y emplatado', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Receta estándar', 7);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Manejo de mermas', 8);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'Equipo, menaje y mobiliario', 9);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'BMP', 10);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-042'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 43: PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: CONSTRU
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-043',
    'PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: CONSTRUCCIÓN Y OBRA CIVIL',
    'Ejecutar actividades laborales de alto riesgo cumpliendo con los procedimientos de trabajo seguro establecidos por el empleador, el cargo que desempeña, las especificaciones técnicas definidas, la normativa de seguridad y salud en el trabajo, así como sus reglamentos e instrumentos técnicos vigentes.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '4 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales Técnicas')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Constructores', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Albañiles', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Asistentes de albañilería', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Pintores', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Maestros de obra', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Maestros de terminados', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Contratistas', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Gerente de obra', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Superintendente de obra', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Residente de obra', 10);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Supervisores', 11);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Maestros mayores', 12);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'FORMACION', 'Educación formal: Educación General Básica media (hasta 7 de básica), o su equivalente o examen de lecto-escritura.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'EXPERIENCIA', 'Experiencia: Seis meses en actividades concernientes con construcción y/u obra civil de acuerdo con lo establecido en los artículos 146 y 147 del REGLAMENTO DE SEGURIDAD PARA LA CONSTRUCCION Y OBRAS PUBLICAS evidenciadas a través de certificados o contratos.', 2);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Peligros en trabajos del área de construcción y evaluación de los riesgos de su actividad', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Trabajo seguro en el área de construcción (en altura, espacios confinados, levantamiento de muros, excavación, entre otros)', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Conocimiento de medidas preventivas (fuentes de peligro, medio, colectivo y persona)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Verificación de dispositivos de seguridad y estado de los equipos, herramientas, maquinarias y materiales de trabajo', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'Actos y condiciones inseguras o subestándar', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-043'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 44: PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: ENERGÍA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-044',
    'PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: ENERGÍA ELÉCTRICA',
    'Ejecutar actividades laborales de alto riesgo cumpliendo con los procedimientos de trabajo seguro establecidos por el empleador, el cargo que desempeña, las especificaciones técnicas definidas, la normativa de seguridad y salud en el trabajo, así como sus reglamentos e instrumentos técnicos vigentes.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '4 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales Técnicas')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Maestros electricistas', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Constructores y supervisores', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Asistentes de maestros eléctricos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Ingenieros eléctricos', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Jefes de mantenimiento', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Asistentes y ayudantes de mantenimiento', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Operarios en trabajos de aislación', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Operarios de construcción / trabajos a gran altura', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Ayudantes de electricista', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Técnicos electricistas en general', 10);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'FORMACION', 'Educación formal: Educación General Básica media (hasta 7 de básica), o su equivalente o examen de lecto-escritura.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'EXPERIENCIA', 'Experiencia: Un año de experiencia en actividades concernientes en energía eléctrica de acuerdo con el artículo 29 del REGLAMENTO DE SEGURIDAD DEL TRABAJO CONTRA RIESGOS EN INSTALACIONES DE ENERGÍA ELÉCTRICA evidenciadas a través de certificados o contratos.', 2);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Peligros en trabajos con energía eléctrica y evaluación de los riesgos de su actividad', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Trabajo seguro con tensión y sin tensión eléctrica', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Conocimiento de medidas preventivas (fuentes de peligro, medio, colectivo y persona)', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Verificación de dispositivos de seguridad y estado de los equipos, herramientas, maquinarias y materiales de trabajo', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'Actos y condiciones inseguras o subestándar', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-044'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 45: PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO Y DE LA 
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-045',
    'PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO Y DE LA AFECTIVIDAD',
    'Atender a niños, adolescentes y jóvenes con necesidades educativas especiales de acuerdo a lo establecido en la normativa vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades de Asistencia Social sin Alojamiento')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Psicólogos', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Psiquiatras', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Médicos relacionados con cuidados y desarrollo infantil', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Psicólogas de los departamentos de orientación vocacional', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Docentes y personal del DECE', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Personas que trabajen en ONG', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Consejeros estudiantiles', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Orientadores escolares', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Educadores para necesidades especiales', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Docentes de enseñanza especial', 10);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'FORMACION', 'Educación formal: 4to semestre mínimo de Universidad en carreras afines (Si no se cuenta con experiencia laboral). Bachillerato para personal de salud o educación que ya estuvieran o hubiese ejerciendo funciones.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'EXPERIENCIA', 'Experiencia: Mínimo un año acumulable en el cargo o funciones en centros educativos o personal del DECE.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'FORMACION', 'Capacitación: 40 horas relacionadas a la educación o salud mental.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Intervención en violencia: Física, psicológica, sexual en la infancia y adolescencia.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Trastornos de la afectividad: Ansiedad, Depresión y autoestima.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Adicciones: Prevención e intervención.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Modelos de Intervención en crisis.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Trastornos de personalidad y conducta.', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Enfoque de derechos en población LGTBI.', 6);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'Primeros Auxilios Psicológicos (PAP)', 7);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-045'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 46: SEGURIDAD INDUSTRIAL
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-046',
    'SEGURIDAD INDUSTRIAL',
    'Ejecutar actividades de apoyo a la gestión técnica operativa de la seguridad industrial de acuerdo con la norma técnica de seguridad en el trabajo y prevención de riesgos laborales; normativa de ambiente y agua; normas y especificaciones técnicas; normas técnicas, procedimientos establecidos y plan de riesgos de la empresa.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Otras Actividades Profesionales, Científicas y Técnicas')
);

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Técnicos en seguridad y salud ocupacional', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Supervisores de seguridad industrial', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Responsables de prevención de riesgos laborales', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Coordinadores de higiene y seguridad en el trabajo', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Inspectores de seguridad industrial', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Jefes de seguridad y medio ambiente', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Personal de brigadas de emergencia', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Consultores en seguridad laboral', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Operadores y técnicos de plantas industriales con funciones de seguridad', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'FORMACION', 'Educación formal: Bachillerato General (Complementario Técnico Productivo).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'FORMACION', 'Experiencia: 1200 horas, la formación se desarrolla en la institución educativa (hasta 600 horas) y en la entidad receptora (mínimo 600 horas).', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'FORMACION', '*ESQUEMA EXCLUSIVO PARA INSTITUCIONES EDUCATIVAS REGENTADAS POR EL MINISTERIO DE EDUCACIÓN.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Conocimientos de Equipos de Protección Personal', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'Conocimientos de Riesgos laborales, evaluación de los riesgos (ergonomía, mapas de riesgos, ambientes de trabajo, distribución de planta, señaléticas, riesgos físicos, riesgos químicos, riesgos biológicos, manejo de residuos entre otros) y Planta Industrial (distribución y condiciones generales).', 2);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-046'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 47: SOLDADURA
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-047',
    'SOLDADURA',
    'Unir elementos cumpliendo con las normas establecidas de soldadura, seguridad y salud en el trabajo, estándares de calidad de medio ambiente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Metalmecánica'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Fabricación de Productos Elaborados de Metal')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Soldadores de soldadura blanda/a mano, cautín, y soplete de puntos', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Operadores de soplete de puntos', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Profesionales en soldadura con experiencia en la lectura de planos técnicos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Individuos con conocimientos sólidos en normas de seguridad, calidad, medio ambiente e higiene en el ámbito de la soldadura', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Soldadores con habilidades en instrumentación relacionada con procesos de soldadura', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Personas familiarizadas con diferentes tipos de procesos de soldadura y corte', 6);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'FORMACION', 'Educación formal: Educación básica (primaria).', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'EXPERIENCIA', 'Experiencia: 2 años de experiencia relacionados al perfil.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'CAPACITACION', 'Capacitación: No aplica.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Lee planos técnicos de soldadura.', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Tiene conocimiento de normas de seguridad, calidad, medio ambiente e higiene.', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Posee conocimientos de instrumentación.', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Conoce los diferentes tipos de procesos de soldadura y corte.', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'Posee conocimientos de electricidad básica.', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-047'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 48: SUPERVISIÓN DE EDIFICACIONES Y OBRAS CIVILES
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-048',
    'SUPERVISIÓN DE EDIFICACIONES Y OBRAS CIVILES',
    'Supervisar las actividades y ejecución de la obra de acuerdo a las disposiciones de la dirección, diseño y especificaciones técnicas del proyecto, normas de seguridad y salud en el trabajo, reglamento interno, reglamento de seguridad y norma ambiental.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '5 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Construcción'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Actividades Especializadas de la Construcción')
) ON CONFLICT (nombre) DO NOTHING;

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Jefes y supervisores de obra de construcción', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Residentes de obra', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Auditores de obra', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Ingeniero fiscalizador de construcción', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Arquitectos', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Inspectores técnicos de ingeniería civil', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Inspectores de obras y edificios', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Administradores de construcción', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Auxiliares de superintendente de constructora', 9);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Supervisor de colado de materiales de construcción', 10);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Supervisor de construcción de edificios', 11);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'FORMACION', 'Educación formal: Técnicos, Tecnólogos e Ingenierías en el ámbito de obra civil y arquitectura.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'EXPERIENCIA', 'Experiencia: 5 años mínimo de experiencia en actividades relacionadas al perfil.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'CAPACITACION', 'Capacitación: 120 horas en cursos o seminarios que avalan la actividad de la construcción materiales y equipos.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Planos y diseños que contienen las ingenierías del proyecto', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Sistemas de construcción y procesos constructivos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Técnicas de la ejecución de obra', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Normativa legal (constitución del ecuador, norma ambiental, código de trabajo y normativa de seguridad y salud en el trabajo)', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'Normas Ecuatorianas De Construcción', 5);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-048'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


-- -----------------------------------------------------------------------
-- Cert 49: SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL Y ARCHIVO
-- -----------------------------------------------------------------------
INSERT INTO matsso.certificacion (codigo, nombre, descripcion, id_vigencia, id_familia, id_sector)
VALUES (
    'CERT-049',
    'SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL Y ARCHIVO',
    'Controlar los procesos de gestión documental y archivo institucional de conformidad a las políticas, objetivos institucionales y normativa legal vigente.',
    (SELECT id_vigencia FROM matsso.vigencia WHERE etiqueta = '3 años'),
    (SELECT id_familia  FROM matsso.familia  WHERE nombre   = 'Actividades Tipo Servicios'),
    (SELECT id_sector   FROM matsso.sector   WHERE nombre   = 'Administración Pública y Defensa; Planes de Seguridad')
);

INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Jefes de archivo', 1);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Supervisores de archivos y gestión documental', 2);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Gerentes de departamentos administrativos', 3);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Profesionales de gestión de información', 4);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Jefes de oficina y administradores', 5);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Especialistas en administración de documentos', 6);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Personal con responsabilidades de supervisión en el área de archivos', 7);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Profesionales de bibliotecas y centros de información', 8);
INSERT INTO matsso.perfil_dirigido (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Líderes de proyectos relacionados con la gestión documental', 9);

INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'FORMACION', 'Nivel de Formación: 3 nivel de Educación Superior.', 1);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'EXPERIENCIA', 'Experiencia: 5 años en actividades de Gestión Documental y Archivo.', 2);
INSERT INTO matsso.requisito (id_certificacion, tipo, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'CAPACITACION', 'Capacitación: 100 horas en gestión documental y archivo.', 3);

INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Constitución de la República (Derecho y acceso a la información)', 1);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Ley del sistema Nacional de archivo y sus reglamentos', 2);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Ley Orgánica de Transparencia y acceso a la información pública', 3);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Normas de control interno de la Contraloría General del Estado', 4);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Código Orgánico Administrativo', 5);
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'Regla Técnica Nacional', 6);

INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'TEORICO', 'TEÓRICO: Resolución de un banco de preguntas para determinar su conocimiento en el perfil. Mínimo 70% de aprobación.', 70.0, 100.0);
INSERT INTO matsso.evaluacion (id_certificacion, modalidad, descripcion, porcentaje_minimo, porcentaje_max) VALUES ((SELECT id_certificacion FROM matsso.certificacion WHERE codigo = 'CERT-049'), 'PRACTICO', 'PRÁCTICO: Ejercicios prácticos para determinar que posee las competencias del perfil. 100% de aprobación.', 100.0, 100.0);


COMMIT;

-- =============================================================================
-- VERIFICACIÓN POST-INSERCIÓN
-- =============================================================================
SELECT 'familias'        AS tabla, COUNT(*) AS total FROM matsso.familia;
SELECT 'sectores'        AS tabla, COUNT(*) AS total FROM matsso.sector;
SELECT 'vigencias'       AS tabla, COUNT(*) AS total FROM matsso.vigencia;
SELECT 'certificaciones' AS tabla, COUNT(*) AS total FROM matsso.certificacion;
SELECT 'perfiles'        AS tabla, COUNT(*) AS total FROM matsso.perfil_dirigido;
SELECT 'requisitos'      AS tabla, COUNT(*) AS total FROM matsso.requisito;
SELECT 'conocimientos'   AS tabla, COUNT(*) AS total FROM matsso.conocimiento;
SELECT 'evaluaciones'    AS tabla, COUNT(*) AS total FROM matsso.evaluacion;

-- Vista rápida
SELECT * FROM matsso.v_cert_resumen ORDER BY nombre LIMIT 10;

-- =============================================================================
-- FIN DEL SCRIPT DML
-- =============================================================================
-- >>> FIN DE 02_matsso_dml_inserts.sql <<<


-- =============================================================================
-- POBLAR PRODUCTOS DEL E-COMMERCE DESDE EL CATÁLOGO MATSSO
-- =============================================================================
INSERT INTO public.productos (tipo, titulo, descripcion, precio, horas, modalidad, activo, id_certificacion)
SELECT 'CERTIFICACION', c.nombre, c.descripcion, 100.00, 40, 'PRESENCIAL', c.activo, c.id_certificacion
FROM matsso.certificacion c;



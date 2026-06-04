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

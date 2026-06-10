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

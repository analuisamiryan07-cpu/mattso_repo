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

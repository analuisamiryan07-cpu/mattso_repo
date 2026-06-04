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

-- =============================================================================
-- SCRIPT DE PREPARACIÓN DE BASE DE DATOS LOCAL PARA SISTEMA PHP
-- =============================================================================

-- 1. Tabla de administradores (Secretarias / Personal Interno)
CREATE TABLE IF NOT EXISTS public.usuarios_admin (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'SECRETARIA',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuarios por defecto con contraseña encriptada usando bcrypt
-- Las contraseñas en texto plano son '1234' y 'admin'
INSERT INTO public.usuarios_admin (usuario, password_hash, rol) VALUES 
('Mnanaluisa', '$2y$10$Oba3jafsatD3.JbZ7RzGmuVq0HUaegwenBRr92QkgbqC/EvuAZwDS', 'SECRETARIA'), -- 1234
('admin', '$2y$10$78IQH8aqm5kc0Tqw2Z15ceaBY19AJcV3R5Kq1Kbs2vmyvTqTR7rjy', 'ADMINISTRADOR') -- admin
ON CONFLICT (usuario) DO NOTHING;

-- 2. Tabla para llevar control de los documentos generados por cada candidato
CREATE TABLE IF NOT EXISTS public.documentos_generados (
    id SERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    carpeta VARCHAR(255) NOT NULL,
    zip_ruta VARCHAR(255) NOT NULL,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    n_archivos INT DEFAULT 0,
    nombres_archivos JSONB,
    generado_por VARCHAR(50),
    
    CONSTRAINT fk_doc_cliente FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE
);

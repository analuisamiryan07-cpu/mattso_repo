CREATE TABLE familias (
    id_familia SERIAL PRIMARY KEY,
    fam_descripcion VARCHAR(50) NOT NULL,
    CONSTRAINT chk_fam_descripcion
    CHECK (fam_descripcion ~ '^[A-Za-zÁÉÍÓÚáéíóúÑñ, ]+$')
);

INSERT INTO familias (fam_descripcion) VALUES 
('Electricidad Gas y Agua'),
('Actividades Tipo Servicios'),
('Metalmecánica'),
('Construcción'),
('Servicios Financieros'),
('Transporte, Almacenamiento y Logística'),
('Actividades de Enseñanza'),
('Actividades de Salud'),
('Comercialización y Veta de Productos');

CREATE TABLE sector (
    id_sector SERIAL PRIMARY KEY,
    sec_descripcion VARCHAR(80) NOT NULL,
    
    CONSTRAINT chk_sec_descripcion
    CHECK (
        sec_descripcion ~ '^[A-Za-zÁÉÍÓÚáéíóúÑñ;., ]+$'
    )
);



INSERT INTO sectores (sec_descripcion) VALUES
('Suministro de Electricidad'),
('Actividades Administrativas y de Apoyo de Oficina y Otras Actividades de Apoyo'),
('Fabricación de Productos Elaborados de Metal Excepto Maquinaria de Equipo'),
('Otras Actividades de Servicios Profesionales'),
('Actividades Especializadas de la Construcción'),
('Actividades de Asistencia Social sin Alojamiento'),
('Actividades Jurídicas de Contabilidad'),
('Actividades de Bibliotecas Archivos Museos y Otras'),
('Otras Actividades Profesionales Científicas y Técnicas'),
('Transporte por Vía Terrestre y por Tuberías'),
('Actividades de Atención de la Salud Humana'),
('Otras Actividades Profesionales'),
('Administración Pública y Defensa'),
('Enseñanza'),
('Actividades Administrativas y de Apoyo de Oficina'),
('Actividades de Oficinas Principales'),
('Fabricación de Productos Elaborados de Metal'),
('Publicidad y Estudio de Mercado'),
('Actividades Auxiliares de las Actividades de Servicios'),
('Suministro de Electricidad Gas Vapor y Aire Acondicionado'),
('Otras Actividades Profesionales Técnicas'),
('Administración Pública y Defensa; Planes de Seguridad');
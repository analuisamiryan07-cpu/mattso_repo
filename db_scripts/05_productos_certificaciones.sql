-- ==============================================================================
-- SCRIPT 5: PRODUCTOS — 37 CERTIFICACIONES REALES
-- Ejecutar en Supabase SQL Editor
-- Limpia los mock products y carga los reales con IDs alineados al frontend
-- ==============================================================================

-- Limpiar datos mock (orden importa por FK)
DELETE FROM public.esquemas_certificacion;
DELETE FROM public.orden_items;
DELETE FROM public.ordenes;
DELETE FROM public.productos;

-- Reiniciar secuencia para que los IDs partan en 1
SELECT setval(pg_get_serial_sequence('public.productos', 'id'), 1, false);

-- Insertar 37 certificaciones (IDs 1-37 coinciden con el frontend)
INSERT INTO public.productos (tipo, titulo, precio, modalidad, activo) VALUES
( 'CERTIFICACION', 'Actividades Auxiliares de Liniero',                                                          130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Administración de Empresas',                                                                 150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Armado de Estructuras Metálicas',                                                            120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asesoría de Imagen',                                                                         120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asistencia a la Supervisión de Actividades de Construcción',                                 140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asistencia de Actividades de Articulación Local para Prevención de Desnutrición Crónica',    100.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asistencia de Contabilidad',                                                                 130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asistencia en Gestión Documental y Archivo',                                                 120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Asistencia en Seguridad Industrial',                                                         130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Atención Integral en Centro de Desarrollo Infantil',                                         120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Conductor Profesional de Bus — NTE INEN 2 463',                                              130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Coordinación en Centros de Desarrollo Infantil',                                             140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Coordinación Territorial para la Prevención de Desnutrición Crónica Infantil',              150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Cuidado de Personas Adultas Mayores',                                                        120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Entrenamiento Canino: Defensa y Protección',                                                 140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Entrenamiento Canino: Detección de Sustancias y Localización de Personas',                  140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Entrenamiento Canino: Intervención Asistida con Canes',                                      150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Evaluación de la Calidad y Excelencia en la Gestión Pública',                               160.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Facilitación en Actividades de Capacitación',                                                150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Facilitación en Actividades de Capacitación — Formación Dual',                               150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión Administrativa',                                                                     130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión Administrativa del Sistema de Salud Desconcentrado',                                 160.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión Ambiental',                                                                          150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión de Soldadura',                                                                       140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión en Promoción de Marcas, Productos y Servicios',                                      140.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Gestión Integral de Riesgos Financieros',                                                    160.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Instalaciones Eléctricas',                                                                   130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Instalaciones Hidrosanitarias',                                                              120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Neurodesarrollo y Necesidades Educativas Especiales en el Periodo Infantojuvenil',           150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Operaciones Archivísticas / Administración de Archivos',                                     130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Operaciones de Líneas y Redes Energizadas',                                                  150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Prevención de Riesgos Laborales — Construcción y Obra Civil',                               120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Prevención de Riesgos Laborales — Energía Eléctrica',                                        120.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Prevención e Intervención en los Problemas del Comportamiento y la Afectividad',             150.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Soldadura',                                                                                  130.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Supervisión de Edificaciones y Obras Civiles',                                               180.00, 'PRESENCIAL', true),
( 'CERTIFICACION', 'Supervisión de la Gestión Documental y Archivo',                                             160.00, 'PRESENCIAL', true);

-- Verificar inserción
SELECT id, titulo, precio FROM public.productos ORDER BY id;

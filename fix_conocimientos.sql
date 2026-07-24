-- ============================================================
-- CORRECCIÓN COMPLETA: matsso.conocimiento
-- Fuente: EsquemaCetificacionesMatsso.docx (Word oficial)
-- Estrategia: DELETE completo + INSERT fresco de todos los datos
-- ============================================================

-- PASO 1: Limpiar tabla
DELETE FROM matsso.conocimiento;

-- PASO 2: Re-insertar por certificación (orden alfabético)

-- 1. ACTIVIDADES AUXILIARES DE LINIERO
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normativa legal vigente', 1),
  ('Normativas relacionadas con seguridad y salud ocupacional', 2),
  ('Identificación de equipos y herramientas para realizar trabajos en contacto con redes de distribución', 3),
  ('Conocimientos básicos en ofimática', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%AUXILIARES DE LINIERO%';

-- 2. ADMINISTRACIÓN DE EMPRESAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('UC1 - Planificación Básica', 1),
  ('UC1 - Marketing Básico', 2),
  ('UC1 - Manejo de aplicaciones informáticas (office) e internet', 3),
  ('UC1 - Normativa de seguridad, salud e higiene en el trabajo', 4),
  ('UC2 - Administración Básica', 5),
  ('UC2 - Contabilidad', 6),
  ('UC2 - Legislación Tributaria', 7),
  ('UC2 - Normas Contables', 8),
  ('UC2 - Manejo de Bodegas e inventarios', 9),
  ('UC2 - Gestión de Talento Humano', 10),
  ('UC2 - Administración de procesos', 11),
  ('UC2 - Gestión de Calidad y mejoramiento contínuo', 12),
  ('UC2 - Logística Básica', 13)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ADMINISTRACIÓN DE EMPRESAS%';

-- 3. ARMADO DE ESTRUCTURAS METÁLICAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Leer e interpretar planos estructurales', 1),
  ('Cumplir con las normas de seguridad y salud ocupacional', 2),
  ('Conocimientos de los diferentes procesos de soldadura y corte, además de los diferentes elementos de unión de una estructura metálica', 3),
  ('Conocimientos básicos de metrología (Pesos, Medidas, Volúmenes, Conversiones)', 4),
  ('Conocimientos básicos de electricidad', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ARMADO DE ESTRUCTURAS%';

-- 4. ASESORÍA DE IMAGEN
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Vestuario, materiales y siluetas', 1),
  ('Estilos, colorimetría y morfología', 2),
  ('Historia de la moda y Estilo de vida', 3),
  ('Fotografía', 4),
  ('Maquillaje, estilismo de cabello (cuidado personal)', 5),
  ('Etiqueta - protocolo y Cultura general', 6),
  ('Habilidades comunicacionales y sociales', 7),
  ('Personal branding, medios y líderes de opinión', 8),
  ('Imagen profesional y colectiva', 9)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ASESORÍA DE IMAGEN%';

-- 5. ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN – ESTRUCTURA E INFRAESTRUCTURA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Unidades e instrumentos de medición utilizados en obra', 1),
  ('Interpretación de planos de obra (arquitectónicos, estructurales, hidrosanitarios y eléctricos)', 2),
  ('Especificaciones técnicas', 3),
  ('Criterios de ejecución identificados en los planos de obra (arquitectónicos, estructurales, hidrosanitarios y eléctricos)', 4),
  ('Cálculo de materiales para la construcción', 5),
  ('Operación de equipos, máquinas y herramientas utilizadas en obra', 6),
  ('Normas básicas vigentes de Seguridad y Salud en el trabajo', 7),
  ('Normas básicas vigentes del medio ambiente (reciclaje y uso de contaminantes, entre otros) en la obra', 8)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ASISTENCIA A LA SUPERVISIÓN%';

-- 6. ASISTENCIA DE CONTABILIDAD
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normativa legal vigente', 1),
  ('Ofimática - hojas de cálculo Excel', 2),
  ('Software Tributario (DIMM)', 3),
  ('Contabilidad básica', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ASISTENCIA DE CONTABILIDAD%';

-- 7. ASISTENCIA EN ACTIVIDADES DE ARTICULACIÓN LOCAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Plan Estratégico Intersectorial para la Prevención y Reducción de la Desnutrición Crónica Infantil', 1),
  ('Decreto Ejecutivo No.1211', 2),
  ('Plan decenal de Salud 2022-2031', 3),
  ('Manual de Atención Integral de Salud Familiar, Comunitario e Intercultural (MAIS-FCI)', 4),
  ('Libreta Integral de Salud - LIS', 5),
  ('Rotafolio de la concepción hasta los 5 años', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ARTICULACIÓN LOCAL%DESNUTRICIÓN%';

-- 8. ASISTENCIA EN GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normativa técnica de Gestión Documental y Archivo', 1),
  ('Normativa Legal Vigente', 2),
  ('Conocimientos básicos en manejo de herramienta ofimática', 3),
  ('Técnicas de atención al usuario', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ASISTENCIA EN GESTIÓN DOCUMENTAL%';

-- 9. ASISTENCIA EN SEGURIDAD INDUSTRIAL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Reglamentos y normativas legales vigentes relacionadas a Seguridad industrial', 1),
  ('Normativa de calidad relacionada a Seguridad Industrial', 2),
  ('Lectura de planos', 3),
  ('Ofimática básica', 4),
  ('Metodologías de estimación de riesgos', 5),
  ('Estadística básica', 6),
  ('Redacción y ortografía', 7)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ASISTENCIA EN SEGURIDAD INDUSTRIAL%';

-- 10. ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Características de desarrollo evolutivo de niñas y niños de 1 a 3 años de edad', 1),
  ('Norma técnica, Guía metodológica, Protocolos, Acuerdos Ministeriales e interministeriales vigentes', 2),
  ('Normativa legal vigente (Constitución, Código de la Niñez y Adolescencia)', 3)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL%';

-- 11. CONDUCTOR PROFESIONAL DE BUS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('UC1 - Reglas de urbanidad y cuidados de higiene personal', 1),
  ('UC1 - Reglamentos y procedimientos para minimizar el impacto ambiental del vehículo', 2),
  ('UC1 - Rutas de los principales atractivos turísticos y ubicación de los hoteles, restaurantes, mercados', 3),
  ('UC1 - Seguridad vial', 4),
  ('UC1 - Señalización turística y de tránsito', 5),
  ('UC2 - Mecánica automotriz para reparar daños básicos', 6),
  ('UC2 - Primeros auxilios básicos', 7),
  ('UC3 - Leyes y reglamentos aplicables a la conducción de vehículos', 8),
  ('UC3 - Atención al cliente', 9)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%CONDUCTOR PROFESIONAL%BUS%';

-- 12. CONSEJERÍAS DE ATENCIÓN FAMILIAR DEL SERVICIO CRECIENDO CON NUESTROS HIJOS (CNH)
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Características de desarrollo evolutivo de los niños de 0 a 3 años de edad', 1),
  ('Norma técnica, Acuerdos Ministeriales e Interministeriales vigentes', 2),
  ('Normativa legal vigente (Constitución y Código de la Niñez y Adolescencia)', 3),
  ('Estimulación prenatal', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%CONSEJERÍAS%CRECIENDO CON NUESTROS HIJOS%';

-- 13. COORDINACIÓN EN CENTROS DE DESARROLLO INFANTIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Características de desarrollo evolutivo de las niñas y niños de 0 a 36 meses de edad', 1),
  ('Norma técnica, protocolos, Acuerdos Ministeriales e Interministeriales vigentes', 2),
  ('Normativa legal vigente (Constitución, Código de la Niñez y Adolescencia)', 3)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%COORDINACIÓN%CENTRO%DESARROLLO INFANTIL%';

-- 14. COORDINACIÓN TERRITORIAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normativa legal vigente (Constitución de la República del Ecuador, Código de la Niñez y Adolescencia, Ley de Maternidad gratuita y atención a la infancia, Ley Orgánica de Salud, Código de organización territorial, autonomía y descentralización, Objetivos de Desarrollo sostenible)', 1),
  ('Plan Estratégico Intersectorial para la Prevención y Reducción de la Desnutrición Crónica Infantil', 2),
  ('Decretos Ejecutivos relacionados a la Desnutrición Crónica Infantil (DCI)', 3),
  ('Conocimientos sobre Metodologías de ejecución de Mesas Intersectoriales para la prevención y reducción de la desnutrición crónica infantil', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%COORDINACIÓN TERRITORIAL%DESNUTRICIÓN%';

-- 15. COSMETOLOGÍA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Cosmetología: Estructura y capas de la piel, fototipo de piel, biotipo de piel', 1),
  ('Conocimiento básico de anatomía y fisiología de la piel', 2),
  ('Conocimiento básico para valoración de piel sana', 3),
  ('Protocolos cosmetológicos faciales y corporales no invasivos', 4),
  ('Productos cosmetológicos faciales y corporales para piel sana', 5),
  ('Aparatología de cosmetología', 6),
  ('Normativa para productos cosméticos, Normativa Técnica Sanitaria para permiso de funcionamiento, Normas de higiene, seguridad y salud en el trabajo, Normativa para la Gestión de Desechos Sanitarios', 7)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'COSMETOLOGÍA';

-- 16. COSMIATRÍA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Cosmetología y Cosmiatría: estructura y capas de la piel, alteraciones estéticas de la piel facial, corporal y capilar, fototipo de piel, biotipo de piel', 1),
  ('Anatomía, fisiología de la piel y anexos cutáneos', 2),
  ('Conocimiento para la valoración de la piel', 3),
  ('Protocolos y técnicas cosmiátricos faciales, corporales y capilar', 4),
  ('Productos cosmetológicos faciales y corporales para piel sana', 5),
  ('Aparatología cosmiátricos', 6),
  ('Química cosmética', 7),
  ('Normativa para productos cosméticos, Normativa Técnica Sanitaria para permiso de funcionamiento, Normas de higiene, seguridad y salud en el trabajo, Normativa para la Gestión de Desechos Sanitarios, Manual de uso de la aparatología', 8)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'COSMIATRÍA';

-- 17. CUIDADO DE PERSONAS ADULTAS MAYORES
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Norma técnica de Centros y Servicios Gerontológicos Residenciales, Atención Diurna, Espacios de Socialización y Encuentro y Atención Domiciliaria', 1),
  ('Ley Orgánica de las Personas Adultas Mayores', 2),
  ('Reglamento de la Ley Orgánica de las Personas Adultas Mayores', 3),
  ('Convención Interamericana de los Derechos de las Personas Mayores', 4),
  ('Acuerdo ministerial de coordinación interinstitucional con el Ministerio de Salud Pública', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%CUIDADO DE PERSONAS ADULTAS MAYORES%';

-- 18. DISEÑO GRÁFICO Y COMUNICACIÓN VISUAL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Manejo de la legislación y normativas en el campo de la comunicación', 1),
  ('Bases de la comunicación y la semiótica', 2),
  ('Manejo de la composición visual y fotográfica', 3),
  ('Conocimientos esenciales en el Diseño Gráfico', 4),
  ('Conocimientos básicos de la comunicación visual', 5),
  ('Manejo de herramientas tecnológicas', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%DISEÑO GRÁFICO%COMUNICACIÓN VISUAL%';

-- 19. ENTRENAMIENTO CANINO: DEFENSA Y PROTECCIÓN
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimientos básicos de psicología y etología canina', 1),
  ('Conocimientos básicos de comportamiento humano', 2),
  ('Conocimientos básicos de primeros auxilios veterinarios', 3),
  ('Conocimiento de cuidado y mantenimiento de canes y caniles', 4),
  ('Conocimientos de etnología', 5),
  ('Conocimientos de uso y cuidado del material de entrenamiento de protección y defensa', 6),
  ('Conocimientos de técnicas de adiestramiento canino en guarda, protección y defensa', 7),
  ('Conocimiento de figurancia K9', 8),
  ('Normativas y leyes: Manual de formación K9, Reglamento K9, Ley de protección animal, Declaración de derechos animales, Derechos Humanos y Uso progresivo y diferenciado de la fuerza', 9)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%ENTRENAMIENTO CANINO%DEFENSA Y PROTECCIÓN%';

-- 20. ENTRENAMIENTO CANINO: DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimientos básicos de psicología y etología canina', 1),
  ('Conocimientos básicos de comportamiento humano', 2),
  ('Conocimientos básicos de primeros auxilios veterinarios', 3),
  ('Conocimiento de cuidado y mantenimiento de canes y caniles', 4),
  ('Conocimientos de etnología', 5),
  ('Conocimientos de uso y cuidado del material de entrenamiento de protección y defensa', 6),
  ('Conocimientos de técnicas de adiestramiento canino en guarda, protección y defensa', 7),
  ('Conocimiento de figurancia K9', 8),
  ('Normativas y leyes: Manual de formación K9, Reglamento K9, Ley de protección animal, Declaración de derechos animales, Derechos Humanos y Uso progresivo y diferenciado de la fuerza', 9)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%DETECCIÓN DE SUSTANCIAS%LOCALIZACIÓN%';

-- 21. ENTRENAMIENTO CANINO: INTERVENCIÓN ASISTIDA CON CANES
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimientos básicos de psicología canina', 1),
  ('Conocimientos básicos de etología canina', 2),
  ('Conocimientos básicos de los usuarios en función de las diferentes discapacidades y atención de grupos prioritarios', 3),
  ('Conocimientos básicos de primeros auxilios veterinarios', 4),
  ('Conocimiento de cuidado y mantenimiento de canes y caniles', 5),
  ('Conocimientos de filogenia y ontogenia canina', 6),
  ('Conocimientos de uso y cuidado del material de entrenamiento canino y material de uso terapéutico del usuario', 7),
  ('Conocimientos básicos de técnicas terapéuticas', 8),
  ('Conocimientos de técnicas de educación canina en intervenciones asistidas', 9),
  ('Conocimiento de técnicas de manejo al usuario dentro de la intervención asistida con canes', 10),
  ('Normativas y leyes: Constitución de la República, Convención sobre los derechos de las personas con discapacidad, Ley Orgánica de discapacidades y su reglamento, Código Orgánico de Ordenamiento Territorial, Manual de formación Nacional e Internacional, Ley de protección animal y Declaración de derechos animales, Manual especializado en intervenciones asistidas', 11)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%INTERVENCIÓN ASISTIDA CON CANES%';

-- 22. EVALUACIÓN DE LA CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Modelo Ecuatoriano de Calidad y Excelencia', 1),
  ('Guía Metodológica de Aplicación del Modelo Ecuatoriano de Calidad y Excelencia', 2),
  ('Gestión Pública: Plan Nacional de Desarrollo, LOTAIP, Código orgánico de planificación y finanzas públicas, LOSEP, Norma Técnica: GPR, Procesos, Servicios, Calidad y Gestión del Cambio', 3),
  ('Gestión de calidad y mejora continua', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%EVALUACIÓN DE LA CALIDAD%GESTIÓN PÚBLICA%';

-- 23. FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimiento de Metodologías de enseñanza – aprendizaje', 1),
  ('Conocimiento de diseño curricular', 2),
  ('Conocimiento de manejo de conflictos', 3),
  ('Conocimiento de Metodologías de evaluación', 4),
  ('Conocimiento básico de la Ley Orgánica de Educación Superior y Ley Orgánica de Educación Intercultural', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN';

-- 24. FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN - FORMACIÓN DUAL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimiento de Metodologías de enseñanza – aprendizaje', 1),
  ('Conocimiento de Diseño curricular y elaboración de plan de rotación', 2),
  ('Conocimiento de Manejo de conflictos', 3),
  ('Conocimiento de Metodologías de evaluación relacionado con el entorno laboral-real e institucional', 4),
  ('Conocimiento básico del Reglamento de Régimen Académico, Reglamento para las carreras y programas en modalidad de formación dual y demás normativa relacionada con prácticas duales', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%FORMACIÓN DUAL%';

-- 25. FOTÓGRAFO EN MEDIOS Y MULTIMEDIA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Logística y estrategias para cubrir eventos', 1),
  ('Primeros auxilios básicos', 2),
  ('Ley Orgánica de Comunicación y Código del Trabajo (principios y derechos, derechos de igualdad e interculturalidad, derechos de los comunicadores, publicidad)', 3),
  ('Formatos para elaborar plan de trabajo', 4),
  ('Tipos de cobertura', 5),
  ('Informática Básica', 6),
  ('Manejo de equipos fotográficos digitales y analógicos', 7),
  ('Normas de seguridad y salud en el trabajo', 8),
  ('Riesgos de trabajo vinculados al campo laboral', 9),
  ('Ética Profesional vinculada al campo laboral', 10),
  ('Composición fotográfica: conceptos básicos', 11),
  ('Teoría de la imagen: concepto, tipos, imagen analógica y digital, y peso social y cultural', 12),
  ('Fotoperiodismo: aspectos conceptuales, características y actuaciones para cobertura fotográfica', 13),
  ('Conceptos básicos de Diseño fotográfico', 14),
  ('Dominio y operatividad de equipos fotográficos y programas de edición', 15),
  ('Programas multimedia', 16),
  ('Contexto general socio-político del país', 17)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%FOTÓGRAFO EN MEDIOS%MULTIMEDIA%';

-- 26. GESTIÓN ADMINISTRATIVA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Principios y normas de contabilidad', 1),
  ('Leyes tributarias y laborales', 2),
  ('Proceso contable', 3),
  ('Documentos comerciales', 4),
  ('Seguridad social', 5),
  ('Hoja de cálculo', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'GESTIÓN ADMINISTRATIVA';

-- 27. GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Constitución de la República del Ecuador – referente a la Salud', 1),
  ('Modelo de Atención Integral de Salud y normativa relacionada', 2),
  ('Ley Orgánica de Salud', 3),
  ('Ley del Sistema Nacional de Salud', 4),
  ('Ley Orgánica de Contratación Pública', 5),
  ('Ley Orgánica del Servicio Público', 6),
  ('Código de Trabajo', 7),
  ('Normas Técnicas de Control Interno', 8),
  ('Código Orgánico de Planificación y Finanzas Públicas', 9),
  ('Estatuto Orgánico por Procesos', 10),
  ('Ofimática', 11),
  ('Gestión Documental', 12),
  ('Administración de la Salud', 13)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD%';

-- 28. GESTIÓN AMBIENTAL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Prevención y reducción de la contaminación ambiental', 1),
  ('Manejo de desechos', 2),
  ('Emergencias y contingencias ambientales', 3),
  ('Auditoría Ambiental', 4),
  ('Normativa Ambiental vigente', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%GESTIÓN AMBIENTAL%';

-- 29. GESTIÓN EN SOLDADURA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Electricidad básica', 1),
  ('Tipos de materiales', 2),
  ('Seguridad e higiene Industrial', 3),
  ('Dibujo técnico', 4),
  ('Ensayo de materiales', 5),
  ('Tipos de cordones', 6),
  ('Posiciones de soldadura', 7),
  ('Características de los materiales de aportación', 8),
  ('Metrología básica', 9),
  ('Tipos de juntas', 10),
  ('Normas técnicas relacionadas a soldadura', 11),
  ('Manipulación de herramientas relacionadas a soldadura', 12)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%GESTIÓN EN SOLDADURA%';

-- 30. GESTIÓN EN PROMOCIÓN DE MARCAS, PRODUCTOS Y SERVICIOS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Marketing MIX', 1),
  ('Trade Marketing', 2),
  ('Redacción publicitaria', 3),
  ('Benchmarking', 4),
  ('Merchandising', 5),
  ('Publicidad', 6),
  ('Relaciones públicas', 7),
  ('Ofimática media', 8),
  ('Marketing de servicios', 9),
  ('Administrativos', 10),
  ('Canales de distribución', 11),
  ('Diseño gráfico', 12),
  ('Análisis de mercado', 13)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%PROMOCIÓN DE MARCAS%';

-- 31. GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Conocimientos financieros', 1),
  ('Conocimientos contables', 2),
  ('Conocimientos administrativos', 3),
  ('Conocimientos estadísticos', 4),
  ('Conocimientos en administración integral de riesgos', 5),
  ('Código Orgánico Monetario y Financiero', 6),
  ('Codificación de Resoluciones Monetarias, Financieras, de Valores y de Seguros', 7)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS%';

-- 32. INSTALACIONES ELÉCTRICAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Interpretación de Planos Eléctricos', 1),
  ('Conocimiento de las cinco reglas de oro de las instalaciones eléctricas', 2),
  ('Conocimiento de la Norma INEN 019 (Normativa relacionada a Prevención de Incendios - Instalaciones a prueba de explosión)', 3),
  ('Detección de averías', 4),
  ('Mantenimiento de equipos', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%INSTALACIONES ELÉCTRICAS%';

-- 33. INSTALACIONES HIDROSANITARIAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Interpretación de planos arquitectónicos, hidrosanitarios y detalles: definición, simbología, aplicación', 1),
  ('Máquinas, herramientas, equipos y materiales', 2),
  ('Redes de agua potable: definiciones, tipos, formas', 3),
  ('Procedimientos de instalación de redes de agua potable: medición, corte, unión, verificación, comprobación', 4),
  ('Redes sanitarias y pluviales: definiciones, tipo, formas', 5),
  ('Procedimientos de instalación de redes sanitarias y pluviales: medición, corte, unión, verificación, comprobación', 6),
  ('Mantenimiento y reparación de aparatos hidrosanitarios', 7),
  ('Normativa de seguridad y salud en el trabajo y Reglamento de seguridad para la construcción, Normativa ambiental', 8),
  ('Normas Técnicas Ecuatorianas de la Construcción e INEN – Hidrosanitarias', 9)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%INSTALACIONES HIDROSANITARIAS%';

-- 34. MAQUILLAJE
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Colorimetría aplicada al maquillaje', 1),
  ('Técnicas de maquillaje', 2),
  ('Equipos, herramientas, insumos de maquillaje', 3),
  ('Tipos y cuidado de la piel', 4),
  ('Productos cosméticos de maquillaje', 5),
  ('Conocimiento sobre condiciones fisiológicas y fisonomía (Visagismo y morfología)', 6),
  ('Conocimiento básico de normativa de higiene, seguridad y salud en el trabajo', 7)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'MAQUILLAJE';

-- 35. NEURODESARROLLO Y NECESIDADES EDUCATIVAS ESPECIALES EN EL PERIODO INFANTOJUVENIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Neurodesarrollo: Desarrollo intrauterino y neonatal, Discapacidades visibles y no visibles, TDAH – TDAH-I – DDA, Trastornos del espectro autista (TEA), Problemas de Aprendizaje, Trastornos del habla y la comunicación', 1),
  ('Adaptaciones curriculares significativas y no significativas: Adaptaciones curriculares grado 1, Grado 2 y Grado 3, Inclusión educativa', 2),
  ('Gestión del DECE: Funcionalidad del DECE, Ejes de acción', 3),
  ('Intervención neurocognitiva a los trastornos del neurodesarrollo: Evaluación y Rehabilitación neurocognitiva', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%NEURODESARROLLO%NECESIDADES EDUCATIVAS%';

-- 36. OFIMÁTICA: ASISTENCIA ADMINISTRATIVA CON MANEJO DE OFIMÁTICA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('UC1 - Uso de equipos tecnológicos', 1),
  ('UC1 - Clasificación de documentos', 2),
  ('UC1 - Atención al cliente', 3),
  ('UC1 - Técnicas de archivo', 4),
  ('UC2 - Procesador de textos', 5),
  ('UC2 - Hoja de Cálculo', 6),
  ('UC2 - Aplicación para presentaciones', 7),
  ('UC2 - Manejo de internet', 8)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%OFIMÁTICA%ASISTENCIA ADMINISTRATIVA%';

-- 37. OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA - LÍNEAS AÉREAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Componentes y funcionamiento del sistema de distribución eléctrico (redes aéreas)', 1),
  ('Técnicas de diagnóstico (pruebas, medidas)', 2),
  ('Tipos de mantenimiento (predictivo, preventivo, correctivo)', 3),
  ('Las 5 reglas de oro del electricista', 4),
  ('Normativa de seguridad y salud en el trabajo y normativa de ambiente y agua relacionado con su actividad', 5),
  ('Conocimiento básico de regulación de calidad del servicio y mantenimiento', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%LÍNEAS AÉREAS%';

-- 38. OPERACIÓN Y MANTENIMIENTO DE LAS REDES DEL SISTEMA DE DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA - LÍNEAS SUBTERRÁNEAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Componentes y funcionamiento del sistema de distribución eléctrico (redes subterráneas)', 1),
  ('Técnicas de diagnóstico (pruebas, medidas)', 2),
  ('Tipos de mantenimiento (predictivo, preventivo, correctivo)', 3),
  ('Las 5 reglas de oro del electricista', 4),
  ('Normativa de seguridad y salud en el trabajo y normativa de ambiente y agua relacionado con su actividad', 5),
  ('Conocimiento básico de regulación de calidad del servicio y mantenimiento', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%LÍNEAS SUBTERRÁNEAS%';

-- 39. OPERACIONES ARCHIVÍSTICAS / ADMINISTRACIÓN DE ARCHIVOS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Constitución de la República (Derecho y acceso a la información)', 1),
  ('Ley del Sistema Nacional de Archivo y sus reglamentos', 2),
  ('Ley Orgánica de Transparencia y Acceso a la Información Pública', 3),
  ('Normas de control interno de la Contraloría General del Estado', 4),
  ('Código Orgánico Administrativo', 5),
  ('Regla Técnica Nacional para la organización y mantenimiento de archivos públicos', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%OPERACIONES ARCHIVÍSTICAS%';

-- 40. OPERACIONES AUXILIARES EN LIMPIEZA DE UNIDADES DE SALUD
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Manejo y uso de productos químicos', 1),
  ('Manejo y utilización de maquinaria, equipos, insumos y materiales', 2),
  ('Manual de Bioseguridad', 3),
  ('Manejo de desechos', 4)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%OPERACIONES AUXILIARES EN LIMPIEZA%';

-- 41. OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normativa legal vigente', 1),
  ('Normativas relacionadas con seguridad y salud ocupacional', 2),
  ('Identificación de equipos de protección y seccionamiento en los sistemas de distribución', 3),
  ('Trabajo en altura', 4),
  ('Identificación de equipos y herramientas para realizar trabajos en contacto con redes de distribución', 5),
  ('Conocimientos básicos en ofimática', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS%';

-- 42. PREPARACIÓN GASTRONÓMICA DE COCINA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Normas de seguridad industrial y ocupacional', 1),
  ('Materia prima y características organolépticas', 2),
  ('Técnicas de cocina', 3),
  ('Métodos de cocción', 4),
  ('Conocimientos básicos de nutrición', 5),
  ('Técnicas de montaje y emplatado', 6),
  ('Receta estándar', 7),
  ('Manejo de mermas', 8),
  ('Equipo, menaje y mobiliario', 9),
  ('BPM (Buenas Prácticas de Manufactura)', 10),
  ('Reglamento de alimentos y bebidas', 11),
  ('Mise en place', 12),
  ('Manejo de inventario', 13),
  ('Etiqueta y protocolo', 14),
  ('Técnicas y estilos de servicio en restaurante', 15),
  ('Atención al cliente', 16),
  ('Fundamentos de cocina internacional', 17),
  ('Normas HACCP (Hazard Analysis Critical Control Point)', 18),
  ('Cocina local o nacional', 19)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%PREPARACIÓN GASTRONÓMICA%';

-- 43. PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: CONSTRUCCIÓN Y OBRA CIVIL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Peligros en trabajos del área de construcción y evaluación de los riesgos de su actividad', 1),
  ('Trabajo seguro en el área de construcción (en altura, espacios confinados, levantamiento de muros, excavación, entre otros)', 2),
  ('Conocimiento de medidas preventivas (fuentes de peligro, medio, colectivo y persona)', 3),
  ('Verificación de dispositivos de seguridad y estado de los equipos, herramientas, maquinarias y materiales de trabajo', 4),
  ('Actos y condiciones inseguras o subestándar', 5),
  ('Actuación y respuesta ante amenazas naturales y riesgos antrópicos', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%PREVENCIÓN DE RIESGOS%CONSTRUCCIÓN%OBRA CIVIL%';

-- 44. PREVENCIÓN DE RIESGOS LABORALES: ENERGÍA ELÉCTRICA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Peligros en trabajos con energía eléctrica y evaluación de los riesgos de su actividad', 1),
  ('Trabajo seguro con tensión y sin tensión eléctrica', 2),
  ('Conocimiento de medidas preventivas (fuentes de peligro, medio, colectivo y persona)', 3),
  ('Verificación de dispositivos de seguridad y estado de los equipos, herramientas, maquinarias y materiales de trabajo', 4),
  ('Actos y condiciones inseguras o subestándar', 5),
  ('Actuación y respuesta ante amenazas naturales y riesgos antrópicos', 6)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%PREVENCIÓN DE RIESGOS%ENERGÍA ELÉCTRICA%';

-- 45. PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO Y DE LA AFECTIVIDAD
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Intervención en violencia: Física, psicológica, sexual en la infancia y adolescencia', 1),
  ('Trastornos de la afectividad: Ansiedad, Depresión y autoestima', 2),
  ('Adicciones: Prevención e intervención', 3),
  ('Modelos de Intervención en crisis', 4),
  ('Trastornos de personalidad y conducta', 5),
  ('Enfoque de derechos en población LGTBI', 6),
  ('Primeros Auxilios Psicológicos (PAP)', 7)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%PREVENCIÓN E INTERVENCIÓN%COMPORTAMIENTO%AFECTIVIDAD%';

-- 46. SEGURIDAD INDUSTRIAL
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Andragogía', 1),
  ('Planificación curricular', 2),
  ('Metodología de enseñanza - aprendizaje', 3),
  ('Evaluación', 4),
  ('Manejo de Grupos', 5),
  ('Resolución de Conflictos', 6),
  ('Comunicación Asertiva', 7),
  ('Recursos Didácticos', 8)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'SEGURIDAD INDUSTRIAL';

-- 47. SOLDADURA
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Lectura de planos técnicos de soldadura', 1),
  ('Normas de seguridad, calidad, medio ambiente e higiene', 2),
  ('Conocimientos de instrumentación', 3),
  ('Tipos de procesos de soldadura y corte', 4),
  ('Conocimientos de electricidad básica', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) = 'SOLDADURA';

-- 48. SUPERVISIÓN DE EDIFICACIONES Y OBRAS CIVILES
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Planos y diseños que contienen las ingenierías del proyecto', 1),
  ('Sistemas de construcción y procesos constructivos', 2),
  ('Técnicas de la ejecución de obra', 3),
  ('Normativa legal (Constitución del Ecuador, norma ambiental, Código de trabajo y normativa de seguridad y salud en el trabajo)', 4),
  ('Normas Ecuatorianas de Construcción', 5)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%SUPERVISIÓN DE EDIFICACIONES%';

-- 49. SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.conocimiento (id_certificacion, descripcion, orden)
SELECT c.id_certificacion, v.desc_, v.ord_
FROM matsso.certificacion c
CROSS JOIN (VALUES
  ('Constitución de la República (Derecho y acceso a la información)', 1),
  ('Ley del Sistema Nacional de Archivo y sus reglamentos', 2),
  ('Ley Orgánica de Transparencia y Acceso a la Información Pública', 3),
  ('Normas de control interno de la Contraloría General del Estado', 4),
  ('Código Orgánico Administrativo', 5),
  ('Regla Técnica Nacional para la organización y mantenimiento de archivos públicos', 6),
  ('Ley de Comercio Electrónico', 7),
  ('Esquema Gubernamental de Seguridad de la Información', 8)
) AS v(desc_, ord_)
WHERE UPPER(c.nombre) ILIKE '%SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL%';

-- VERIFICACIÓN FINAL
SELECT
  c.nombre,
  COUNT(k.id_conocimiento) AS total_conocimientos
FROM matsso.certificacion c
LEFT JOIN matsso.conocimiento k ON k.id_certificacion = c.id_certificacion
GROUP BY c.id_certificacion, c.nombre
ORDER BY c.nombre;

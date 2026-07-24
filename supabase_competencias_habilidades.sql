-- ============================================================
-- PASO 1: CREAR TABLAS EN ESQUEMA matsso
-- ============================================================

CREATE TABLE IF NOT EXISTS matsso.competencia (
  id_competencia   SERIAL PRIMARY KEY,
  id_certificacion INT NOT NULL REFERENCES matsso.certificacion(id_certificacion) ON DELETE CASCADE,
  descripcion      TEXT NOT NULL,
  orden            SMALLINT NOT NULL DEFAULT 1,
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competencia_cert ON matsso.competencia(id_certificacion);

CREATE TABLE IF NOT EXISTS matsso.habilidad (
  id_habilidad     SERIAL PRIMARY KEY,
  id_certificacion INT NOT NULL REFERENCES matsso.certificacion(id_certificacion) ON DELETE CASCADE,
  tipo             VARCHAR(10) NOT NULL CHECK (tipo IN ('TEORICA','PRACTICA')),
  descripcion      TEXT NOT NULL,
  orden            SMALLINT NOT NULL DEFAULT 1,
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habilidad_cert ON matsso.habilidad(id_certificacion);


-- ============================================================
-- PASO 2: INSERTAR COMPETENCIAS
-- ============================================================

-- 1. ACTIVIDADES AUXILIARES DE LINIERO
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar actividades preliminares en la construcción, operación, mantenimiento de redes de los sistemas de distribución eléctrica y alumbrado público de acuerdo a procedimientos establecidos y normativa legal vigente.', 1),
  ('Ejecutar actividades de soporte en la construcción, operación, mantenimiento de redes de los sistemas de distribución eléctrica y alumbrado público de acuerdo a procedimientos establecidos y normativa legal vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ACTIVIDADES AUXILIARES DE LINIERO%';

-- 2. ADMINISTRACIÓN DE EMPRESAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Administrar procesos de planificación y comercialización de la empresa, de acuerdo a los procedimientos establecidos.', 1),
  ('Gestionar procesos administrativos, financieros, operacionales, recursos humanos y logísticos de la empresa de acuerdo a los procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ADMINISTRACIÓN DE EMPRESAS%';

-- 3. ARMADO DE ESTRUCTURAS METÁLICAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Interpretar los planos estructurales y establecer las necesidades de materiales, equipos, recursos e insumos para la fabricación de estructuras metálicas de acuerdo a las especificaciones técnicas.', 1),
  ('Realizar el armado, montaje y acabado de la estructura metálica, de acuerdo al diseño estructural.', 2),
  ('Verificar la calidad de la estructura metálica armada para garantizar que cumpla con las especificaciones establecidas.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ARMADO DE ESTRUCTURAS METÁLICAS%';

-- 4. ASESORÍA DE IMAGEN
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Asesorar al usuario en el desarrollo y mejoramiento de su imagen de acuerdo a procedimientos establecidos.', 1)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASESORÍA DE IMAGEN%';

-- 5. ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar el replanteo de los planos constructivos de acuerdo con el diseño de la obra, normas de seguridad y salud en el trabajo, medio ambiente y especificaciones técnicas.', 1),
  ('Coordinar la ejecución del rubro asignado del proyecto de acuerdo con el diseño de la obra, normas de seguridad y salud en el trabajo, medio ambiente y especificaciones técnicas.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN%';

-- 6. ASISTENCIA DE CONTABILIDAD
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Asistir en la ejecución del proceso contable con la finalidad de establecer la situación económica financiera, en empresas e instituciones tanto públicas como privadas.', 1),
  ('Calcular los impuestos generados en la compra, venta de bienes y servicios, de personas naturales y sociedades.', 2),
  ('Apoyar en actividades administrativas con incidencia contable referidas al pago de nómina, control de bienes y sistematización de la documentación de la empresa.', 3),
  ('Registrar los movimientos contables de los productos y servicios prestados, así como transacciones cooperativas internas aplicando principios y normas contables.', 4),
  ('Calcular costos y márgenes de utilidad de los procesos de producción y venta de bienes en empresas industriales.', 5)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA DE CONTABILIDAD%';

-- 7. ASISTENCIA EN ACTIVIDADES DE ARTICULACIÓN LOCAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Planificar actividades para la detección e incidencia de factores de riesgo de la salud con énfasis en la desnutrición crónica infantil, de acuerdo a normativa legal vigente y procedimientos establecidos.', 1),
  ('Impulsar la participación y cooperación de la comunidad en la identificación y solución de problemas con énfasis en la desnutrición crónica infantil, de acuerdo a normativa legal vigente y procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ARTICULACIÓN LOCAL%DESNUTRICIÓN%';

-- 8. ASISTENCIA EN GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Sistematizar la documentación física y/o digital de acuerdo a instrucciones específicas.', 1),
  ('Realizar actividades de apoyo en la administración de la documentación física y/o digital de acuerdo a procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA EN GESTIÓN DOCUMENTAL%';

-- 9. ASISTENCIA EN SEGURIDAD INDUSTRIAL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar actividades de apoyo en la aplicación de las normas de seguridad del personal de la entidad, de acuerdo a lo establecido en la normativa legal vigente y previa coordinación del responsable de Seguridad Industrial.', 1),
  ('Verificar el cumplimiento de las normas de seguridad e higiene laboral en las distintas áreas de trabajo, bajo la guía y supervisión del responsable de Seguridad Industrial, conforme a los procedimientos establecidos.', 2),
  ('Revisar las hojas de control de funcionamiento de equipos, máquinas y herramientas, bajo la guía y supervisión del responsable de Seguridad Industrial, en base a un cronograma establecido.', 3),
  ('Controlar la aplicación de las normas de seguridad industrial en la planta física de la entidad, bajo la guía y supervisión del responsable de Seguridad Industrial, fundamentado en el procedimiento establecido.', 4)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA EN SEGURIDAD INDUSTRIAL%';

-- 10. ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Planificar los momentos metodológicos de juego y aprendizaje de las niñas y niños de 1 a 3 años de edad que asisten al centro de desarrollo infantil, de acuerdo a los lineamientos establecidos en la normativa vigente.', 1),
  ('Ejecutar la atención y cuidado diario de niñas y niños de 1 a 3 años de edad que asisten al centro de desarrollo infantil, de acuerdo a los lineamientos establecidos en la normativa vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL%';

-- 11. CONDUCTOR PROFESIONAL DE BUS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar la preparación personal y del vehículo para la actividad de transporte, de acuerdo al protocolo establecido.', 1),
  ('Conducir el bus de manera segura y responsable, velando por la seguridad y bienestar del pasajero.', 2),
  ('Realizar actividades de apoyo al transporte, de acuerdo al protocolo establecido.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CONDUCTOR PROFESIONAL DE BUS%';

-- 12. CONSEJERÍAS DE ATENCIÓN FAMILIAR DEL SERVICIO CRECIENDO CON NUESTROS HIJOS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Ejecutar las consejerías familiares individuales y/o grupales del servicio creciendo con nuestros hijos, a mujeres gestantes y familias de las niñas y niños de 0 a 3 años de edad, de acuerdo a los lineamientos establecidos en la normativa vigente.', 1),
  ('Evaluar las consejerías familiares individuales y/o grupales del servicio creciendo con nuestros hijos, a mujeres gestantes y familias de las niñas y niños de 0 a 3 años de edad, de acuerdo a los lineamientos establecidos en la normativa vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CRECIENDO CON NUESTROS HIJOS%';

-- 13. COORDINACIÓN EN CENTRO DE DESARROLLO INFANTIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Gestionar las actividades administrativas del centro de desarrollo infantil de acuerdo a los lineamientos establecidos en la normativa vigente.', 1),
  ('Realizar el seguimiento y control a los procesos técnicos y administrativos del centro de desarrollo infantil de acuerdo a lineamientos establecidos en la normativa vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COORDINACIÓN EN CENTRO DE DESARROLLO INFANTIL%';

-- 14. COORDINACIÓN TERRITORIAL PARA LA PREVENCIÓN Y REDUCCIÓN DE LA DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Dirigir la operativización de metodologías para los espacios de articulación intersectorial orientadas a la prevención y reducción de la desnutrición crónica infantil, en cumplimiento a la normativa legal vigente.', 1),
  ('Supervisar que la planificación anual territorial generada en los espacios de articulación intersectorial esté orientada a la prevención y reducción de la desnutrición crónica infantil.', 2),
  ('Verificar la gestión a las alertas levantadas y cumplimiento a los compromisos generados en los espacios de articulación intersectorial para la prevención y reducción de la desnutrición crónica infantil.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COORDINACIÓN TERRITORIAL%DESNUTRICIÓN%';

-- 15. COSMETOLOGÍA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar servicios cosmetológicos faciales y corporales no invasivos de acuerdo con la normativa vigente, los requerimientos del cliente y protocolos establecidos.', 1)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COSMETOLOGÍA%' AND UPPER(nombre) NOT ILIKE '%COSMIATRÍA%';

-- 16. COSMIATRÍA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar procedimientos cosmiátricos faciales, corporales y/o capilares no invasivos de acuerdo con la normativa vigente, los requerimientos del cliente y protocolos establecidos.', 1)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COSMIATRÍA%';

-- 17. CUIDADO DE PERSONAS ADULTAS MAYORES
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Proveer el cuidado integral a las personas adultas mayores, con base a sus preferencias y necesidades individuales determinadas por profesionales socio sanitarios cumpliendo la normativa legal vigente.', 1),
  ('Acompañar a las personas adultas mayores en los procesos de socialización, participación y recreación, cumpliendo la normativa legal vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CUIDADO DE PERSONAS ADULTAS MAYORES%';

-- 18. DISEÑO GRÁFICO Y COMUNICACIÓN VISUAL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Elaborar bocetos de diseño gráfico a partir de la idea y requerimientos del cliente.', 1),
  ('Diseñar formas para las artes aplicando técnicas manuales de diagramación e ilustración.', 2),
  ('Desarrollar proyectos de diseño gráfico utilizando tecnologías digitales.', 3),
  ('Comprobar la calidad de los artes finales aplicando pruebas y normas técnicas convencionales.', 4)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%DISEÑO GRÁFICO%';

-- 19. ENTRENAMIENTO CANINO: DEFENSA Y PROTECCIÓN
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar al canino de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 1),
  ('Adiestrar al canino por especialidad de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ENTRENAMIENTO CANINO%DEFENSA%';

-- 20. ENTRENAMIENTO CANINO: DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar al canino de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 1),
  ('Adiestrar al canino por especialidad de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ENTRENAMIENTO CANINO%DETECCIÓN%';

-- 21. ENTRENAMIENTO CANINO: INTERVENCIÓN ASISTIDA CON CANES
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar al canino de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 1),
  ('Adiestrar al canino por especialidad de acuerdo con normativa nacional e internacional vigente y procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ENTRENAMIENTO CANINO%INTERVENCIÓN%';

-- 22. EVALUACIÓN DE LA CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Establecer las actividades previas a la ejecución del proceso de evaluación de la gestión pública, bajo los criterios del Modelo Ecuatoriano de Calidad y Excelencia y la normativa vigente.', 1),
  ('Evaluar la gestión pública, bajo los criterios del Modelo Ecuatoriano de Calidad y Excelencia y la normativa vigente.', 2),
  ('Emitir los resultados de la evaluación realizada a la gestión pública, acorde al Modelo Ecuatoriano de Calidad y Excelencia y la normativa vigente.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA%';

-- 23. FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN (sin formación dual)
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Formular el diseño de enseñanza-aprendizaje para el grupo objetivo en función de necesidades de capacitación, requerimientos institucionales, estrategias y metodologías.', 1),
  ('Ejecutar el proceso de enseñanza-aprendizaje de acuerdo con grupo objetivo, necesidades de capacitación, estrategias, metodologías, y requerimientos institucionales.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN%' AND UPPER(nombre) NOT ILIKE '%DUAL%';

-- 24. FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN - FORMACIÓN DUAL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Formular el diseño de enseñanza-aprendizaje para el grupo objetivo en función de necesidades de capacitación, requerimientos institucionales, estrategias y metodologías.', 1),
  ('Ejecutar el proceso de enseñanza-aprendizaje de acuerdo con grupo objetivo, necesidades de capacitación, estrategias, metodologías, y requerimientos institucionales.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%FACILITACIÓN%DUAL%';

-- 25. FOTÓGRAFO EN MEDIOS Y MULTIMEDIA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar las actividades previas para realizar la cobertura periodística tomando en consideración los procedimientos establecidos.', 1),
  ('Ejecutar el registro fotográfico de acuerdo a la orientación previa del medio de comunicación, así como el registro de los hechos que considere pertinentes.', 2),
  ('Editar las tomas fotográficas del hecho o suceso tomando en consideración las técnicas y procedimientos establecidos.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%FOTÓGRAFO EN MEDIOS%';

-- 26. GESTIÓN ADMINISTRATIVA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar las gestiones administrativas del proceso comercial.', 1),
  ('Realizar las gestiones administrativas de tesorería.', 2),
  ('Introducir datos y textos en terminales informáticos en condiciones de seguridad, calidad y eficiencia.', 3),
  ('Manejar aplicaciones ofimáticas en la gestión de la información y la documentación.', 4)
) AS v(desc_, ord_)
WHERE UPPER(nombre) = 'GESTIÓN ADMINISTRATIVA';

-- 27. GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Gestionar la administración del sistema de salud en su jurisdicción conforme la normativa legal vigente.', 1),
  ('Gestionar los procesos habilitantes de apoyo y asesoría para la administración de salud en su jurisdicción conforme la normativa legal vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD%';

-- 28. GESTIÓN AMBIENTAL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Gestionar la documentación normativa relativa al sistema de gestión ambiental de la organización, de acuerdo a la normativa vigente.', 1),
  ('Evaluar los riesgos ambientales para la prevención de accidentes, de acuerdo a la normativa vigente.', 2),
  ('Ejecutar la puesta en marcha y mantenimiento del sistema de gestión ambiental, de acuerdo a la normativa vigente.', 3),
  ('Documentar los aspectos ambientales de la organización, de acuerdo a la normativa vigente.', 4)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN AMBIENTAL%';

-- 29. GESTIÓN EN SOLDADURA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar operaciones de soldadura por arco metálico protegido con electrodo revestido S.M.A.W.', 1),
  ('Realizar operaciones de soldadura oxiacetilénica O.A.W.', 2),
  ('Realizar operaciones de soldadura por arco metálico y protección gaseosa G.M.A.W. inerte o activa (MIG/MAG).', 3),
  ('Realizar operaciones de soldadura por arco con electrodo de tungsteno y protección gaseosa G.T.A.W. (TIG).', 4),
  ('Realizar operaciones de corte por proyección térmica.', 5)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN EN SOLDADURA%';

-- 30. GESTIÓN EN PROMOCIÓN DE MARCAS, PRODUCTOS Y SERVICIOS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Generar estrategias de participación, posicionamiento, promoción y/o activación de marcas, productos o servicios, en función al objetivo de mercado establecido.', 1),
  ('Implementar planes comunicacionales de acuerdo al mercado meta y objetivos organizacionales establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PROMOCIÓN DE MARCAS%';

-- 31. GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Dirigir la implementación del sistema integral de administración de riesgos financieros en función a la normativa nacional y las mejores prácticas internacionales.', 1),
  ('Evaluar la implementación de la administración integral de riesgos con base en la normativa nacional y las mejores prácticas internacionales.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS%';

-- 32. INSTALACIONES ELÉCTRICAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar actividades previas a la instalación eléctrica, de acuerdo a los requerimientos técnicos y procedimientos establecidos.', 1),
  ('Ejecutar la instalación eléctrica en edificios, locales comerciales y viviendas, de acuerdo a los requerimientos técnicos y procedimientos establecidos.', 2),
  ('Realizar el control de las instalaciones eléctricas cumpliendo con normas de higiene, salud y seguridad en el trabajo.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%INSTALACIONES ELÉCTRICAS%';

-- 33. INSTALACIONES HIDROSANITARIAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar la superficie de trabajo para las instalaciones hidrosanitarias en función del tipo y diseño de obra y normativa vigente.', 1),
  ('Ejecutar instalaciones hidrosanitarias de acuerdo con el tipo y diseño del plano de obra y especificaciones técnicas.', 2),
  ('Realizar el mantenimiento y reparación de aparatos hidrosanitarios considerando el tipo y diseño del plano de obra y normativa vigente.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%INSTALACIONES HIDROSANITARIAS%';

-- 34. MAQUILLAJE
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Aplicar técnicas de maquillaje de acuerdo con la fisonomía de cada persona, eventos, necesidades, preferencias, tendencias, estilo, requerimientos del cliente y normativa vigente.', 1)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%MAQUILLAJE%';

-- 35. NEURODESARROLLO Y NECESIDADES EDUCATIVAS ESPECIALES EN EL PERIODO INFANTOJUVENIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Planificar las actividades de atención a los niños, adolescentes y jóvenes de acuerdo a las necesidades educativas especiales y normativa legal vigente.', 1),
  ('Brindar atención a los niños, adolescentes y jóvenes de acuerdo a necesidades educativas especiales, aplicando estrategias neurocognitivas y normativa vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%NEURODESARROLLO%';

-- 36. OFIMÁTICA: ASISTENCIA ADMINISTRATIVA CON MANEJO DE OFIMÁTICA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Ejecutar actividades operativas de apoyo de gestión administrativa en función de los requerimientos o demandas específicas de clientes internos y/o externos.', 1),
  ('Procesar información de las actividades operativas de apoyo de gestión administrativa mediante el uso de herramientas de ofimática de acuerdo a requerimientos y procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OFIMÁTICA%ASISTENCIA ADMINISTRATIVA%';

-- 37. OPERACIÓN Y MANTENIMIENTO - LÍNEAS AÉREAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Determinar las condiciones de operatividad de los equipos y componentes del sistema de distribución de energía eléctrica de acuerdo con estándares de calidad, protocolos y normativa vigente.', 1),
  ('Realizar actividades de operación y/o mantenimiento en los componentes constitutivos del sistema de distribución de energía eléctrica, que permita su disponibilidad y funcionalidad.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIÓN Y MANTENIMIENTO%LÍNEAS AÉREAS%';

-- 38. OPERACIÓN Y MANTENIMIENTO - LÍNEAS SUBTERRÁNEAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Determinar las condiciones de operatividad de los equipos y componentes del sistema de distribución de energía eléctrica de acuerdo con estándares de calidad, protocolos y normativa vigente.', 1),
  ('Realizar actividades de operación y/o mantenimiento en los componentes constitutivos del sistema de distribución de energía eléctrica, que permita su disponibilidad y funcionalidad.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIÓN Y MANTENIMIENTO%SUBTERRÁNEAS%';

-- 39. OPERACIONES ARCHIVÍSTICAS / ADMINISTRACIÓN DE ARCHIVOS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Sistematizar la información manual o automatizada de la gestión documental y archivo de acuerdo a políticas y procedimientos establecidos.', 1),
  ('Administrar los repositorios de documentación e información de conformidad a normativa legal vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIONES ARCHIVÍSTICAS%';

-- 40. OPERACIONES AUXILIARES EN LIMPIEZA DE UNIDADES DE SALUD
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Establecer las condiciones óptimas de trabajo para la limpieza de las unidades de salud de acuerdo a protocolos de bioseguridad establecidos.', 1),
  ('Realizar procedimientos de limpieza de las unidades de salud de acuerdo a procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%LIMPIEZA DE UNIDADES DE SALUD%';

-- 41. OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Inspeccionar las redes y líneas energizadas de transmisión y distribución, de acuerdo a procedimientos establecidos.', 1),
  ('Efectuar el montaje y desmontaje de estructuras y equipos, en redes y líneas energizadas de transmisión y distribución, de acuerdo a procedimientos establecidos.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS%';

-- 42. PREPARACIÓN GASTRONÓMICA DE COCINA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar la pre-elaboración de alimentos de acuerdo con el protocolo establecido, la receta estándar, métodos, técnicas de cocción, normas de seguridad y salud en el trabajo y BPM vigentes.', 1),
  ('Elaborar alimentos en función de la orden de trabajo o requerimiento, protocolo establecido, receta estándar, métodos y técnicas de cocción vigentes.', 2),
  ('Realizar el montaje y despacho de los alimentos considerando el protocolo establecido, la receta estándar y las normas de seguridad y salud en el trabajo vigentes.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREPARACIÓN GASTRONÓMICA DE COCINA%';

-- 43. PREVENCIÓN DE RIESGOS LABORALES EN ACTIVIDADES DE ALTO RIESGO: CONSTRUCCIÓN Y OBRA CIVIL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Revisar el área de trabajo y actividades designadas de alto riesgo de acuerdo con los procedimientos de trabajo seguro establecidos por el empleador y la normativa de seguridad y salud en el trabajo vigentes.', 1),
  ('Realizar las actividades laborales de alto riesgo cumpliendo con los procedimientos de trabajo seguro establecidos por el empleador y la normativa de seguridad y salud en el trabajo vigentes.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN DE RIESGOS LABORALES%CONSTRUCCIÓN%';

-- 44. PREVENCIÓN DE RIESGOS LABORALES: ENERGÍA ELÉCTRICA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Revisar el área de trabajo y actividades designadas de alto riesgo de acuerdo con los procedimientos de trabajo seguro establecidos por el empleador y la normativa de seguridad y salud en el trabajo vigentes.', 1),
  ('Realizar las actividades laborales de alto riesgo cumpliendo con los procedimientos de trabajo seguro establecidos por el empleador y la normativa de seguridad y salud en el trabajo vigentes.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN DE RIESGOS LABORALES%ENERGÍA ELÉCTRICA%';

-- 45. PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO Y DE LA AFECTIVIDAD
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Planificar las actividades de atención a los niños, adolescentes y jóvenes de acuerdo a las necesidades educativas especiales y normativa legal vigente.', 1),
  ('Brindar atención a los niños, adolescentes y jóvenes de acuerdo a necesidades educativas especiales, aplicando estrategias neurocognitivas y normativa vigente.', 2)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO%';

-- 46. SEGURIDAD INDUSTRIAL
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Realizar actividades de apoyo a la gestión de implementación de las normas de seguridad personal de acuerdo con la norma técnica de seguridad en el trabajo y prevención de riesgos laborales.', 1),
  ('Revisar la aplicación de las normas de seguridad industrial en la planta física cumpliendo la norma técnica de seguridad en el trabajo y prevención de riesgos laborales.', 2),
  ('Comprobar las condiciones en los ambientes de trabajo en función de la norma técnica de seguridad en el trabajo y prevención de riesgos laborales.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) = 'SEGURIDAD INDUSTRIAL';

-- 47. SOLDADURA
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Preparar y garantizar la disponibilidad de equipos, materiales, consumibles y elementos de seguridad a utilizarse en el proceso de soldadura.', 1),
  ('Ensamblar y soldar las piezas de acuerdo a las normas técnicas establecidas y a los requerimientos de las órdenes de trabajo.', 2),
  ('Verificar la calidad de la soldadura para comprobar el cumplimiento de los requisitos establecidos.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) = 'SOLDADURA';

-- 48. SUPERVISIÓN DE EDIFICACIONES Y OBRAS CIVILES
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Coordinar actividades administrativas previas a la iniciación de la obra e ingreso de personal nuevo cumpliendo las normas de seguridad y salud en el trabajo y el proyecto de obra.', 1),
  ('Realizar el seguimiento de las actividades de la obra en función de las disposiciones de la dirección del proyecto y normas de seguridad y salud en el trabajo.', 2),
  ('Controlar la ejecución de los rubros de la obra de acuerdo al diseño arquitectónico e ingenierías, normas de seguridad y especificaciones técnicas.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%SUPERVISIÓN DE EDIFICACIONES%';

-- 49. SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.competencia (id_certificacion, descripcion, orden)
SELECT id_certificacion, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('Supervisar los procesos de gestión documental y archivo de acuerdo a la normativa legal vigente.', 1),
  ('Administrar los instrumentos de consulta de la gestión documental y archivo conforme a la normativa legal vigente.', 2),
  ('Realizar el seguimiento y evaluación a los procesos de gestión documental en base a las necesidades institucionales.', 3)
) AS v(desc_, ord_)
WHERE UPPER(nombre) ILIKE '%SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL%';


-- ============================================================
-- PASO 3: INSERTAR HABILIDADES
-- ============================================================

-- 1. ACTIVIDADES AUXILIARES DE LINIERO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Memorizar', 1),
  ('TEORICA',  'Facilidad numérica', 2),
  ('TEORICA',  'Comprensión escrita', 3),
  ('PRACTICA', 'Comprensión y expresión oral', 1),
  ('PRACTICA', 'Motricidad fina', 2),
  ('PRACTICA', 'Motricidad gruesa', 3),
  ('PRACTICA', 'Resistencia física', 4),
  ('PRACTICA', 'Flexibilidad', 5),
  ('PRACTICA', 'Orientación espacial', 6),
  ('PRACTICA', 'Percepción visual', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ACTIVIDADES AUXILIARES DE LINIERO%';

-- 2. ADMINISTRACIÓN DE EMPRESAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Aprendizaje activo', 1),
  ('TEORICA',  'Recopilación de información', 2),
  ('TEORICA',  'Organización de la información', 3),
  ('TEORICA',  'Formulación de visión', 4),
  ('TEORICA',  'Juicio y toma de decisiones', 5),
  ('TEORICA',  'Evaluación de sistemas organizacionales', 6),
  ('PRACTICA', 'Manejo de recursos financieros', 1),
  ('PRACTICA', 'Construcción de relaciones', 2),
  ('PRACTICA', 'Asertividad y firmeza', 3),
  ('PRACTICA', 'Gestión de recursos humanos', 4),
  ('PRACTICA', 'Negociación', 5),
  ('PRACTICA', 'Orientación y asesoramiento', 6)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ADMINISTRACIÓN DE EMPRESAS%';

-- 3. ARMADO DE ESTRUCTURAS METÁLICAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Selección de equipos y herramientas', 2),
  ('PRACTICA', 'Instalación de equipos y maquinaria', 3),
  ('PRACTICA', 'Inspección de productos e insumos', 4),
  ('PRACTICA', 'Reconocimiento de fallas en elementos estructurales', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ARMADO DE ESTRUCTURAS METÁLICAS%';

-- 4. ASESORÍA DE IMAGEN
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Comprensión oral y escrita', 1),
  ('TEORICA', 'Expresión oral y escrita', 2),
  ('TEORICA', 'Fluidez de ideas', 3),
  ('TEORICA', 'Reconocimiento de problemas', 4),
  ('TEORICA', 'Ordenar información', 5),
  ('TEORICA', 'Visualización', 6),
  ('TEORICA', 'Reconocimiento de un discurso', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASESORÍA DE IMAGEN%';

-- 5. ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Ordenar información', 1),
  ('TEORICA',  'Atención selectiva', 2),
  ('PRACTICA', 'Monitoreo y control', 1),
  ('PRACTICA', 'Identificación de problemas', 2),
  ('PRACTICA', 'Comprensión escrita', 3),
  ('PRACTICA', 'Generación de ideas', 4),
  ('PRACTICA', 'Visualización', 5),
  ('PRACTICA', 'Resistencia física', 6),
  ('PRACTICA', 'Manejo de equipo de trabajo', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA A LA SUPERVISIÓN DE ACTIVIDADES DE CONSTRUCCIÓN%';

-- 6. ASISTENCIA DE CONTABILIDAD
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Facilidad numérica', 1),
  ('TEORICA', 'Comprensión oral', 2),
  ('TEORICA', 'Expresión oral', 3),
  ('TEORICA', 'Expresión escrita', 4),
  ('TEORICA', 'Reconocimiento de problemas', 5),
  ('TEORICA', 'Ordenar información', 6),
  ('TEORICA', 'Atención selectiva', 7),
  ('TEORICA', 'Razonamiento deductivo', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA DE CONTABILIDAD%';

-- 7. ARTICULACIÓN LOCAL DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Atención selectiva', 1),
  ('TEORICA',  'Reconocimiento de problemas', 2),
  ('TEORICA',  'Facilidad numérica', 3),
  ('PRACTICA', 'Comprensión y expresión oral', 1),
  ('PRACTICA', 'Atención selectiva', 2),
  ('PRACTICA', 'Reconocimiento de problemas', 3),
  ('PRACTICA', 'Facilidad numérica', 4),
  ('PRACTICA', 'Expresión escrita', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ARTICULACIÓN LOCAL%DESNUTRICIÓN%';

-- 8. ASISTENCIA EN GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Ordenar información', 1),
  ('TEORICA',  'Comprensión escrita', 2),
  ('TEORICA',  'Reconocimiento de problema', 3),
  ('PRACTICA', 'Comprensión oral', 1),
  ('PRACTICA', 'Expresión oral', 2),
  ('PRACTICA', 'Expresión escrita', 3),
  ('PRACTICA', 'Memorizar', 4),
  ('PRACTICA', 'Atención selectiva', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA EN GESTIÓN DOCUMENTAL%';

-- 9. ASISTENCIA EN SEGURIDAD INDUSTRIAL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Comprensión oral y escrita', 1),
  ('TEORICA', 'Expresión oral y escrita', 2),
  ('TEORICA', 'Fluidez de ideas', 3),
  ('TEORICA', 'Reconocimiento de problemas', 4),
  ('TEORICA', 'Ordenar información', 5),
  ('TEORICA', 'Visualización', 6),
  ('TEORICA', 'Atención selectiva', 7),
  ('TEORICA', 'Reconocimiento y claridad de un discurso', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ASISTENCIA EN SEGURIDAD INDUSTRIAL%';

-- 10. ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Organizar información', 1),
  ('TEORICA',  'Identificación de problema', 2),
  ('TEORICA',  'Expresión y comprensión escrita', 3),
  ('TEORICA',  'Memorizar', 4),
  ('PRACTICA', 'Expresión y comprensión oral', 1),
  ('PRACTICA', 'Orientación de servicio', 2),
  ('PRACTICA', 'Atención selectiva', 3),
  ('PRACTICA', 'Trabajo en equipo', 4),
  ('PRACTICA', 'Fluidez de ideas', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ATENCIÓN INTEGRAL EN CENTRO DE DESARROLLO INFANTIL%';

-- 11. CONDUCTOR PROFESIONAL DE BUS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Cálculos de distancia y tiempo para recorridos', 1),
  ('TEORICA',  'Interpretación de mapas de carreteras y señalización de rutas', 2),
  ('TEORICA',  'Planificación de corto plazo de acuerdo con ruta y condiciones del trayecto', 3),
  ('PRACTICA', 'Visión aguda para identificar colores, objetos e informaciones a distancia', 1),
  ('PRACTICA', 'Agudeza auditiva y olfativa para identificar ruidos y olores', 2),
  ('PRACTICA', 'Firmeza en la manipulación de objetos y coordinación motriz', 3),
  ('PRACTICA', 'Comunicación oral y escrita', 4)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CONDUCTOR PROFESIONAL DE BUS%';

-- 12. CONSEJERÍAS DE ATENCIÓN FAMILIAR CNH
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Identificación de problema', 1),
  ('TEORICA',  'Memorizar', 2),
  ('TEORICA',  'Organización de información', 3),
  ('TEORICA',  'Expresión y comprensión escrita', 4),
  ('PRACTICA', 'Expresión y comprensión oral', 1),
  ('PRACTICA', 'Destreza manual', 2),
  ('PRACTICA', 'Trabajo en equipo', 3),
  ('PRACTICA', 'Fluidez de ideas', 4),
  ('PRACTICA', 'Empatía y dinamismo', 5),
  ('PRACTICA', 'Toma de decisiones', 6),
  ('PRACTICA', 'Orientación al servicio', 7),
  ('PRACTICA', 'Generación de ideas', 8),
  ('PRACTICA', 'Atención selectiva', 9),
  ('PRACTICA', 'Motricidad fina', 10),
  ('PRACTICA', 'Motricidad gruesa', 11),
  ('PRACTICA', 'Flexibilidad', 12),
  ('PRACTICA', 'Liderazgo', 13)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CRECIENDO CON NUESTROS HIJOS%';

-- 13. COORDINACIÓN EN CENTRO DE DESARROLLO INFANTIL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Memorizar', 1),
  ('TEORICA',  'Organización de la información', 2),
  ('TEORICA',  'Reconocimiento de problemas', 3),
  ('TEORICA',  'Coordinación', 4),
  ('TEORICA',  'Expresión y comprensión escrita', 5),
  ('PRACTICA', 'Expresión y comprensión oral', 1),
  ('PRACTICA', 'Trabajo en equipo', 2),
  ('PRACTICA', 'Fluidez de ideas', 3),
  ('PRACTICA', 'Empatía y dinamismo', 4),
  ('PRACTICA', 'Toma de decisiones', 5),
  ('PRACTICA', 'Flexibilidad', 6),
  ('PRACTICA', 'Orientación al servicio', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COORDINACIÓN EN CENTRO DE DESARROLLO INFANTIL%';

-- 14. COORDINACIÓN TERRITORIAL DESNUTRICIÓN CRÓNICA INFANTIL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Razonamiento deductivo', 1),
  ('TEORICA',  'Razonamiento inductivo', 2),
  ('TEORICA',  'Memorizar', 3),
  ('TEORICA',  'Reconocimiento de problemas', 4),
  ('PRACTICA', 'Expresión y comprensión oral', 1),
  ('PRACTICA', 'Destreza manual', 2),
  ('PRACTICA', 'Trabajo en equipo', 3),
  ('PRACTICA', 'Fluidez de ideas', 4),
  ('PRACTICA', 'Originalidad', 5),
  ('PRACTICA', 'Empatía y dinamismo', 6)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COORDINACIÓN TERRITORIAL%DESNUTRICIÓN%';

-- 15. COSMETOLOGÍA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problema', 1),
  ('TEORICA',  'Comprensión escrita', 2),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Comprensión oral', 2),
  ('PRACTICA', 'Comprensión y expresión escrita', 3),
  ('PRACTICA', 'Memorizar', 4),
  ('PRACTICA', 'Orientación espacial', 5),
  ('PRACTICA', 'Visualización', 6),
  ('PRACTICA', 'Atención selectiva', 7),
  ('PRACTICA', 'Motricidad fina y gruesa', 8),
  ('PRACTICA', 'Operación y control', 9)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COSMETOLOGÍA%' AND UPPER(nombre) NOT ILIKE '%COSMIATRÍA%';

-- 16. COSMIATRÍA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problema', 1),
  ('TEORICA',  'Comprensión escrita', 2),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Comprensión y expresión oral', 2),
  ('PRACTICA', 'Comprensión y expresión escrita', 3),
  ('PRACTICA', 'Memorizar', 4),
  ('PRACTICA', 'Orientación espacial', 5),
  ('PRACTICA', 'Visualización', 6),
  ('PRACTICA', 'Atención selectiva', 7),
  ('PRACTICA', 'Motricidad fina y gruesa', 8),
  ('PRACTICA', 'Operación y control', 9),
  ('PRACTICA', 'Monitoreo y control', 10)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%COSMIATRÍA%';

-- 17. CUIDADO DE PERSONAS ADULTAS MAYORES
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Organización de la información', 1),
  ('TEORICA',  'Identificación de problemas', 2),
  ('TEORICA',  'Facilidad numérica', 3),
  ('TEORICA',  'Expresión escrita', 4),
  ('TEORICA',  'Memorizar', 5),
  ('TEORICA',  'Orientación al servicio', 6),
  ('PRACTICA', 'Comprensión oral', 1),
  ('PRACTICA', 'Expresión oral', 2),
  ('PRACTICA', 'Percepción visual', 3),
  ('PRACTICA', 'Atención selectiva', 4),
  ('PRACTICA', 'Motricidad fina', 5),
  ('PRACTICA', 'Motricidad gruesa', 6),
  ('PRACTICA', 'Flexibilidad', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CUIDADO DE PERSONAS ADULTAS MAYORES%';

-- 18. DISEÑO GRÁFICO Y COMUNICACIÓN VISUAL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Identificación de problemas', 1),
  ('TEORICA',  'Memorizar', 2),
  ('TEORICA',  'Toma de decisiones', 3),
  ('TEORICA',  'Manejo de auditorios', 4),
  ('PRACTICA', 'Monitoreo y control', 1),
  ('PRACTICA', 'Comprensión oral', 2),
  ('PRACTICA', 'Manejo de recursos materiales', 3),
  ('PRACTICA', 'Generación de ideas', 4),
  ('PRACTICA', 'Atención selectiva', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%DISEÑO GRÁFICO%';

-- 19-21. ENTRENAMIENTO CANINO (los 3 tienen las mismas habilidades excepto Intervención Asistida)
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Manejo de recursos materiales', 1),
  ('TEORICA',  'Identificación de problemas', 2),
  ('PRACTICA', 'Organización de la información', 1),
  ('PRACTICA', 'Manejo de recursos materiales', 2),
  ('PRACTICA', 'Identificación de problemas', 3),
  ('PRACTICA', 'Orientación de servicio', 4),
  ('PRACTICA', 'Conocimiento del entorno organizacional', 5),
  ('PRACTICA', 'Generación de ideas', 6),
  ('PRACTICA', 'Operación y control', 7),
  ('PRACTICA', 'Motricidad fina', 8),
  ('PRACTICA', 'Motricidad gruesa', 9),
  ('PRACTICA', 'Resistencia física', 10)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%ENTRENAMIENTO CANINO%';

-- 22. EVALUACIÓN DE LA CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Trabajo en equipo', 1),
  ('TEORICA',  'Capacidad de síntesis', 2),
  ('TEORICA',  'Liderazgo', 3),
  ('PRACTICA', 'Pensamiento analítico crítico', 1),
  ('PRACTICA', 'Expresión oral y escrita', 2)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%CALIDAD Y EXCELENCIA EN LA GESTIÓN PÚBLICA%';

-- 23. FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Comprensión oral y escrita', 1),
  ('PRACTICA', 'Organización de la información', 1),
  ('PRACTICA', 'Identificación de problemas', 2),
  ('PRACTICA', 'Comprensión oral y escrita', 3),
  ('PRACTICA', 'Expresión oral y escrita', 4),
  ('PRACTICA', 'Manejo de auditorios', 5),
  ('PRACTICA', 'Monitoreo y control', 6)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%FACILITACIÓN EN ACTIVIDADES DE CAPACITACIÓN%';

-- 25. FOTÓGRAFO EN MEDIOS Y MULTIMEDIA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Responsabilidad', 1),
  ('TEORICA',  'Trabajo en equipo', 2),
  ('TEORICA',  'Planificación y organización', 3),
  ('PRACTICA', 'Comprensión escrita', 1),
  ('PRACTICA', 'Análisis de operaciones', 2),
  ('PRACTICA', 'Recopilación de información', 3),
  ('PRACTICA', 'Aprendizaje activo', 4),
  ('PRACTICA', 'Organización de la información', 5),
  ('PRACTICA', 'Expresión oral', 6),
  ('PRACTICA', 'Creatividad', 7),
  ('PRACTICA', 'Proactividad', 8),
  ('PRACTICA', 'Atención selectiva', 9),
  ('PRACTICA', 'Manejo de recursos materiales', 10),
  ('PRACTICA', 'Comprensión oral', 11)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%FOTÓGRAFO EN MEDIOS%';

-- 26. GESTIÓN ADMINISTRATIVA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Ordenar información', 1),
  ('TEORICA', 'Facilidad numérica', 2),
  ('TEORICA', 'Expresión oral y escrita', 3),
  ('TEORICA', 'Atención selectiva', 4),
  ('TEORICA', 'Razonamiento deductivo', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) = 'GESTIÓN ADMINISTRATIVA';

-- 27. GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Comprensión escrita', 1),
  ('TEORICA',  'Expresión escrita', 2),
  ('TEORICA',  'Razonamiento inductivo', 3),
  ('TEORICA',  'Razonamiento deductivo', 4),
  ('TEORICA',  'Razonamiento matemático', 5),
  ('TEORICA',  'Liderazgo', 6),
  ('PRACTICA', 'Comprensión oral', 1),
  ('PRACTICA', 'Expresión oral', 2),
  ('PRACTICA', 'Reconocimiento y resolución de problemas', 3),
  ('PRACTICA', 'Claridad de discurso', 4),
  ('PRACTICA', 'Originalidad e iniciativa', 5),
  ('PRACTICA', 'Razonamiento deductivo', 6),
  ('PRACTICA', 'Razonamiento matemático', 7),
  ('PRACTICA', 'Liderazgo', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD%';

-- 28. GESTIÓN AMBIENTAL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Monitoreo y control', 1),
  ('TEORICA',  'Identificación de problemas', 2),
  ('TEORICA',  'Toma de decisiones', 3),
  ('PRACTICA', 'Orientación espacial', 1),
  ('PRACTICA', 'Identificación de problemas', 2),
  ('PRACTICA', 'Monitoreo y control', 3),
  ('PRACTICA', 'Toma de decisiones', 4)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN AMBIENTAL%';

-- 29. GESTIÓN EN SOLDADURA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('PRACTICA', 'Comprensión oral y escrita', 1),
  ('PRACTICA', 'Ordenar información', 2),
  ('PRACTICA', 'Razonamiento inductivo-deductivo', 3),
  ('PRACTICA', 'Atención selectiva', 4),
  ('PRACTICA', 'Control de precisión', 5),
  ('PRACTICA', 'Orientación de respuesta', 6),
  ('PRACTICA', 'Coordinación gruesa del cuerpo', 7),
  ('PRACTICA', 'Visualización', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN EN SOLDADURA%';

-- 30. GESTIÓN EN PROMOCIÓN DE MARCAS, PRODUCTOS Y SERVICIOS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problemas', 1),
  ('TEORICA',  'Resolución de problemas', 2),
  ('TEORICA',  'Razonamiento deductivo', 3),
  ('TEORICA',  'Razonamiento inductivo', 4),
  ('TEORICA',  'Pensamiento estratégico', 5),
  ('TEORICA',  'Pensamiento crítico', 6),
  ('TEORICA',  'Pensamiento analítico', 7),
  ('PRACTICA', 'Fluidez de ideas', 1),
  ('PRACTICA', 'Originalidad', 2),
  ('PRACTICA', 'Visualización', 3),
  ('PRACTICA', 'Reconocimiento de problemas', 4),
  ('PRACTICA', 'Resolución de problemas', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PROMOCIÓN DE MARCAS%';

-- 31. GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Monitoreo y control', 1),
  ('TEORICA',  'Facilidad numérica', 2),
  ('PRACTICA', 'Monitoreo y control', 1),
  ('PRACTICA', 'Organización de la información', 2),
  ('PRACTICA', 'Identificación de problemas', 3),
  ('PRACTICA', 'Facilidad numérica', 4),
  ('PRACTICA', 'Toma de decisiones', 5),
  ('PRACTICA', 'Generación de ideas', 6),
  ('PRACTICA', 'Atención selectiva', 7),
  ('PRACTICA', 'Manejo de auditorios', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%GESTIÓN INTEGRAL DE RIESGOS FINANCIEROS%';

-- 32. INSTALACIONES ELÉCTRICAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('PRACTICA', 'Manipulación de herramientas para instalaciones eléctricas', 1),
  ('PRACTICA', 'Tendido de canalización (canaleta y tubería)', 2),
  ('PRACTICA', 'Instalación de artefactos y máquinas eléctricas', 3),
  ('PRACTICA', 'Instalación de tableros principales y secundarios', 4),
  ('PRACTICA', 'Identificación de posibles riesgos eléctricos', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%INSTALACIONES ELÉCTRICAS%';

-- 33. INSTALACIONES HIDROSANITARIAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Identificación de problemas', 1),
  ('TEORICA',  'Facilidad numérica', 2),
  ('PRACTICA', 'Comprensión oral y escrita', 1),
  ('PRACTICA', 'Memorizar', 2),
  ('PRACTICA', 'Orientación espacial', 3),
  ('PRACTICA', 'Visualización', 4),
  ('PRACTICA', 'Atención selectiva', 5),
  ('PRACTICA', 'Motricidad fina', 6),
  ('PRACTICA', 'Motricidad gruesa', 7),
  ('PRACTICA', 'Resistencia física', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%INSTALACIONES HIDROSANITARIAS%';

-- 34. MAQUILLAJE
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problema', 1),
  ('TEORICA',  'Comprensión escrita', 2),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Facilidad numérica', 2),
  ('PRACTICA', 'Expresión oral', 3),
  ('PRACTICA', 'Atención selectiva', 4),
  ('PRACTICA', 'Motricidad fina y gruesa', 5),
  ('PRACTICA', 'Orientación de servicio', 6),
  ('PRACTICA', 'Operación y control', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%MAQUILLAJE%';

-- 35. NEURODESARROLLO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Organización de la información', 1),
  ('TEORICA',  'Identificación de problemas', 2),
  ('TEORICA',  'Comprensión oral', 3),
  ('TEORICA',  'Memorizar', 4),
  ('TEORICA',  'Comprensión escrita', 5),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Generación de ideas', 2),
  ('PRACTICA', 'Orientación de servicio', 3),
  ('PRACTICA', 'Flexibilidad', 4)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%NEURODESARROLLO%';

-- 36. OFIMÁTICA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Adaptabilidad al cambio', 1),
  ('TEORICA', 'Organización de información', 2),
  ('TEORICA', 'Trabajo en equipo', 3),
  ('TEORICA', 'Aprendizaje activo', 4),
  ('TEORICA', 'Manejo de recursos materiales', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OFIMÁTICA%ASISTENCIA ADMINISTRATIVA%';

-- 37. OPERACIÓN Y MANTENIMIENTO - LÍNEAS AÉREAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Identificación de problemas', 1),
  ('PRACTICA', 'Expresión oral', 1),
  ('PRACTICA', 'Visualización', 2),
  ('PRACTICA', 'Orientación espacial', 3),
  ('PRACTICA', 'Motricidad gruesa', 4),
  ('PRACTICA', 'Motricidad fina', 5),
  ('PRACTICA', 'Manejo de materiales', 6),
  ('PRACTICA', 'Operación y control', 7),
  ('PRACTICA', 'Organización de información', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIÓN Y MANTENIMIENTO%LÍNEAS AÉREAS%';

-- 38. OPERACIÓN Y MANTENIMIENTO - LÍNEAS SUBTERRÁNEAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Identificación de problemas', 1),
  ('PRACTICA', 'Expresión oral', 1),
  ('PRACTICA', 'Visualización', 2),
  ('PRACTICA', 'Orientación espacial', 3),
  ('PRACTICA', 'Motricidad gruesa', 4),
  ('PRACTICA', 'Motricidad fina', 5),
  ('PRACTICA', 'Manejo de materiales', 6),
  ('PRACTICA', 'Operación y control', 7),
  ('PRACTICA', 'Organización de información', 8),
  ('PRACTICA', 'Resistencia física', 9)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIÓN Y MANTENIMIENTO%SUBTERRÁNEAS%';

-- 39. OPERACIONES ARCHIVÍSTICAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Comprensión escrita', 1),
  ('TEORICA',  'Reconocimiento de problemas', 2),
  ('TEORICA',  'Ordenar información', 3),
  ('TEORICA',  'Facilidad numérica', 4),
  ('PRACTICA', 'Expresión escrita', 1),
  ('PRACTICA', 'Expresión oral', 2),
  ('PRACTICA', 'Atención selectiva', 3),
  ('PRACTICA', 'Destreza manual', 4)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIONES ARCHIVÍSTICAS%';

-- 40. OPERACIONES AUXILIARES EN LIMPIEZA DE UNIDADES DE SALUD
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('PRACTICA', 'Comprensión oral', 1),
  ('PRACTICA', 'Comprensión escrita', 2),
  ('PRACTICA', 'Expresión oral', 3),
  ('PRACTICA', 'Expresión escrita', 4),
  ('PRACTICA', 'Reconocimiento de problemas', 5),
  ('PRACTICA', 'Ordenar información', 6),
  ('PRACTICA', 'Memorizar', 7),
  ('PRACTICA', 'Destreza manual', 8),
  ('PRACTICA', 'Visión cercana', 9),
  ('PRACTICA', 'Firmeza de brazo y mano', 10)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%LIMPIEZA DE UNIDADES DE SALUD%';

-- 41. OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Memorizar', 1),
  ('TEORICA',  'Facilidad numérica', 2),
  ('TEORICA',  'Comprensión escrita', 3),
  ('PRACTICA', 'Comprensión y expresión oral', 1),
  ('PRACTICA', 'Motricidad fina', 2),
  ('PRACTICA', 'Motricidad gruesa', 3),
  ('PRACTICA', 'Resistencia física', 4),
  ('PRACTICA', 'Flexibilidad', 5),
  ('PRACTICA', 'Orientación espacial', 6),
  ('PRACTICA', 'Percepción visual', 7),
  ('PRACTICA', 'Atención selectiva', 8)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS%';

-- 42. PREPARACIÓN GASTRONÓMICA DE COCINA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Comprensión escrita', 1),
  ('PRACTICA', 'Comprensión oral', 1),
  ('PRACTICA', 'Expresión oral', 2),
  ('PRACTICA', 'Organización de la información', 3),
  ('PRACTICA', 'Orientación espacial', 4),
  ('PRACTICA', 'Atención selectiva', 5),
  ('PRACTICA', 'Memorizar', 6),
  ('PRACTICA', 'Resistencia física', 7)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREPARACIÓN GASTRONÓMICA DE COCINA%';

-- 43. PREVENCIÓN DE RIESGOS LABORALES: CONSTRUCCIÓN Y OBRA CIVIL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problema', 1),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Monitoreo y control', 2),
  ('PRACTICA', 'Atención selectiva', 3),
  ('PRACTICA', 'Visualización', 4),
  ('PRACTICA', 'Generación de ideas en prevención de riesgos', 5),
  ('PRACTICA', 'Conducta segura y autocuidado', 6)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN DE RIESGOS LABORALES%CONSTRUCCIÓN%';

-- 44. PREVENCIÓN DE RIESGOS LABORALES: ENERGÍA ELÉCTRICA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento de problema', 1),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Monitoreo y control', 2),
  ('PRACTICA', 'Atención selectiva', 3),
  ('PRACTICA', 'Visualización', 4),
  ('PRACTICA', 'Generación de ideas en prevención de riesgos', 5),
  ('PRACTICA', 'Conducta segura y autocuidado', 6)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN DE RIESGOS LABORALES%ENERGÍA ELÉCTRICA%';

-- 45. PREVENCIÓN E INTERVENCIÓN EN PROBLEMAS DEL COMPORTAMIENTO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Organización de la información', 1),
  ('TEORICA',  'Identificación de problemas', 2),
  ('TEORICA',  'Comprensión oral', 3),
  ('TEORICA',  'Memorizar', 4),
  ('TEORICA',  'Comprensión escrita', 5),
  ('PRACTICA', 'Manejo de recursos materiales', 1),
  ('PRACTICA', 'Generación de ideas', 2),
  ('PRACTICA', 'Orientación de servicio', 3),
  ('PRACTICA', 'Flexibilidad', 4)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%PREVENCIÓN E INTERVENCIÓN EN LOS PROBLEMAS DEL COMPORTAMIENTO%';

-- 46. SEGURIDAD INDUSTRIAL
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA', 'Comprensión oral y escrita', 1),
  ('TEORICA', 'Expresión oral y escrita', 2),
  ('TEORICA', 'Reconocimiento de problemas', 3),
  ('TEORICA', 'Razonamiento deductivo', 4),
  ('TEORICA', 'Razonamiento inductivo', 5),
  ('TEORICA', 'Ordenar información', 6),
  ('TEORICA', 'Memorización', 7),
  ('TEORICA', 'Reconocimiento de un discurso', 8),
  ('TEORICA', 'Claridad de discurso', 9)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) = 'SEGURIDAD INDUSTRIAL';

-- 47. SOLDADURA
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('PRACTICA', 'Seleccionar materiales e insumos de soldadura', 1),
  ('PRACTICA', 'Seleccionar maquinarias, herramienta y EPP de soldadura', 2),
  ('PRACTICA', 'Realizar la instalación de maquinaria y cableado de equipos de soldadura', 3),
  ('PRACTICA', 'Resolver problema de fallas en el proceso de soldadura', 4),
  ('PRACTICA', 'Realizar juntas y uniones mediante proceso y normas de soldadura', 5)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) = 'SOLDADURA';

-- 48. SUPERVISIÓN DE EDIFICACIONES Y OBRAS CIVILES
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Reconocimiento y resolución de problemas', 1),
  ('TEORICA',  'Razonamiento matemático', 2),
  ('PRACTICA', 'Razonamiento lógico deductivo e inductivo', 1),
  ('PRACTICA', 'Atención selectiva', 2),
  ('PRACTICA', 'Comprensión oral y escrita', 3),
  ('PRACTICA', 'Expresión oral y escrita', 4),
  ('PRACTICA', 'Orientación espacial', 5),
  ('PRACTICA', 'Visualización', 6),
  ('PRACTICA', 'Visión cercana y lejana', 7),
  ('PRACTICA', 'Vigor', 8),
  ('PRACTICA', 'Reconocimiento y resolución de problemas', 9)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%SUPERVISIÓN DE EDIFICACIONES%';

-- 49. SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL Y ARCHIVO
INSERT INTO matsso.habilidad (id_certificacion, tipo, descripcion, orden)
SELECT id_certificacion, tipo_, desc_, ord_ FROM matsso.certificacion
CROSS JOIN (VALUES
  ('TEORICA',  'Razonamiento inductivo', 1),
  ('TEORICA',  'Razonamiento deductivo', 2),
  ('TEORICA',  'Razonamiento matemático', 3),
  ('TEORICA',  'Comprensión escrita', 4),
  ('TEORICA',  'Repartición temporal', 5),
  ('PRACTICA', 'Originalidad', 1),
  ('PRACTICA', 'Comprensión oral', 2),
  ('PRACTICA', 'Expresión oral', 3)
) AS v(tipo_, desc_, ord_)
WHERE UPPER(nombre) ILIKE '%SUPERVISIÓN DE LA GESTIÓN DOCUMENTAL%';


-- ============================================================
-- VERIFICAR RESULTADOS
-- ============================================================
SELECT 'competencia' AS tabla, COUNT(*) AS registros FROM matsso.competencia
UNION ALL
SELECT 'habilidad'   AS tabla, COUNT(*) AS registros FROM matsso.habilidad;

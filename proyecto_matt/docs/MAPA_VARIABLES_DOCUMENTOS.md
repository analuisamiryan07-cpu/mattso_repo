# Mapa de variables documentales

El catálogo ejecutable está en `config/document_markers.php`. Cada variable que
entra a una plantilla debe figurar tanto en ese catálogo como en este documento.

## C02 — Solicitud de certificación

| Variable canónica | Marcador principal | Origen y comportamiento |
|---|---|---|
| `SECUENCIA_CODIGO` | `SMD_secuencia_codigo` | Campo de texto del formulario; se conserva el prefijo impreso del C02. |
| `FECHA_C02` | `SMD_fecha_c02` | Fecha exclusiva de la solicitud C02, seleccionada por el usuario e independiente de la fecha general. No tiene un valor fijo. |
| `NOMBRE` | `SMD_nombrecompleto` | Nombre completo del candidato. |
| `CEDULA` | `SMD_cedula` | Cédula del candidato. |
| `CORREO` | `SMD_correo` | Correo del candidato. |
| `EDAD` | `SMD_edad` | Edad numérica entre 1 y 120. |
| `PROVINCIA` | `SMD_provincia` | Desplegable de las 24 provincias. |
| `CIUDAD` | `SMD_ciudad` | Desplegable de cantones filtrado por la provincia seleccionada. |
| `DIRECCION` | `SMD_direccion` | Dirección personal del candidato; se utiliza únicamente en C02. |
| `TELEFONO_CANDIDATO` | `SMD_telefono_candidato` | Alias documental: en C08 recibe el celular personal porque la columna corresponde a `TELF. CELULAR`. |
| `CELULAR` | `SMD_celular` | Celular personal, solo dígitos y máximo 10. |
| `PERFIL_PROFESIONAL` | `SMD_perfil_profesional` | Desplegable independiente alimentado por los perfiles únicos de `esquemas_y_examinadores_matsso.json`. Repetible por solicitud. |
| `ESQUEMA` | `SMD_esquema` | Desplegable independiente alimentado por los esquemas del JSON. Repetible por solicitud. |
| `UNIDAD_COMPETENCIA_1` a `UNIDAD_COMPETENCIA_5` | `SMD_unidad_competencia_1` a `SMD_unidad_competencia_5` | Cinco casillas; cada selección se imprime como `X`. Cada esquema agregado genera una fila. |
| `INSTALACIONES` | `SMD_instalaciones` | Nombre de las instalaciones de examinación. |
| `DIRECCION_INSTALACION` | `SMD_direccion_instalacion` | Dirección de las instalaciones. |
| `SECTOR_INSTALACION` | `SMD_sector` | Sector de las instalaciones. |
| `TELEFONO_INSTALACION` | `SMD_telefono_instalacion` | Teléfono de instalaciones, solo dígitos y máximo 10. |
| `EDUCACION_INSTITUCION` | `SMD_educacion_institucion` | Institución del nivel educativo marcado. Se escribe en la fila propia de cada nivel. |
| `EDUCACION_PAIS` | `SMD_educacion_pais` | País de la institución educativa. |
| `EDUCACION_CIUDAD` | `SMD_educacion_ciudad` | Ciudad de la institución educativa. |
| `EDUCACION_TITULO` | `SMD_educacion_titulo` | Título obtenido. |
| `CAPACITACION_CURSO` | `SMD_capacitacion_curso` | Nombre del curso; sección repetible con botón “Agregar capacitación”. |
| `CAPACITACION_INSTITUCION` | `SMD_capacitacion_institucion` | Institución o empresa que impartió el curso. |
| `CAPACITACION_FECHA` | `SMD_capacitacion_fecha` | Fecha elegida con calendario. |
| `CAPACITACION_HORAS` | `SMD_capacitacion_horas` | Número de horas. |
| `EXPERIENCIA_FECHA_DESDE` | `SMD_experiencia_fecha_desde` | Fecha inicial elegida con calendario. |
| `EXPERIENCIA_FECHA_HASTA` | `SMD_experiencia_fecha_hasta` | Fecha final, igual o posterior a la inicial. |
| `EXPERIENCIA_EMPRESA` | `SMD_experiencia_empresa` | Nombre de la empresa; sección repetible. |
| `EXPERIENCIA_CIUDAD` | `SMD_experiencia_ciudad` | Ciudad o dirección de la empresa. |
| `EXPERIENCIA_TELEFONO` | `SMD_experiencia_telefono` | Teléfono de la empresa, solo dígitos y máximo 10. |
| `EXPERIENCIA_FUNCION` | `SMD_experiencia_funcion` | Función desempeñada. |

Los niveles educativos disponibles son: Lectoescritura C03, Primaria,
Secundaria, Artesano, Tercer nivel y Cuarto nivel. Sus campos permanecen
bloqueados hasta seleccionar el nivel correspondiente.

Los esquemas agregados, capacitaciones y experiencias se escriben en filas
consecutivas. Si los registros superan las filas vacías de la plantilla, el
generador inserta nuevas filas conservando el formato del cuadro.

El listado territorial se mantiene en `config/c02.php` y sigue la estructura de
provincias y cantones del Clasificador Geográfico Estadístico del INEC.

## Variables compartidas con los demás documentos

| Variable | Uso |
|---|---|
| `FECHA` / `SMD_fecha` | Fecha general para todos los documentos excepto C02. Se redacta como `10 de marzo de 2026`. |
| `DIRECCION_INSTALACION` / `SMD_direccion_instalacion` | C08, C09 y C12 muestran únicamente la dirección de las instalaciones, sin concatenar lugar, provincia, ciudad ni sector. |
| `LUGAR_EXAMEN` y `DIRECCION_EXAMEN` | Alias de compatibilidad que también reciben únicamente `DIRECCION_INSTALACION`, nunca la dirección personal. |
| `CIUDAD_FECHA` / `SMD_ciudad_fecha` | C10 combina ciudad y fecha general, por ejemplo `Guayaquil 10 de marzo de 2026`. |
| `PUNTAJE_TEORICO` y `PUNTAJE_PRACTICO` | Opcionales; pueden enviarse vacíos. |
| `EXAMINADOR_NOMBRE` | Nombre derivado del examinador seleccionado en el desplegable completo del JSON. |
| `EXAMINADOR_CEDULA` | Cédula derivada del examinador seleccionado en el JSON. |
| `EXAMINADOR_TELEFONO` | Teléfono derivado del examinador seleccionado en el JSON. |

En C08, `SMD_cedula` recibe la cédula y `SMD_telefono_candidato` recibe el
celular personal del candidato. Los
tres marcadores `SMD_nombreexaminador`, `SMD_cedulaexaminador` y
`SMD_telefonoexaminador` pertenecen exclusivamente al examinador elegido.

El primer esquema de la lista es el **esquema principal**: C02 lo registra y
C08, C09, C10 y C12 reutilizan ese mismo valor cuando corresponda. Los esquemas
adicionales solo agregan filas al cuadro repetible del C02.

## Alias corregidos

El catálogo conserva alias de errores históricos como `SMD_telfono`,
`SMD_Perfilprofecional`, `SMD_educacion_paiz`, `SMD_instalciones` y
`SMD_telefono_instalciones`, pero el C02 normalizado usa los marcadores
principales de la tabla anterior.

# Cómo armar la plantilla `plantilla_reporte.xlsm`

Esto se hace UNA sola vez, en Excel de escritorio (no funciona en Excel Online).
Después de este paso, el servidor reutiliza este archivo para siempre — nunca
más hay que repetirlo.

1. Abre Excel, crea un libro nuevo (vacío).
2. Renombra "Hoja1" a **Datos**. En la fila 1 pon estos encabezados, en este
   orden (columna A a O) — deben coincidir exactamente con lo que hoy genera
   el reporte global:

   `Empleado | Cedula | Grupo | Tipo | Fecha | Dia | LLEGADA | Atraso | S. Almuerzo | R. Almuerzo | SALIDA | Horas trab. | Meta dia | Deficit | Nota`

   No hace falta llenar filas de datos — eso lo hace el servidor cada vez que
   alguien descarga un reporte.

3. Crea una segunda hoja y renómbrala **Reporte**. Aquí es donde el servidor
   va a poner el título, los KPIs y la tabla bonita (igual que el Excel actual).
   Solo necesitas dejarla vacía por ahora, con estas dos celdas de referencia
   (el servidor no las va a tocar):
   - `A1`: puedes escribir "MATSSO - Control de Asistencia" como marcador visual.

4. Presiona `Alt + F11` para abrir el editor de Visual Basic.

5. En el panel izquierdo, doble clic en **ThisWorkbook** (bajo tu libro) y
   pega el contenido completo de [`ThisWorkbook.vba`](./ThisWorkbook.vba).

6. Clic derecho sobre el nombre de tu proyecto (arriba del árbol) →
   **Insert → Module**. Pega ahí el contenido completo de
   [`ModFiltro.vba`](./ModFiltro.vba).

7. Cierra el editor VBA (la X, no hace falta guardar ahí — se guarda con el
   libro).

8. `Archivo → Guardar como` → tipo **"Libro de Excel habilitado para macros
   (*.xlsm)"** → nómbralo `plantilla_reporte.xlsm`.

9. Cierra el archivo y vuélvelo a abrir (Excel puede pedir "Habilitar
   contenido" / macros — acepta). Al abrir debería aparecer automáticamente,
   en la hoja "Reporte":
   - Celda **Q1**: "Filtro rápido", celda **P2**: "Persona:", y en **Q2** un
     desplegable (vacío, porque "Datos" no tiene filas todavía).
   - Un botón "Filtrar OK" en **Q3**, debajo del desplegable.
   - Todo esto queda en la columna Q, lejos de las columnas A-O que usa la
     tabla principal, para que nunca se superpongan sin importar cuántas
     filas tenga el reporte.

   Si ves eso, la plantilla está lista.

   **Nota:** en este punto el botón "Filtrar OK" todavía NO va a funcionar
   del todo — va a mostrar un aviso de "esta plantilla todavía no tiene datos
   reales". Es normal: la macro busca dos nombres definidos
   (`TablaEncabezado` y `TablaDatosInicio`) que el servidor crea recién
   cuando genera un reporte real con datos. La prueba completa del filtro
   se hace con un reporte ya descargado desde la aplicación (paso 10).

10. Mándame el archivo `plantilla_reporte.xlsm` (o dime la ruta si lo subes
    directo al servidor). Con eso yo:
    - Instalo `phpoffice/phpspreadsheet` en el backend.
    - Reescribo `ReporteController` para que cargue esta plantilla, llene
      "Datos" y "Reporte" con la info real de cada consulta (con el color de
      fin de semana ya incluido), y entregue la descarga como `.xlsm` real
      — nunca más HTML.

Si algo no funciona al probar (el botón no aparece, error de macro, etc.),
copia el mensaje de error exacto y lo ajustamos — no puedo ejecutar Excel yo
mismo para probarlo de antemano, así que es normal que haga falta un ajuste
chico en la primera prueba real.

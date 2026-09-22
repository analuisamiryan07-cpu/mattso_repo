' Pegar en un modulo NUEVO: clic derecho en "VBAProject" en el arbol del
' editor VBA (Alt+F11) -> Insert -> Module. Pegar todo este archivo ahi.
'
' Requiere dos hojas en el libro:
'   "Datos"    -> el servidor la llena con una fila de encabezados en la fila 1
'                 y una fila por marcacion/dia debajo. Columna A = nombre del
'                 empleado (debe ser la primera columna, igual que hoy).
'   "Reporte"  -> hoja visible con el titulo/KPIs (igual al Excel actual) mas
'                 el desplegable en Q2 y el boton "Filtrar" en Q3, lejos de las
'                 columnas A-O que usa la tabla para que nunca se pisen.
Option Explicit

Public Sub CrearControlesFiltro()
    Dim ws As Worksheet, wsDatos As Worksheet, wsAux As Worksheet
    Set ws      = ThisWorkbook.Sheets("Reporte")
    Set wsDatos = ThisWorkbook.Sheets("Datos")

    ' ── 1. Lista de personas unica, tomada de la columna A de "Datos" ──────────
    Dim ultimaFila As Long
    ultimaFila = wsDatos.Cells(wsDatos.Rows.Count, 1).End(xlUp).Row

    Dim dict As Object
    Set dict = CreateObject("Scripting.Dictionary")
    Dim i As Long, nombre As String
    For i = 2 To ultimaFila
        nombre = Trim(wsDatos.Cells(i, 1).Value)
        If nombre <> "" And Not dict.exists(nombre) Then dict.Add nombre, 1
    Next i

    ' ── 2. Hoja auxiliar oculta con la lista, para alimentar el desplegable ────
    On Error Resume Next
    Set wsAux = ThisWorkbook.Sheets("ListaPersonas")
    On Error GoTo 0
    If wsAux Is Nothing Then
        Set wsAux = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        wsAux.Name = "ListaPersonas"
    End If
    wsAux.Cells.Clear
    Dim k As Variant, r As Long
    r = 1
    For Each k In dict.Keys
        wsAux.Cells(r, 1).Value = k
        r = r + 1
    Next k
    wsAux.Visible = xlSheetVeryHidden

    ' ── 3. Desplegable en Q2 de "Reporte" — lejos de la tabla (columnas A-O) ────
    ws.Range("Q1").Value = "Filtro rápido"
    ws.Range("P2").Value = "Persona:"
    With ws.Range("Q2").Validation
        .Delete
        If r > 1 Then
            .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
                 Formula1:="=ListaPersonas!$A$1:$A$" & (r - 1)
        End If
    End With

    ' ── 4. Boton "Filtrar" debajo del desplegable (solo se crea si no existe) ──
    Dim yaExiste As Boolean, b As Button
    For Each b In ws.Buttons
        If b.Name = "btnFiltrarPersona" Then yaExiste = True
    Next b
    If Not yaExiste Then
        Dim btn As Button
        Set btn = ws.Buttons.Add(ws.Range("Q3").Left, ws.Range("Q3").Top, 90, ws.Range("Q2").Height)
        btn.Name = "btnFiltrarPersona"
        btn.Caption = "Filtrar OK"
        btn.OnAction = "FiltrarPorPersona"
    End If
End Sub

' Arma la hoja filtrada leyendo los VALORES desde "Reporte" (no desde
' "Datos") celda por celda -- a proposito NO usa Range.Copy en ningun punto
' de esta funcion. .Copy entre hojas usa el portapapeles de Windows, que en
' ciertos equipos (sobre todo con acceso remoto/VPN) falla con el error
' 1004 de forma intermitente. Asignar .Value directamente nunca toca el
' portapapeles, asi que ese error queda eliminado de raiz.
'
' Los colores (atraso amarillo, deficit verde/rojo, fin de semana ambar) se
' RECALCULAN leyendo el texto que ya quedo en cada celda (no se copian del
' formato de "Reporte"), asi que tampoco arriesgan el error del portapapeles.
'
' Requiere dos nombres definidos (Formulas > Administrador de nombres) que
' el servidor crea al generar cada reporte:
'   TablaEncabezado  -> fila del encabezado de la tabla en "Reporte"
'   TablaDatosInicio -> primera celda de datos de la tabla en "Reporte"
' Asi la macro encuentra la tabla sin importar cuantas filas de KPIs haya
' arriba (si el diseno del encabezado cambia mas adelante, sigue funcionando).
Public Sub FiltrarPorPersona()
    Dim wsReporte As Worksheet, wsDatos As Worksheet, wsNueva As Worksheet
    Set wsReporte = ThisWorkbook.Sheets("Reporte")
    Set wsDatos   = ThisWorkbook.Sheets("Datos")

    Dim nombre As String
    nombre = Trim(wsReporte.Range("Q2").Value)
    If nombre = "" Then
        MsgBox "Selecciona una persona en el desplegable antes de filtrar.", vbExclamation
        Exit Sub
    End If

    On Error GoTo SinNombresDefinidos
    Dim filaEncabezado As Long, filaInicio As Long
    filaEncabezado = ThisWorkbook.Names("TablaEncabezado").RefersToRange.Row
    filaInicio     = ThisWorkbook.Names("TablaDatosInicio").RefersToRange.Row
    On Error GoTo 0

    Dim ultimaCol As Long
    ultimaCol = wsReporte.Cells(filaEncabezado, wsReporte.Columns.Count).End(xlToLeft).Column

    Dim ultimaFilaReporte As Long
    ultimaFilaReporte = wsReporte.Cells(wsReporte.Rows.Count, 1).End(xlUp).Row

    Dim nombreHoja As String
    nombreHoja = Left("Filtro-" & nombre, 31) ' Excel limita nombres de hoja a 31 caracteres

    ' Si ya existe una hoja para esta misma persona, se reemplaza (no se
    ' abren dos veces) -- pero las hojas de OTRAS personas filtradas antes
    ' se conservan, para poder tener varias abiertas a la vez.
    Application.DisplayAlerts = False
    On Error Resume Next
    ThisWorkbook.Sheets(nombreHoja).Delete
    On Error GoTo 0
    Application.DisplayAlerts = True

    Set wsNueva = ThisWorkbook.Sheets.Add(After:=wsDatos)
    wsNueva.Name = nombreHoja

    ' Titulo: se arma directo en la hoja nueva (NO se copia desde "Reporte")
    ' porque A1 ahi es una celda combinada, y copiar celdas combinadas entre
    ' hojas con .Copy falla a veces con el error 1004. Asi se evita del todo,
    ' y de paso nunca arrastra el cuadro "Filtro rapido" (columnas P/Q).
    With wsNueva.Range(wsNueva.Cells(1, 1), wsNueva.Cells(1, ultimaCol))
        .Merge
        .Interior.Color = RGB(15, 42, 92)   ' navy
        .Font.Color = RGB(255, 255, 255)
        .Font.Bold = True
        .Font.Size = 14
        .Font.Name = "Calibri"
        .VerticalAlignment = xlCenter
    End With
    wsNueva.Range("A1").Value = "MATSSO - Control de Asistencia - Filtrado: " & nombre
    wsNueva.Rows(1).RowHeight = 28

    ' Encabezado de la tabla: se leen los valores y se aplica el formato
    ' navy/blanco directo (sin Copy).
    Dim c As Long
    For c = 1 To ultimaCol
        wsNueva.Cells(2, c).Value = wsReporte.Cells(filaEncabezado, c).Value
    Next c
    With wsNueva.Range(wsNueva.Cells(2, 1), wsNueva.Cells(2, ultimaCol))
        .Interior.Color = RGB(15, 42, 92)
        .Font.Color = RGB(255, 255, 255)
        .Font.Bold = True
        .Font.Name = "Calibri"
        .HorizontalAlignment = xlCenter
    End With

    ' Filas de datos: valores + color, columna por columna (sin Copy). El
    ' color no se copia -- se RECALCULA leyendo el texto que ya quedo escrito
    ' en cada celda, exactamente igual que la logica de colores del reporte
    ' global (columnas fijas: 5=Fecha, 8=Atraso, 14=Deficit).
    Dim i As Long, filaDestino As Long, esFinSemana As Boolean
    Dim fechaTxt As String, anioN As Integer, mesN As Integer, diaN As Integer, diaSemanaNum As Integer
    Dim valorAtraso As String, valorDeficit As String
    Dim colorFila As Long, colorBorde As Long

    filaDestino = 3
    For i = filaInicio To ultimaFilaReporte
        If Trim(wsReporte.Cells(i, 1).Value) = nombre Then

            ' Fin de semana: se calcula desde la fecha (columna 5, dd/mm/aaaa)
            ' con Mid() -- no se usa CDate/DateValue para no depender de la
            ' configuracion regional de Windows (que podria confundir dia/mes).
            fechaTxt = Trim(wsReporte.Cells(i, 5).Value)
            esFinSemana = False
            If Len(fechaTxt) = 10 Then
                diaN = CInt(Mid(fechaTxt, 1, 2))
                mesN = CInt(Mid(fechaTxt, 4, 2))
                anioN = CInt(Mid(fechaTxt, 7, 4))
                diaSemanaNum = Weekday(DateSerial(anioN, mesN, diaN), vbMonday) ' 1=Lunes...7=Domingo
                esFinSemana = (diaSemanaNum = 6 Or diaSemanaNum = 7)
            End If

            ' Color base de la fila
            If esFinSemana Then
                colorFila = RGB(254, 243, 199)   ' ambar
                colorBorde = RGB(252, 211, 77)
            ElseIf (filaDestino Mod 2) = 0 Then
                colorFila = RGB(239, 246, 255)   ' celeste
                colorBorde = RGB(191, 219, 254)
            Else
                colorFila = RGB(255, 255, 255)   ' blanco
                colorBorde = RGB(226, 232, 240)
            End If

            For c = 1 To ultimaCol
                wsNueva.Cells(filaDestino, c).Value = wsReporte.Cells(i, c).Value
                With wsNueva.Cells(filaDestino, c)
                    .Interior.Color = colorFila
                    .Borders.LineStyle = xlContinuous
                    .Borders.Color = colorBorde
                    .Font.Name = "Calibri"
                    .Font.Size = 9
                    .Font.Color = RGB(30, 41, 59)
                    .Font.Bold = False
                End With
            Next c

            ' Atraso (columna 8): amarillo si el texto empieza con "+"
            valorAtraso = CStr(wsNueva.Cells(filaDestino, 8).Value)
            If Left(valorAtraso, 1) = "+" Then
                With wsNueva.Cells(filaDestino, 8)
                    .Interior.Color = RGB(254, 249, 195)
                    .Font.Color = RGB(133, 77, 14)
                    .Font.Bold = True
                    .HorizontalAlignment = xlCenter
                End With
            End If

            ' Deficit (columna 14): verde si "Cumplido", rojo si "-Xh Ym"
            ' (un solo "-" o vacio -- fin de semana o sin datos -- no se pinta)
            valorDeficit = CStr(wsNueva.Cells(filaDestino, 14).Value)
            If valorDeficit = "Cumplido" Then
                With wsNueva.Cells(filaDestino, 14)
                    .Interior.Color = RGB(220, 252, 231)
                    .Font.Color = RGB(22, 101, 52)
                    .Font.Bold = True
                    .HorizontalAlignment = xlCenter
                End With
            ElseIf Left(valorDeficit, 1) = "-" And Len(valorDeficit) > 1 Then
                With wsNueva.Cells(filaDestino, 14)
                    .Interior.Color = RGB(254, 226, 226)
                    .Font.Color = RGB(153, 27, 27)
                    .Font.Bold = True
                    .HorizontalAlignment = xlCenter
                End With
            End If

            filaDestino = filaDestino + 1
        End If
    Next i

    wsNueva.Columns.AutoFit
    wsNueva.Activate
    MsgBox "Se genero la hoja """ & nombreHoja & """ con " & (filaDestino - 3) & " registros de " & nombre & ".", vbInformation
    Exit Sub

SinNombresDefinidos:
    MsgBox "Esta plantilla todavia no tiene datos reales generados por el servidor " & _
           "(faltan los nombres definidos TablaEncabezado/TablaDatosInicio). " & _
           "Prueba este boton con un reporte descargado desde la aplicacion.", vbExclamation
End Sub

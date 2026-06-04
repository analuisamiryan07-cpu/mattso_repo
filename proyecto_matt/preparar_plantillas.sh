#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# preparar_plantillas.sh
# Script de configuración inicial del sistema de certificación.
# Convierte los .doc originales a .docx y copia las plantillas
# con marcadores {{CAMPO}} a la carpeta /plantillas/.
# ═══════════════════════════════════════════════════════════════════════════

PROYECTO_DIR="$(cd "$(dirname "$0")" && pwd)"
PLANTILLAS_DIR="$PROYECTO_DIR/plantillas"

echo "═══════════════════════════════════════════════════"
echo " SAPPERPROTECTION — Preparación de plantillas"
echo "═══════════════════════════════════════════════════"

# ── 1. Instalar dependencias PHP ────────────────────────────────────────────
echo ""
echo "▶ Instalando dependencias PHP (Composer)..."
cd "$PROYECTO_DIR"
if ! command -v composer &>/dev/null; then
    echo "  [ERROR] Composer no está instalado."
    echo "  Instálalo con: sudo apt install composer"
    echo "  O descárgalo de: https://getcomposer.org"
    exit 1
fi
composer install --no-interaction --prefer-dist -q
echo "  ✓ Dependencias instaladas."

# ── 2. Convertir .doc a .docx con LibreOffice ───────────────────────────────
echo ""
echo "▶ Convirtiendo archivos .doc a .docx..."
cd "$PROYECTO_DIR"
if ! command -v libreoffice &>/dev/null && ! command -v soffice &>/dev/null; then
    echo "  [ADVERTENCIA] LibreOffice no está instalado."
    echo "  Instálalo con: sudo apt install libreoffice"
    echo "  Los archivos .doc no serán convertidos."
else
    LO_CMD="libreoffice"
    command -v soffice &>/dev/null && LO_CMD="soffice"

    for f in *.doc; do
        [ -f "$f" ] || continue
        echo "  Convirtiendo: $f"
        $LO_CMD --headless --convert-to docx "$f" 2>/dev/null
        echo "  ✓ $f → ${f%.doc}.docx"
    done
    echo "  ✓ Conversión completada."
fi

# ── 3. Copiar C08.docx (ya es docx) ─────────────────────────────────────────
echo ""
echo "▶ Copiando plantillas a $PLANTILLAS_DIR..."
mkdir -p "$PLANTILLAS_DIR"

# C08 ya es .docx
if [ -f "$PROYECTO_DIR/C08.docx" ]; then
    cp "$PROYECTO_DIR/C08.docx" "$PLANTILLAS_DIR/c08_asistencia.docx"
    echo "  ✓ c08_asistencia.docx copiado."
fi

# C05 convertido
if [ -f "$PROYECTO_DIR/22._c05_codigo_de_etica_y_conducta_para_el_examinado.docx" ]; then
    cp "$PROYECTO_DIR/22._c05_codigo_de_etica_y_conducta_para_el_examinado.docx" "$PLANTILLAS_DIR/c05_etica.docx"
    echo "  ✓ c05_etica.docx copiado."
fi

# C09 convertido
if [ -f "$PROYECTO_DIR/26._c09_acuerdo_de_cumplimiento_con_los_lineamientos_para_personas_certificadas.docx" ]; then
    cp "$PROYECTO_DIR/26._c09_acuerdo_de_cumplimiento_con_los_lineamientos_para_personas_certificadas.docx" "$PLANTILLAS_DIR/c09_acuerdo.docx"
    echo "  ✓ c09_acuerdo.docx copiado."
fi

# C10 convertido
if [ -f "$PROYECTO_DIR/27._c10_notificacion_de_certificacion_o_no_certificacion.docx" ]; then
    cp "$PROYECTO_DIR/27._c10_notificacion_de_certificacion_o_no_certificacion.docx" "$PLANTILLAS_DIR/c10_notificacion.docx"
    echo "  ✓ c10_notificacion.docx copiado."
fi

# XLS → XLSX con LibreOffice también
for xls in *.xls; do
    [ -f "$xls" ] || continue
    echo "  Convirtiendo: $xls"
    $LO_CMD --headless --convert-to xlsx "$xls" 2>/dev/null
done

if [ -f "$PROYECTO_DIR/19._c02-solicitud_para_la_certificacion_de_personas adulto.xlsx" ]; then
    cp "$PROYECTO_DIR/19._c02-solicitud_para_la_certificacion_de_personas adulto.xlsx" "$PLANTILLAS_DIR/c02_solicitud.xlsx"
    echo "  ✓ c02_solicitud.xlsx copiado."
fi
if [ -f "$PROYECTO_DIR/29._c12_encuesta_de_satisfaccion_para_el_examinado.xlsx" ]; then
    cp "$PROYECTO_DIR/29._c12_encuesta_de_satisfaccion_para_el_examinado.xlsx" "$PLANTILLAS_DIR/c12_encuesta.xlsx"
    echo "  ✓ c12_encuesta.xlsx copiado."
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo " ⚠  PASO MANUAL REQUERIDO:"
echo "═══════════════════════════════════════════════════"
echo ""
echo " Abre cada archivo en $PLANTILLAS_DIR con LibreOffice"
echo " y reemplaza los datos del candidato actual con"
echo " estos marcadores:"
echo ""
echo "   {{NOMBRE}}           → Nombre completo"
echo "   {{CEDULA}}           → Número de cédula"
echo "   {{TELEFONO}}         → Teléfono celular"
echo "   {{CORREO}}           → Correo electrónico"
echo "   {{DIRECCION}}        → Dirección"
echo "   {{FECHA}}            → Fecha (ej: 23 de enero 2026)"
echo "   {{CIUDAD}}           → Ciudad"
echo "   {{LUGAR}}            → Lugar de examinación"
echo "   {{ESQUEMA}}          → Esquema de certificación"
echo "   {{TIPO_EXAMEN}}      → Teórica / Práctica"
echo "   {{PUNTAJE_TEORICO}}  → Puntaje teórico (%)"
echo "   {{PUNTAJE_PRACTICO}} → Puntaje práctico (%)"
echo ""
echo " Guarda los archivos, ¡y el sistema estará listo!"
echo ""
echo "═══════════════════════════════════════════════════"
echo " ▶ Para iniciar el servidor web:"
echo "   cd $PROYECTO_DIR"
echo "   php -S localhost:8080"
echo " Luego abre Firefox en: http://localhost:8080"
echo "═══════════════════════════════════════════════════"

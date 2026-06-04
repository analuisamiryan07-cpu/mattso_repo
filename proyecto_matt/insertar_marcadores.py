#!/usr/bin/env python3
"""
insertar_marcadores.py
Reemplaza los datos concretos del candidato de prueba con marcadores {{CAMPO}}
en todos los archivos .docx de la carpeta plantillas/.

Ejecutar desde la carpeta raíz del proyecto:
    python3 insertar_marcadores.py
"""

import zipfile, shutil, os, re, openpyxl
from pathlib import Path

PLANTILLAS = Path(__file__).parent / "plantillas"

# ── Mapa: texto a reemplazar → marcador ─────────────────────────────────────
# Orden importante: los más largos primero para evitar reemplazos parciales
REEMPLAZOS = [
    # Nombre completo (múltiples variantes de capitalización)
    ("BONILLA SANCHEZ JOSELIN MARCELA",  "{{NOMBRE}}"),
    ("Bonilla Sanchez Joselin Marcela",  "{{NOMBRE}}"),
    ("bonillajoselin931@gmail.com",      "{{CORREO}}"),
    # Cédula
    ("0202514915",                       "{{CEDULA}}"),
    # Teléfono
    ("0959139068",                       "{{TELEFONO}}"),
    # Fechas (varias formas)
    ("23 de enero 2026",                 "{{FECHA}}"),
    ("viernes, 23 de enero 2026",        "{{FECHA}}"),
    ("23 de enero de 2026",              "{{FECHA}}"),
    # Ciudad
    ("Latacunga",                        "{{CIUDAD}}"),
    # Lugar
    ("INSTALACIONES EXTERNA - JUAN ABEL ECHEVERRÍA Y FERNANDO SÁNCHEZ DE ORELLANA - EMPRESA COORED",
                                         "{{LUGAR}}"),
    ("INSTALACIONES EXTERNA - JUAN ABEL ECHEVERR\u00cdA Y FERNANDO S\u00c1NCHEZ DE ORELLANA - EMPRESA COORED",
                                         "{{LUGAR}}"),
    # Dirección
    ("JUAN ABEL ECHEVERR\u00cdA Y FERNANDO S\u00c1NCHEZ DE ORELLANA",
                                         "{{DIRECCION}}"),
    ("JUAN ABEL ECHEVERRÍA Y FERNANDO SÁNCHEZ DE ORELLANA",
                                         "{{DIRECCION}}"),
    # Esquema de certificación
    ("CUIDADO DE PERSONAS ADULTAS MAYORES",
                                         "{{ESQUEMA}}"),
    # Puntajes (dejar vacíos para rellenar)
    # (Los puntajes están como "________%" en C10 — se mantienen)
]


def reemplazar_en_xml(xml_bytes: bytes) -> bytes:
    """Aplica todos los reemplazos sobre el contenido XML de un documento."""
    content = xml_bytes.decode("utf-8", errors="replace")
    for original, marcador in REEMPLAZOS:
        content = content.replace(original, marcador)
    return content.encode("utf-8")


def procesar_docx(ruta: Path) -> None:
    """Lee el .docx, aplica los reemplazos y lo sobreescribe."""
    tmp = ruta.with_suffix(".tmp.docx")
    with zipfile.ZipFile(ruta, "r") as zin:
        with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                # Solo modificar archivos XML de contenido
                if item.filename.endswith(".xml") or item.filename.endswith(".rels"):
                    data = reemplazar_en_xml(data)
                zout.writestr(item, data)
    shutil.move(str(tmp), str(ruta))
    print(f"  ✓ {ruta.name}")


def procesar_xlsx(ruta: Path) -> None:
    """Lee el .xlsx y aplica reemplazos en todas las celdas de texto."""
    wb = openpyxl.load_workbook(ruta)
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str):
                    val = cell.value
                    for original, marcador in REEMPLAZOS:
                        val = val.replace(original, marcador)
                    cell.value = val
    wb.save(ruta)
    print(f"  ✓ {ruta.name}")


def main():
    print("═══════════════════════════════════════════════════")
    print(" Insertando marcadores {{CAMPO}} en plantillas...")
    print("═══════════════════════════════════════════════════")

    archivos_docx = list(PLANTILLAS.glob("*.docx"))
    archivos_xlsx = list(PLANTILLAS.glob("*.xlsx"))

    if not archivos_docx and not archivos_xlsx:
        print("  [ERROR] No se encontraron archivos en:", PLANTILLAS)
        return

    print("\n▶ Archivos .docx:")
    for f in archivos_docx:
        try:
            procesar_docx(f)
        except Exception as e:
            print(f"  [ERROR] {f.name}: {e}")

    print("\n▶ Archivos .xlsx:")
    for f in archivos_xlsx:
        try:
            procesar_xlsx(f)
        except Exception as e:
            print(f"  [ERROR] {f.name}: {e}")

    print("\n═══════════════════════════════════════════════════")
    print(" ✓ Marcadores insertados. Verifica los archivos")
    print("   en la carpeta plantillas/ con LibreOffice.")
    print(" Busca {{NOMBRE}}, {{CEDULA}}, {{FECHA}}, etc.")
    print("═══════════════════════════════════════════════════")


if __name__ == "__main__":
    main()

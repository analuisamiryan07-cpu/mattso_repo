import os

base_dir = "/home/andres/Descargas/V1.2 con react/V1 13 04 2026   con react/db_scripts"
output_file = os.path.join(base_dir, "00_matsso_full_database.sql")

files_to_concat = [
    "01_matsso_ddl_create.sql",
    "01_creacion_tablas.sql",
    "02_roles_usuarios.sql",
    "03_sp_crud.sql",
    "04_indices_vistas_datos.sql",
    "02_matsso_dml_inserts.sql"
]

bridge_sql_1 = """
-- =============================================================================
-- PUENTE ENTRE SCHEMAS (E-COMMERCE Y CATÁLOGO)
-- =============================================================================
ALTER TABLE public.productos ADD COLUMN id_certificacion INTEGER;
ALTER TABLE public.clientes ADD CONSTRAINT fk_cliente_familia FOREIGN KEY (id_familia) REFERENCES matsso.familia(id_familia) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD CONSTRAINT fk_cliente_sector FOREIGN KEY (id_sector) REFERENCES matsso.sector(id_sector) ON DELETE SET NULL;
"""

bridge_sql_2 = """
-- =============================================================================
-- POBLAR PRODUCTOS DEL E-COMMERCE DESDE EL CATÁLOGO MATSSO
-- =============================================================================
INSERT INTO public.productos (tipo, titulo, descripcion, precio, horas, modalidad, activo, id_certificacion)
SELECT 'CERTIFICACION', c.nombre, c.descripcion, 100.00, 40, 'PRESENCIAL', c.activo, c.id_certificacion
FROM matsso.certificacion c;
"""

with open(output_file, 'w', encoding='utf-8') as outfile:
    outfile.write("-- SCRIPT MAESTRO UNIFICADO MATSSO\n\n")
    
    for i, fname in enumerate(files_to_concat):
        filepath = os.path.join(base_dir, fname)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as infile:
                outfile.write(f"-- >>> INICIO DE {fname} <<<\n")
                outfile.write(infile.read())
                outfile.write(f"\n-- >>> FIN DE {fname} <<<\n\n")
        else:
            print(f"File not found: {filepath}")
            
        # Insert bridge 1 after creacion_tablas
        if fname == "01_creacion_tablas.sql":
            outfile.write(bridge_sql_1)
            outfile.write("\n\n")
            
        # Insert bridge 2 at the very end
        if fname == "02_matsso_dml_inserts.sql":
            outfile.write(bridge_sql_2)
            outfile.write("\n\n")

print(f"Successfully created {output_file}")

#!/usr/bin/env python3
"""
Script de normalización UTF-8 para evitar Mojibake en el servidor VPS.
Revisa recursivamente los archivos de código fuente en BFF y Frontend.
"""
import os
import sys

EXTENSIONS = ('.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css')
DIRS_TO_SCAN = ['/opt/axelor-erp/bff/src', '/opt/axelor-erp/frontend/src']

# Si se ejecuta en local, usar directorios locales
if not os.path.exists('/opt/axelor-erp'):
    DIRS_TO_SCAN = ['./bff/src', './frontend/src']

def fix_mojibake_in_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            raw_bytes = f.read()

        # Intentar decodificar como UTF-8
        try:
            content = raw_bytes.decode('utf-8')
        except UnicodeDecodeError:
            # Si falla, decodificar como latin-1 y re-codificar a UTF-8
            content = raw_bytes.decode('latin-1')

        # Reemplazos comunes de mojibake si existen
        replacements = {
            'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
            'Ã': 'Á', 'Ã': 'É', 'Ã': 'Í', 'Ã': 'Ó', 'Ã': 'Ú',
            'Ã±': 'ñ', 'Ã': 'Ñ', 'Â¿': '¿', 'Â¡': '¡',
            'â¢': '•', 'â': '–', 'â': '—',
        }
        for bad, good in replacements.items():
            content = content.replace(bad, good)

        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error procesando {filepath}: {e}")
        return False

def main():
    print("🧹 Iniciando normalización de codificación UTF-8...")
    total_cleaned = 0
    for target_dir in DIRS_TO_SCAN:
        if not os.path.exists(target_dir):
            continue
        for root, _, files in os.walk(target_dir):
            for file in files:
                if file.endswith(EXTENSIONS):
                    path = os.path.join(root, file)
                    if fix_mojibake_in_file(path):
                        total_cleaned += 1

    print(f"✅ Normalización completada. {total_cleaned} archivos procesados con UTF-8 puro.")

if __name__ == '__main__':
    main()

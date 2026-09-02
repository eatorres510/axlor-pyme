import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

host = "2.25.108.44"
user = "root"
pwd = "&piqHdy3#;O5u,T2"

print(f"[*] Conectando vía SSH a {user}@{host}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=pwd, timeout=15)
    print("[+] Conectado exitosamente al VPS.")
    sftp = ssh.open_sftp()

    def upload_dir(local_dir, remote_dir):
        try:
            sftp.mkdir(remote_dir)
        except:
            pass
        for root, dirs, files in os.walk(local_dir):
            rel_path = os.path.relpath(root, local_dir)
            target_remote_dir = os.path.normpath(os.path.join(remote_dir, rel_path)).replace("\\", "/")
            try:
                sftp.mkdir(target_remote_dir)
            except:
                pass
            for file in files:
                local_file = os.path.join(root, file)
                remote_file = os.path.normpath(os.path.join(target_remote_dir, file)).replace("\\", "/")
                sftp.put(local_file, remote_file)

    base_local = r"c:\Users\eator\.gemini\antigravity\scratch\axelor-pyme-erp"
    upload_dir(os.path.join(base_local, "bff", "src"), "/opt/axelor-erp/bff/src")
    upload_dir(os.path.join(base_local, "frontend", "src"), "/opt/axelor-erp/frontend/src")
    sftp.close()
    print("[+] Archivos sincronizados en VPS.")

    commands = [
        ("Normalización UTF-8", "cd /opt/axelor-erp && python3 clean_server_mojibake.py"),
        ("Compilación Backend BFF (tsc)", "cd /opt/axelor-erp/bff && npm run build"),
        ("Compilación Frontend (vite build)", "cd /opt/axelor-erp/frontend && npm run build"),
        ("Reinicio de Procesos PM2", "pm2 restart all && pm2 list")
    ]

    for title, cmd in commands:
        print(f"\n==========================================")
        print(f">>> Ejecutando: {title}")
        print(f"==========================================")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        if out:
            print(out)
        if err:
            print(f"[STDERR]:\n{err}")

    print("\n[+] ¡Despliegue completado con éxito total en el VPS!")
    ssh.close()

except Exception as e:
    print(f"[-] Error: {e}")
    sys.exit(1)

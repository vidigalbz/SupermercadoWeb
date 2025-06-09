import os
import subprocess
import urllib.request
import tempfile
import socket

def verificar_nodejs():
    try:
        subprocess.run(["node", "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except Exception:
        return False

def verificar_arquivos(pasta_destino="mercadoDidaticoDigital"):
    appdata = os.getenv('APPDATA')
    destino = os.path.join(appdata, pasta_destino)
    return os.path.exists(destino)

def instalar_nodejs():
    url_node = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    try:
        temp_path = os.path.join(tempfile.gettempdir(), "nodejs_installer.msi")
        urllib.request.urlretrieve(url_node, temp_path)
        subprocess.run(["msiexec", "/i", temp_path, "/quiet", "/norestart"], check=True)
        return True, "Node.js instalado com sucesso!"
    except Exception as e:
        return False, f"Erro: {e}"

def clonar_repositorio(branch="exec_download", repo_url="https://github.com/vidigalbz/SupermercadoWeb", pasta_destino="mercadoDidaticoDigital"):
    try:
        appdata = os.getenv('APPDATA')
        destino = os.path.join(appdata, pasta_destino)
        if os.path.exists(destino):
            subprocess.run(["rmdir", "/s", "/q", destino], shell=True)
        subprocess.run(["git", "clone", "--branch", branch, repo_url, destino], check=True)
        return True, f"Arquivos clonados em: {destino}"
    except Exception as e:
        return False, f"Erro: {e}"

def iniciar_servidor():
    caminho_exe = os.path.join(os.getenv("APPDATA"), "mercadoDidaticoDigital", "app.exe")
    if os.path.exists(caminho_exe):
        subprocess.Popen([caminho_exe])
        ip_local = socket.gethostbyname(socket.gethostname())
        return True, f"http://{ip_local}:4000/login"
    return False, "Arquivo .exe não encontrado."

def parar_servidor():
    try:
        subprocess.run(["taskkill", "/f", "/im", "app.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True, "Servidor encerrado com sucesso."
    except Exception as e:
        return False, f"Erro ao parar o servidor: {e}"

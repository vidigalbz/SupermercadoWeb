import customtkinter as ctk
import threading
import tkinter.messagebox as mbox
import webbrowser
import backend

node_instalado = False
arquivos_instalados = False
servidor_rodando = False

def criar_interface():
    global app, node_status, arquivos_status
    global iniciar_button, parar_button, status_label
    global instalar_node_btn, instalar_arquivos_btn

    def atualizar_status():
        global node_instalado, arquivos_instalados
        node_instalado = backend.verificar_nodejs()
        arquivos_instalados = backend.verificar_arquivos()

        node_status.configure(
            text="🟢 Node.js instalado" if node_instalado else "🔴 Node.js não instalado",
            text_color="green" if node_instalado else "red"
        )
        arquivos_status.configure(
            text="🟢 Arquivos presentes" if arquivos_instalados else "🔴 Arquivos ausentes",
            text_color="green" if arquivos_instalados else "red"
        )

        instalar_node_btn.configure(state="disabled" if node_instalado else "normal")
        instalar_arquivos_btn.configure(state="disabled" if arquivos_instalados else "normal")
        remover_arquivos_btn.configure(state="normal" if arquivos_instalados else "disabled")   

        iniciar_button.configure(state="normal" if arquivos_instalados and not servidor_rodando else "disabled")
        parar_button.configure(state="normal" if servidor_rodando else "disabled")

    def atualizar_link_():
        ip_local = backend.ip_local
        link_label.configure(text=f"Link: http://{ip_local}:4000/login")

    def instalar_node():
        def task():
            status_label.configure(text="⏳ Instalando Node.js...")
            sucesso, msg = backend.instalar_nodejs()
            mbox.showinfo("Node.js", msg)
            atualizar_status()
            status_label.configure(text="")
        threading.Thread(target=task).start()

    def instalar_arquivos():
        def task():
            status_label.configure(text="⏳ Clonando arquivos...")
            sucesso, msg = backend.clonar_repositorio()
            mbox.showinfo("Arquivos", msg)
            atualizar_status()
            status_label.configure(text="")
        threading.Thread(target=task).start()

    def remover_arquivos():
        def task():
            status_label.configure(text="⏳ Removendo arquivos...")
            sucesso, msg = backend.remover_arquivos()
            mbox.showinfo("Arquivos", msg)
            atualizar_status()
            status_label.configure(text="")
        threading.Thread(target=task).start()

    def iniciar():
        global servidor_rodando
        sucesso, msg = backend.iniciar_servidor()
        if sucesso:
            servidor_rodando = True
            atualizar_link_()
            webbrowser.open(msg)
        else:
            mbox.showerror("Erro", msg)
        atualizar_status()

    def parar():
        global servidor_rodando
        sucesso, msg = backend.parar_servidor()
        if sucesso:
            servidor_rodando = False
        else:
            mbox.showerror("Erro", msg)
        atualizar_status()

    # Aparência
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")
    app = ctk.CTk()
    app.geometry("400x600")
    app.title("📦 Mercado Didático")
    app.resizable(False, False)
    app.configure(fg_color="#0D47A1")

    # Título
    ctk.CTkLabel(app, text="📦 Mercado Didático", font=ctk.CTkFont(size=26, weight="bold"), text_color="white").pack(pady=25)
    ctk.CTkLabel(app, text="Instalador e Inicializador do Sistema", font=ctk.CTkFont(size=14), text_color="white").pack(pady=5)

    # Status frame
    status_frame = ctk.CTkFrame(app, fg_color="#1565C0", corner_radius=10)
    status_frame.pack(pady=20, padx=20, fill="x")

    ctk.CTkLabel(status_frame, text="Status do Sistema", font=ctk.CTkFont(size=16, weight="bold"), text_color="white").pack(pady=(10, 5))

    node_status = ctk.CTkLabel(status_frame, text="", font=ctk.CTkFont(size=13))
    node_status.pack(pady=4)

    arquivos_status = ctk.CTkLabel(status_frame, text="", font=ctk.CTkFont(size=13))
    arquivos_status.pack(pady=4)

    # Ações
    botoes_frame = ctk.CTkFrame(app, fg_color="transparent")
    botoes_frame.pack(pady=10)

    largura = 280

    instalar_node_btn = ctk.CTkButton(botoes_frame, text="⬇️ Instalar Node.js", command=instalar_node,
                  fg_color="#FFA726", hover_color="#FF9800", text_color="black", width=largura)
    instalar_node_btn.pack(pady=10)

    instalar_arquivos_btn = ctk.CTkButton(botoes_frame, text="📁 Instalar Arquivos", command=instalar_arquivos,
                  fg_color="#FFA726", hover_color="#FF9800", text_color="black", width=largura)
    instalar_arquivos_btn.pack(pady=10)

    remover_arquivos_btn = ctk.CTkButton(botoes_frame, text="📂 Remover Arquivos", command=remover_arquivos,
                  fg_color="#FFA726", hover_color="#D32F2F", text_color="black", width=largura)
    remover_arquivos_btn.pack(pady=10)

    iniciar_button = ctk.CTkButton(botoes_frame, text="🚀 Iniciar Servidor", command=iniciar,
                                   fg_color="#00C853", hover_color="#00B342", text_color="white", width=largura)
    iniciar_button.pack(pady=10)

    parar_button = ctk.CTkButton(botoes_frame, text="⛔ Parar Servidor", command=parar,
                                 fg_color="#D32F2F", hover_color="#B71C1C", text_color="white", width=largura)
    parar_button.pack(pady=10)

    link_label = ctk.CTkLabel(app, text="", font=ctk.CTkFont(size=14, weight="bold"), text_color="white")
    link_label.pack(pady=25)

    # Feedback
    status_label = ctk.CTkLabel(app, text="", wraplength=350, text_color="white", font=ctk.CTkFont(size=13))
    status_label.pack(pady=20)

    app.after(200, atualizar_status)
    return app

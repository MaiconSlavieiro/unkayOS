// apps/terminal/commands.js - v1.0.1 (Sem mudanças)
export const commands = {
    help: {
        description: "Exibe a lista de comandos disponíveis.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands) => {
            let output = '<span class="yellow">Comandos disponíveis:</span><br>';
            for (const commandName in allCommands) {
                if (allCommands.hasOwnProperty(commandName)) {
                    output += `<span class="green">${commandName}</span><br>`;
                    output += `  ${allCommands[commandName].description}<br><br>`;
                }
            }
            appendToTerminal(output);
            return '';
        }
    },
    echo: {
        description: "Exibe o texto digitado.",
        action: (args) => {
            return args.join(' ');
        }
    },
    clear: {
        description: "Limpa a tela do terminal.",
        action: (args, appendToTerminal, terminalOutput) => {
            terminalOutput.innerHTML = '';
            return '';
        }
    },
    date: {
        description: "Exibe a data e hora atuais.",
        action: () => {
            const now = new Date();
            return now.toLocaleString();
        }
    },
    whoami: {
        description: "Exibe o usuário atual.",
        action: () => {
            const authSystem = window.authSystem?.getAPI();
            if (authSystem && authSystem.isAuthenticated()) {
                const user = authSystem.getCurrentUser();
                return `${user.name || user.username || 'usuário'}@reversodoavesso`;
            }
            return 'guest@reversodoavesso';
        }
    },
    neofetch: {
        description: "Exibe informações do sistema (simulado).",
        action: () => {
            const output = `
<span class="blue">    .--.
  |o_o |
  |:_/ |
  //   \\
(|     |)
'-----'</span>
<span class="yellow">reversodoavesso.online</span>
---
<span class="cyan">OS</span>: Web Browser (Simulated)
<span class="cyan">Host</span>: reversodoavesso.online
<span class="cyan">Kernel</span>: JS/HTML/CSS
<span class="cyan">Uptime</span>: Just now!
<span class="cyan">Shell</span>: Custom Terminal
<span class="cyan">Terminal</span>: reversodoavesso.online
<span class="cyan">CPU</span>: Your Device's CPU
<span class="cyan">GPU</span>: Your Device's GPU
<span class="cyan">Memory</span>: Your Device's RAM
            `;
            return output;
        }
    },
    about: {
        description: "Exibe informações sobre este terminal.",
        action: () => {
            return '<span class="purple">Este é um terminal web simples criado com HTML, CSS e JavaScript. Ele simula comandos básicos para uma experiência interativa no navegador.</span>';
        }
    },
    ps: {
        description: "Lista os processos (aplicativos) em execução.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (!appManager) {
                return '<span class="red">Erro: Gerenciador de aplicativos não disponível.</span>';
            }

            let output = '<span class="yellow">Processos em execução:</span><br>';

            // appManager.runningApps é um Map, não um Array. Precisa iterar sobre os valores.
            if (appManager.runningApps && appManager.runningApps.size > 0) {
                // Separa apps por tipo
                const systemApps = [];
                const userApps = [];
                const headlessApps = [];

                for (const [instanceId, appInfo] of appManager.runningApps.entries()) {
                    const app = appInfo.appCoreInstance;
                    if (app.mode === 'desktop_ui' || app.mode === 'custom_ui') {
                        systemApps.push({ instanceId, app });
                    } else if (app.mode === 'system_window') {
                        userApps.push({ instanceId, app });
                    } else if (app.mode === 'headless') {
                        headlessApps.push({ instanceId, app });
                    }
                }

                // Apps de Sistema (não podem ser fechados)
                if (systemApps.length > 0) {
                    output += '<span class="purple">--- Aplicativos de Sistema (não podem ser fechados) ---</span><br>';
                    for (const { instanceId, app } of systemApps) {
                        output += `  PID: ${instanceId} | Nome: ${app.app_name || 'N/A'} | Modo: ${app.mode} | <span class="orange">Sistema</span><br>`;
                    }
                    output += '<br>';
                }

                // Apps de Usuário (podem ser fechados)
                if (userApps.length > 0) {
                    output += '<span class="cyan">--- Aplicativos de Usuário (podem ser fechados) ---</span><br>';
                    for (const { instanceId, app } of userApps) {
                        output += `  PID: ${instanceId} | Nome: ${app.app_name || 'N/A'} | Modo: ${app.mode} | <span class="green">Terminável</span><br>`;
                    }
                    output += '<br>';
                }

                // Apps Headless
                if (headlessApps.length > 0) {
                    output += '<span class="cyan">--- Aplicativos Headless ---</span><br>';
                    for (const { instanceId, app } of headlessApps) {
                        output += `  PID: ${instanceId} | Nome: ${app.app_name || 'N/A'} | Modo: ${app.mode} | <span class="green">Terminável</span><br>`;
                    }
                    output += '<br>';
                }

                // Resumo
                output += `<span class="yellow">Resumo:</span> ${systemApps.length} sistema, ${userApps.length} usuário, ${headlessApps.length} headless<br>`;
            } else {
                output += '  Nenhum aplicativo em execução.<br>';
            }

            return output;
        }
    },
    start: {
        description: "Inicia um aplicativo. Uso: start <app_id> [param1 param2 ...]",
        action: async (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (!appManager) {
                return '<span class="red">Erro: Gerenciador de aplicativos não disponível.</span>';
            }
            if (args.length === 0) {
                return '<span class="red">Uso: start &lt;app_id&gt; [param1 param2 ...]</span>';
            }
            const appId = args[0];
            const appParams = args.slice(1); // Captura o restante dos argumentos como parâmetros para o app

            appendToTerminal(`<span class="yellow">Iniciando aplicativo '${appId}' com parâmetros: [${appParams.join(', ')}]...</span>`);
            try {
                // Passa a função appendToTerminal do terminal atual e os parâmetros
                const instanceId = await appManager.runApp(appId, appendToTerminal, appParams);
                if (instanceId) {
                    return `<span class="green">Aplicativo '${appId}' iniciado com sucesso. Instance ID: ${instanceId}</span>`;
                } else {
                    // Se instanceId é null, significa que o app pode já estar rodando (para custom_ui/headless)
                    // ou houve um erro que já foi logado pelo runApp.
                    return `<span class="red">Não foi possível iniciar o aplicativo '${appId}'. Verifique o console para mais detalhes.</span>`;
                }
            } catch (error) {
                return `<span class="red">Erro ao iniciar aplicativo '${appId}': ${error.message || error}</span>`;
            }
        }
    },
    stop: {
        description: "Para uma instância de aplicativo. Uso: stop <instance_id>",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (!appManager) {
                return '<span class="red">Erro: Gerenciador de aplicativos não disponível.</span>';
            }
            if (args.length === 0) {
                return '<span class="red">Uso: stop &lt;instance_id&gt;</span>';
            }
            const instanceId = args[0];
            
            // Verifica se o app existe
            const appInfo = appManager.runningApps.get(instanceId);
            if (!appInfo) {
                return `<span class="red">Erro: Instância '${instanceId}' não encontrada.</span>`;
            }
            
            const app = appInfo.appCoreInstance;
            
            // Verifica se é um app de sistema (não pode ser fechado)
            if (app.mode === 'desktop_ui' || app.mode === 'custom_ui') {
                return `<span class="orange">Erro: Não é possível parar '${app.app_name}' (${app.mode}). Apps de sistema não podem ser fechados.</span>`;
            }
            
            appendToTerminal(`<span class="yellow">Parando instância '${instanceId}' (${app.app_name})...</span>`);
            try {
                appManager.removeApp(instanceId);
                return `<span class="green">Instância '${instanceId}' (${app.app_name}) parada com sucesso.</span>`;
            } catch (error) {
                return `<span class="red">Erro ao parar instância '${instanceId}': ${error.message || error}</span>`;
            }
        }
    },
    "ps-system": {
        description: "Lista apenas os aplicativos de sistema em execução.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (!appManager) {
                return '<span class="red">Erro: Gerenciador de aplicativos não disponível.</span>';
            }

            let output = '<span class="purple">Aplicativos de Sistema em execução:</span><br>';

            const systemApps = [];
            for (const [instanceId, appInfo] of appManager.runningApps.entries()) {
                const app = appInfo.appCoreInstance;
                if (app.mode === 'desktop_ui' || app.mode === 'custom_ui') {
                    systemApps.push({ instanceId, app });
                }
            }

            if (systemApps.length > 0) {
                for (const { instanceId, app } of systemApps) {
                    output += `  PID: ${instanceId} | Nome: ${app.app_name || 'N/A'} | Modo: ${app.mode} | <span class="orange">Sistema</span><br>`;
                }
                output += `<br><span class="yellow">Total: ${systemApps.length} aplicativo(s) de sistema</span><br>`;
            } else {
                output += '  Nenhum aplicativo de sistema em execução.<br>';
            }

            return output;
        }
    },
    killall: {
        description: "Encerra todos os aplicativos de usuário e headless em execução (apps de sistema são preservados).",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            if (!appManager) {
                return '<span class="red">Erro: Gerenciador de aplicativos não disponível.</span>';
            }
            
            // Conta quantos apps serão fechados
            let userAppsCount = 0;
            let headlessAppsCount = 0;
            let systemAppsCount = 0;
            
            for (const [instanceId, appInfo] of appManager.runningApps.entries()) {
                const app = appInfo.appCoreInstance;
                if (app.mode === 'desktop_ui' || app.mode === 'custom_ui') {
                    systemAppsCount++;
                } else if (app.mode === 'system_window') {
                    userAppsCount++;
                } else if (app.mode === 'headless') {
                    headlessAppsCount++;
                }
            }
            
            if (userAppsCount === 0 && headlessAppsCount === 0) {
                return '<span class="yellow">Nenhum aplicativo de usuário ou headless em execução para encerrar.</span>';
            }
            
            appendToTerminal(`<span class="yellow">Encerrando ${userAppsCount} aplicativo(s) de usuário e ${headlessAppsCount} aplicativo(s) headless...</span>`);
            if (systemAppsCount > 0) {
                appendToTerminal(`<span class="purple">Preservando ${systemAppsCount} aplicativo(s) de sistema.</span>`);
            }
            
            appManager.killAll();
            return `<span class="green">Comando killall executado. ${userAppsCount + headlessAppsCount} aplicativo(s) encerrado(s).</span>`;
        }
    },
    login: {
        description: "Inicia o processo de login SSO.",
        action: async (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            const authSystem = window.authSystem?.getAPI();
            if (!authSystem) {
                return '<span class="red">Erro: Sistema de autenticação não disponível.</span>';
            }
            
            if (authSystem.isAuthenticated()) {
                return '<span class="yellow">Você já está autenticado.</span>';
            }
            
            appendToTerminal('<span class="yellow">Iniciando processo de login SSO...</span>');
            try {
                await authSystem.login();
                return '<span class="green">Redirecionando para autenticação SSO...</span>';
            } catch (error) {
                return `<span class="red">Erro ao iniciar login: ${error.message}</span>`;
            }
        }
    },
    logout: {
        description: "Realiza logout do sistema.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            const authSystem = window.authSystem?.getAPI();
            if (!authSystem) {
                return '<span class="red">Erro: Sistema de autenticação não disponível.</span>';
            }
            
            if (!authSystem.isAuthenticated()) {
                return '<span class="yellow">Você não está autenticado.</span>';
            }
            
            appendToTerminal('<span class="yellow">Realizando logout...</span>');
            try {
                authSystem.logout();
                return '<span class="green">Logout realizado com sucesso.</span>';
            } catch (error) {
                return `<span class="red">Erro ao fazer logout: ${error.message}</span>`;
            }
        }
    },
    auth: {
        description: "Exibe informações sobre o status de autenticação.",
        action: (args, appendToTerminal, terminalOutput, displayInitialMessages, allCommands, appManager) => {
            const authSystem = window.authSystem?.getAPI();
            if (!authSystem) {
                return '<span class="red">Erro: Sistema de autenticação não disponível.</span>';
            }
            
            let output = '<span class="yellow">Status de Autenticação:</span><br>';
            
            if (authSystem.isAuthenticated()) {
                const user = authSystem.getCurrentUser();
                output += `<span class="green">✓ Autenticado</span><br>`;
                output += `<span class="cyan">Usuário:</span> ${user.name || user.username || 'N/A'}<br>`;
                output += `<span class="cyan">Email:</span> ${user.email || 'N/A'}<br>`;
                output += `<span class="cyan">ID:</span> ${user.sub || user.id || 'N/A'}<br>`;
                
                if (user.permissions && user.permissions.length > 0) {
                    output += `<span class="cyan">Permissões:</span> ${user.permissions.join(', ')}<br>`;
                }
                
                if (user.roles && user.roles.length > 0) {
                    output += `<span class="cyan">Roles:</span> ${user.roles.join(', ')}<br>`;
                }
            } else {
                output += `<span class="red">✗ Não autenticado</span><br>`;
                output += 'Use o comando <span class="green">login</span> para autenticar.<br>';
            }
            
            return output;
        }
    }
};

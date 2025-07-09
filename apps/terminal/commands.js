// apps/terminal/commands.js
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
            return 'user@reversodoavesso';
        }
    },
    neofetch: {
        description: "Exibe informações do sistema (simulado).",
        action: () => {
            const output = `
<span class="blue">   .--.
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

            if (appManager.runningApps && appManager.runningApps.length > 0) {
                output += '<span class="cyan">--- Aplicativos com UI ---</span><br>';
                appManager.runningApps.forEach(app => {
                    output += `  PID: ${app.instanceId} | Nome: ${app.appName || 'N/A'}<br>`;
                });
            } else {
                output += '  Nenhum aplicativo com UI em execução.<br>';
            }

            output += '<br>';

            if (appManager.runningHeadlessApps && appManager.runningHeadlessApps.length > 0) {
                output += '<span class="cyan">--- Aplicativos Headless ---</span><br>';
                appManager.runningHeadlessApps.forEach(appCore => {
                    output += `  PID: ${appCore.instanceId} | Nome: ${appCore.app_name || 'N/A'}<br>`;
                });
            } else {
                output += '  Nenhum aplicativo headless em execução.<br>';
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
                const instance = await appManager.runApp(appId, appendToTerminal, appParams);
                if (instance) {
                    return `<span class="green">Aplicativo '${appId}' iniciado com sucesso. Instance ID: ${instance.instanceId}</span>`;
                } else {
                    return `<span class="green">Aplicativo headless '${appId}' iniciado com sucesso.</span>`;
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
            appendToTerminal(`<span class="yellow">Parando instância '${instanceId}'...</span>`);
            try {
                appManager.removeApp(instanceId);
                return `<span class="green">Instância '${instanceId}' parada com sucesso.</span>`;
            } catch (error) {
                return `<span class="red">Erro ao parar instância '${instanceId}': ${error.message || error}</span>`;
            }
        }
    }
};

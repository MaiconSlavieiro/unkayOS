# unkayOS - Sistema Operacional Web Modular

**unkayOS** é um sistema operacional web completo construído com tecnologias modernas, oferecendo uma experiência de desktop nativa no navegador com gerenciamento avançado de janelas, aplicativos modulares e arquitetura orientada a eventos.

## 🌟 Características Principais

### 🖼️ **Sistema de Janelas Avançado**
- **WindowLayerManager**: Gerenciamento dinâmico de z-index com hierarquia inteligente
- **Redimensionamento Completo**: Suporte a redimensionamento por bordas laterais e cantos
- **Drag & Drop**: Arrastar janelas com prevenção inteligente para janelas maximizadas
- **Múltiplas Instâncias**: Executar múltiplas instâncias do mesmo aplicativo simultaneamente

### 🎯 **Arquitetura Orientada a Eventos**
- **EventBus Global**: Comunicação desacoplada entre módulos
- **Ciclo de Vida Controlado**: Inicialização e cleanup automático de aplicativos
- **Sistema CLI**: Comandos de terminal integrados para controle do sistema

### 🧩 **Aplicativos Modulares**
- **BaseApp**: Classe base com isolamento de DOM e utilitários integrados
- **Carregamento Dinâmico**: CSS e JavaScript carregados sob demanda
- **Isolamento de Instância**: Cada instância possui escopo próprio

## 📁 Estrutura do Projeto

```
unkayOS/
├── index.html              # Ponto de entrada principal
├── main.js                 # Inicialização do sistema
├── apps/                   # Aplicativos do sistema
│   ├── apps.json          # Configuração de aplicativos
│   ├── terminal/          # Terminal integrado
│   ├── browser/           # Navegador web (theorb)
│   ├── clock/             # Relógio e calendário
│   ├── system-info/       # Informações do sistema
│   ├── process-manager/   # Gerenciador de processos
│   ├── taskbar/           # Barra de tarefas
│   └── about/             # Sobre o sistema
├── core/                   # Núcleo do sistema
│   ├── AppManager.js       # Gerenciamento de aplicativos
│   ├── AppWindowSystem.js  # Sistema de janelas
│   ├── WindowLayerManager.js # Gerenciamento de z-index
│   ├── BaseApp.js          # Classe base para aplicativos
│   ├── DragManager.js      # Sistema de arrastar
│   ├── eventBus.js         # Sistema de eventos
│   ├── AuthSystem.js       # Sistema de autenticação
│   └── utils/              # Utilitários do sistema
├── assets/                 # Recursos estáticos
│   ├── icons/             # Ícones do sistema e aplicativos
│   ├── images/            # Imagens e wallpapers
│   └── style/             # Estilos globais
└── design-system/         # Sistema de design
    └── styles/            # Tokens e componentes visuais
```

## 🚀 Como Usar

### Instalação Local
```bash
# Clone o repositório
git clone https://github.com/MaiconSlavieiro/unkayOS.git

# Navegue para o diretório
cd unkayOS

# Inicie um servidor local (Python)
python -m http.server 8000

# Ou use Node.js
npx serve .

# Acesse no navegador
http://localhost:8000
```

### Sistema em Produção
O unkayOS está disponível online em: [reversodoavesso.online](https://reversodoavesso.online)

## 💻 Desenvolvimento de Aplicativos

### 1. Estrutura Básica de um App

Cada aplicativo deve seguir esta estrutura:
```
meu-app/
├── config.json    # Configuração do aplicativo
├── index.html     # Interface do usuário
├── main.js        # Lógica principal
├── style.css      # Estilos específicos
└── icon.svg       # Ícone do aplicativo
```

### 2. Configuração (config.json)
```json
{
  "name": "Meu Aplicativo",
  "description": "Descrição do aplicativo",
  "version": "1.0.0",
  "type": "user_app",
  "dirApp": "index.html",
  "jsFile": "main.js",
  "styleFile": "style.css",
  "icon_url": "icon.svg",
  "parameters": {
    "url": {
      "type": "string",
      "description": "URL para abrir"
    }
  }
}
```

### 3. Classe Principal (main.js)
```javascript
import { BaseApp } from '/core/BaseApp.js';

export class MeuApp extends BaseApp {
    static parameters = {
        url: { type: 'string', description: 'URL para abrir' }
    };

    onRun() {
        // Inicialização do app
        const button = this.$('#meu-botao');
        button.addEventListener('click', this.handleClick.bind(this));
    }

    onCleanup() {
        // Limpeza de recursos
        // Remove listeners, intervals, etc.
    }

    handleClick() {
        // Lógica do app usando this.$(selector) para DOM local
    }

    // Suporte a CLI
    static async runCli(args, writeLine) {
        if (args.help) {
            writeLine('Ajuda do aplicativo...');
            return;
        }
        // Lógica CLI
    }
}
```

### 4. Padrões de Desenvolvimento

#### **Isolamento de DOM**
```javascript
// ❌ NUNCA faça isso
document.getElementById('myButton')
document.querySelector('.my-class')

// ✅ Use sempre
this.$('#myButton')          // Busca dentro da instância
this.$$('.my-class')         // Busca todos dentro da instância
```

#### **Comunicação via Eventos**
```javascript
import eventBus from '/core/eventBus.js';

// Iniciar outro aplicativo
eventBus.emit('app:start', { 
    appId: 'browser', 
    params: { url: 'https://google.com' } 
});

// Escutar eventos do sistema
eventBus.on('app:started', ({ appId, instanceId }) => {
    console.log(`App ${appId} iniciado: ${instanceId}`);
});
```

#### **Parâmetros CLI**
```javascript
// Terminal suporta parâmetros modernos
browser --url https://google.com --incognito
clock --format 24h
system-info --detailed
```

## 🏗️ Arquitetura do Sistema

### WindowLayerManager
Gerencia z-index de forma hierárquica:
```
NOTIFICATION:     30000  # Notificações do sistema
MODAL:           20000  # Modais e diálogos
MENU:            15000  # Menus contextuais
TASKBAR:         10000  # Barra de tarefas
DRAGGING:         9000  # Elementos sendo arrastados
WINDOWS_MAX:      8999  # Janelas maximizadas
WINDOWS_BASE:      100  # Janelas normais (incrementa dinamicamente)
DESKTOP_APPS:        5  # Widgets de desktop
DESKTOP_BACKGROUND:  0  # Papel de parede
```

### Sistema de Eventos
- **app:start** - Iniciar aplicativo
- **app:stop** - Parar aplicativo
- **app:started** - Aplicativo iniciado com sucesso
- **app:stopped** - Aplicativo parado
- **app:killall** - Encerrar todos os aplicativos

### Gerenciamento de Instâncias
Cada aplicativo pode ter múltiplas instâncias simultâneas, cada uma com:
- **instanceId** único
- **DOM isolado** (this.appContentRoot)
- **Ciclo de vida** independente
- **Z-index** gerenciado automaticamente

## 🎨 Sistema de Design

### Tokens CSS
```css
/* Cores principais */
--primary-color: #007acc;
--secondary-color: #333;
--background: #1e1e1e;
--surface: #252526;

/* Tipografia */
--font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
--font-size-sm: 12px;
--font-size-md: 14px;
--font-size-lg: 16px;

/* Espaçamento */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
```

### Componentes Base
- **Janelas**: Sistema de janelas com barra de título e controles
- **Botões**: Estilização consistente para toda a interface
- **Formulários**: Inputs e controles padronizados
- **Bordas de Redimensionamento**: Invisíveis mas funcionais

## 🔧 APIs e Utilitários

### Utilitários de DOM
```javascript
this.$(selector)        // Busca um elemento na instância
this.$$(selector)       // Busca todos os elementos na instância
```

### EventBus
```javascript
eventBus.emit(event, data)     // Emitir evento
eventBus.on(event, callback)   // Escutar evento
eventBus.off(event, callback)  // Remover listener
```

### WindowLayerManager
```javascript
windowLayerManager.bringToFront(instanceId, element)
windowLayerManager.setSystemLayer(element, 'TASKBAR')
windowLayerManager.setDraggingLayer(element)
```

## 📱 Aplicativos Inclusos

| Aplicativo | Descrição | Recursos |
|------------|-----------|----------|
| **Terminal** | Terminal integrado | Comandos CLI, histórico, autocomplete |
| **Browser (theorb)** | Navegador web | Abas, favoritos, histórico |
| **Clock** | Relógio e calendário | Múltiplos formatos, fusos horários |
| **System Info** | Informações do sistema | CPU, memória, navegador |
| **Process Manager** | Gerenciador de processos | Lista de apps, controle de instâncias |
| **Taskbar** | Barra de tarefas | Launcher, apps ativos, sistema |
| **About** | Sobre o sistema | Informações da versão |

## 🚀 Comandos do Terminal

```bash
# Gerenciamento de aplicativos
browser --url https://google.com    # Abrir navegador
clock --format 24h                  # Abrir relógio
ps                                  # Listar processos
killall                            # Encerrar todos os apps

# Informações do sistema
system-info --detailed             # Informações detalhadas
about                              # Sobre o sistema

# Ajuda
<app-name> --help                  # Ajuda do aplicativo
params <app-id>                    # Schema de parâmetros
```

## 🔒 Características de Segurança

- **Isolamento de DOM**: Cada instância opera em escopo isolado
- **Sanitização**: Entrada de dados limpa e validada
- **CSP Ready**: Compatível com Content Security Policy
- **Event Validation**: Validação de eventos e parâmetros

## 🎯 Roadmap

### Versão Atual (v2.1)
- ✅ Sistema de janelas completo
- ✅ WindowLayerManager dinâmico
- ✅ Redimensionamento por bordas
- ✅ Múltiplas instâncias
- ✅ Sistema CLI integrado

### Próximas Versões
- 🔄 Sistema de notificações
- 🔄 Gerenciamento de arquivos
- 🔄 Sistema de plugins
- 🔄 Temas personalizáveis
- 🔄 PWA (Progressive Web App)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Maicon Slaviero**
- GitHub: [@MaiconSlavieiro](https://github.com/MaiconSlavieiro)
- Website: [reversodoavesso.online](https://reversodoavesso.online)

---

**unkayOS** - Transformando o navegador em um sistema operacional completo. 🚀 
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

### 🏗️ **Arquitetura Robusta**
- **SystemManager**: Gerenciamento centralizado de estado e singletons
- **Design System**: Tokens padronizados para consistência visual
- **Inicialização em Fases**: Sistema de boot ordenado com dependências controladas
- **Cleanup Automático**: Prevenção de vazamentos de memória

## 📁 Estrutura do Projeto

```
unkayOS/
├── index.html              # Ponto de entrada principal
├── main.js                 # Inicialização do sistema (v2.0 - SystemManager)
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
│   ├── SystemManager.js    # 🆕 Gerenciamento centralizado de estado
│   ├── AppManager.js       # Gerenciamento de aplicativos
│   ├── AppWindowSystem.js  # Sistema de janelas
│   ├── WindowLayerManager.js # Gerenciamento de z-index
│   ├── BaseApp.js          # Classe base para aplicativos (atualizada)
│   ├── DragManager.js      # Sistema de arrastar
│   ├── eventBus.js         # Sistema de eventos
│   ├── AuthSystem.js       # Sistema de autenticação
│   ├── KeyboardManager.js  # Gerenciamento de teclado
│   ├── FileSystem.js       # Sistema de arquivos virtual
│   ├── LoadingManager.js   # Gerenciamento de loading
│   └── utils/              # Utilitários do sistema
├── design-system/          # 🆕 Sistema de design padronizado
│   └── styles/
│       ├── tokens.css      # Tokens de design centralizados
│       ├── base.css        # Estilos base
│       ├── typography.css  # Sistema tipográfico
│       └── main.css        # Estilos principais
├── docs/                   # 🆕 Documentação técnica
│   ├── STATE_MANAGEMENT_GUIDE.md  # Guia do SystemManager
│   ├── TOKEN_GUIDE.md             # Guia do Design System
│   └── filesystem-guide.md        # Guia do sistema de arquivos
├── assets/                 # Recursos estáticos
│   ├── icons/             # Ícones do sistema e aplicativos
│   ├── images/            # Imagens e wallpapers
│   └── style/             # Estilos globais
└── auth/                   # Sistema de autenticação
    └── callback.html       # Callback OAuth
```
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

## 🏗️ Arquitetura do Sistema

### SystemManager (v2.0)
O núcleo do unkayOS utiliza um gerenciador de estado centralizado que controla todo o ciclo de vida dos sistemas:

```javascript
// Inicialização automatizada em 4 fases
await systemManager.initialize(desktop);

// Acesso padronizado aos sistemas
const appManager = systemManager.getSystem('appManager');
const fileSystem = systemManager.getSystem('fileSystem');
const keyboardManager = systemManager.getSystem('keyboardManager');

// Monitoramento e estatísticas
const stats = systemManager.getSystemStats();
```

### Design System
Sistema de tokens centralizados para consistência visual:

```css
/* Tokens padronizados em design-system/styles/tokens.css */
:root {
  --color-text-primary: #ffffff;
  --color-background-primary: #1a1a1a;
  --color-surface-secondary: #2a2a2a;
  --spacing-medium: 16px;
  --border-radius-medium: 8px;
}
```

## 💻 Desenvolvimento de Aplicativos

### 1. Estrutura Básica de um App

Cada aplicativo deve seguir esta estrutura:
```
meu-app/
├── config.json    # Configuração do aplicativo
├── index.html     # Interface do usuário
├── main.js        # Lógica principal
├── style.css      # Estilos (usar tokens do design system)
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
        
        // Registro de atalhos de teclado
        this.registerKeyboardShortcut('Ctrl+S', () => {
            this.salvarArquivo();
        });
    }

    onCleanup() {
        // Limpeza automática de recursos via SystemManager
        // KeyboardManager limpa automaticamente os atalhos
        // Remove listeners específicos do app se necessário
    }

    handleClick() {
        // Lógica do app usando this.$(selector) para DOM local
        // Acesso aos sistemas via SystemManager
        const fileSystem = this.systems.fileSystem;
        const appManager = this.systems.appManager;
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

### 4. Estilos (style.css)
```css
/* Use tokens do design system */
.meu-app {
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    padding: var(--spacing-medium);
    border-radius: var(--border-radius-medium);
}

.meu-botao {
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-primary);
    color: var(--color-text-primary);
    padding: var(--spacing-small) var(--spacing-medium);
}

.meu-botao:hover {
    background: var(--color-surface-hover);
}
```

### 4. Padrões de Desenvolvimento

#### **Isolamento de DOM**
```javascript
// ❌ NUNCA faça isso
document.getElementById('myButton')
document.querySelector('.my-class')

## 📚 Documentação Técnica

### Guias Disponíveis
- **[Guia do Gerenciamento de Estado](docs/STATE_MANAGEMENT_GUIDE.md)**: SystemManager e arquitetura centralizada
- **[Guia do Design System](docs/TOKEN_GUIDE.md)**: Tokens padronizados e sistema de design
- **[Guia do Sistema de Arquivos](docs/filesystem-guide.md)**: FileSystem virtual e operações

### APIs do Sistema

#### **Acesso aos Sistemas (v2.0)**
```javascript
// Novo: via SystemManager (recomendado)
const appManager = systemManager.getSystem('appManager');
const fileSystem = systemManager.getSystem('fileSystem');
const keyboardManager = systemManager.getSystem('keyboardManager');

// Compatibilidade: via window (legacy)
const appManager = window.appManager;
const fileSystem = window.unkayFileSystem.fileSystem;
```

#### **BaseApp Atualizado**
```javascript
export class MeuApp extends BaseApp {
    onRun() {
        // Sistemas disponíveis automaticamente
        console.log(this.systems.appManager);
        console.log(this.systems.fileSystem);
        
        // Atalhos de teclado integrados
        this.registerKeyboardShortcut('Ctrl+S', () => {
            console.log('Salvando...');
        });
    }
    
    async isActive() {
        // Verifica se app tem foco (integrado com KeyboardManager)
        return await super.isActive();
    }
}
```

#### **Seletores DOM Seguros**
```javascript
// ❌ Evite (acesso global)
document.querySelector('#myButton')
document.getElementById('myElement')

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

// Eventos do SystemManager
eventBus.on('system:ready', () => {
    console.log('Todos os sistemas inicializados');
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
### Eventos do Sistema
- **system:ready** - Todos os sistemas inicializados
- **system:shutdown** - Sistema sendo desligado
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
- **Cleanup automático** via SystemManager

## 🎨 Sistema de Design

### Tokens Padronizados (v2.0)
```css
/* design-system/styles/tokens.css */

/* Cores */
--color-text-primary: #ffffff;
--color-text-secondary: #b3b3b3;
--color-text-disabled: #666666;
--color-background-primary: #1a1a1a;
--color-surface-primary: #2a2a2a;
--color-surface-secondary: #3a3a3a;
--color-surface-hover: #4a4a4a;
--color-border-primary: #444444;
--color-accent-primary: #007acc;

/* Tipografia */
--font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
--font-size-small: 12px;
--font-size-medium: 14px;
--font-size-large: 16px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;

/* Espaçamento */
--spacing-small: 8px;
--spacing-medium: 16px;
--spacing-large: 24px;
--spacing-xlarge: 32px;

/* Layout */
--border-radius-small: 4px;
--border-radius-medium: 8px;
--border-radius-large: 12px;
```

### Componentes Base
- **Janelas**: Sistema de janelas com barra de título e controles
- **Botões**: Estilização consistente usando tokens padronizados
- **Formulários**: Inputs e controles com design system
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
## 🔄 Roadmap

### ✅ Versão 2.0 (Atual) - Refatoração Arquitetural
- ✅ **SystemManager**: Gerenciamento centralizado de estado e singletons
- ✅ **Design System**: Tokens padronizados e consistência visual
- ✅ **Cleanup Automático**: Prevenção de vazamentos de memória
- ✅ **Inicialização Ordenada**: Sistema de boot em 4 fases
- ✅ **Documentação**: Guias técnicos completos

### 🔄 Próximas Versões
- 🔄 Sistema de notificações
- 🔄 Gerenciamento de arquivos avançado
- 🔄 Sistema de plugins
- 🔄 Temas personalizáveis dinâmicos
- 🔄 PWA (Progressive Web App)
- 🔄 Hot-reload para desenvolvimento
- 🔄 Health checks avançados
- 🔄 Sistema de métricas

## 🤝 Contribuição

### Para Desenvolvedores
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Siga os padrões arquiteturais estabelecidos:
   - Use tokens do design system
   - Integre com o SystemManager
   - Implemente cleanup adequado
   - Documente mudanças
4. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
5. Push para a branch (`git push origin feature/nova-feature`)
6. Crie um Pull Request

### Padrões de Código
- **CSS**: Use tokens do design system (`var(--color-text-primary)`)
- **JavaScript**: Extenda `BaseApp` para novos aplicativos
- **Sistemas**: Registre no `SystemManager` se for um singleton
- **Documentação**: Atualize guias relevantes em `/docs`

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Maicon Slaviero**
- GitHub: [@MaiconSlavieiro](https://github.com/MaiconSlavieiro)
- Website: [reversodoavesso.online](https://reversodoavesso.online)

---

**unkayOS v2.0** - Transformando o navegador em um sistema operacional completo e bem arquitetado. 🚀 
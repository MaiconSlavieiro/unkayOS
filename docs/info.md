# **Documentação do Sistema unkayOS \- v1.0.1**

Esta documentação detalha a arquitetura e os componentes principais do sistema operacional web unkayOS, na versão v1.0.1.

## **1\. Visão Geral do Sistema**

O unkayOS é um sistema operacional baseado em navegador, construído com HTML, CSS (LESS) e JavaScript. Ele simula um ambiente de desktop com gerenciamento de aplicativos, barra de tarefas e um menu iniciar. A arquitetura é modular, permitindo a fácil adição de novos aplicativos e funcionalidades.

## **2\. Componentes Principais**

### **2.1. index.html (Raiz do Sistema)**

* **Versão:** v1.0.1  
* **Caminho:** /index.html  
* **Função:** É o ponto de entrada principal do sistema. Ele define a estrutura HTML básica e carrega os arquivos CSS (LESS) e JavaScript (main.js). Contém o div principal com id="desktop", que serve como o contêiner raiz para toda a interface do usuário.  
* **Observações:** Carrega o main.less para estilos e less.min.js para compilação LESS em tempo real. O main.js é carregado como um módulo.

### **2.2. main.js (JS Inicial do Sistema)**

* **Versão:** v1.0.1  
* **Caminho:** /main.js  
* **Função:** Este é o coração do sistema. Ele é responsável por:  
  * Configurar o ambiente do desktop, incluindo a imagem de fundo.  
  * Criar e anexar dinamicamente a **barra de tarefas** (tool\_bar) e o **menu de aplicativos** (menuApps).  
  * Carregar o arquivo apps.json para obter a lista de aplicativos disponíveis.  
  * Inicializar o AppManager e a classe menuApps.  
  * Gerenciar a visibilidade do menu de aplicativos (abrir/fechar).  
  * Iniciar automaticamente os aplicativos definidos com autorun: true no apps.json.  
* **Classes Internas:**  
  * menuApps: Gerencia a criação e interação do menu iniciar, listando os aplicativos e controlando sua visibilidade.

### **2.3. /core/AppCore.js**

* **Versão:** v1.0.1  
* **Caminho:** /core/AppCore.js  
* **Função:** Atua como o núcleo de cada aplicativo. Ele abstrai detalhes de inicialização e gerenciamento de recursos.  
  * Gera um instanceId único para cada execução de um aplicativo.  
  * Carrega o arquivo JavaScript (jsFile) do aplicativo e instancia sua classe principal (que deve estender BaseApp).  
  * Fornece APIs padrão (setTimeout, setInterval, clearTimeout, clearInterval, appManager) para a instância do aplicativo, garantindo que os timers sejam gerenciados e limpos corretamente quando o aplicativo é encerrado.  
  * Determina o modo de execução do aplicativo (system\_window, custom\_ui, headless) e delega a criação da UI (se houver) para AppWindowSystem ou AppCustomUI.  
  * Gerencia o ciclo de vida do aplicativo, chamando onRun() na inicialização e onCleanup() ao ser parado.

### **2.4. /core/AppManager.js**

* **Versão:** v1.0.1  
* **Caminho:** /core/AppManager.js  
* **Função:** Gerencia todas as instâncias de aplicativos em execução no sistema.  
  * Mantém listas de runningApps (aplicativos com UI) e runningHeadlessApps (aplicativos sem UI).  
  * runApp(appId, terminalOutputCallback, appParams): Método principal para iniciar um aplicativo, criando uma nova instância do AppCore e delegando a execução.  
  * createIcon(appInstance): Cria e anexa o ícone de um aplicativo à barra de tarefas (apenas para system\_window apps).  
  * setFirstPlaneApp(appInstance): Traz uma janela de aplicativo para o primeiro plano, ajustando seu z-index e marcando seu ícone na taskbar como ativo.  
  * removeApp(instanceId): Encerra e remove uma instância de aplicativo do sistema, chamando seu onCleanup().  
  * killAll(): Encerra todos os aplicativos em execução (exceto custom\_ui apps de sistema).

### **2.5. /core/AppWindowSystem.js**

* **Versão:** v1.0.1  
* **Caminho:** /core/AppWindowSystem.js  
* **Função:** Responsável por criar e gerenciar a interface de usuário para aplicativos do tipo system\_window.  
  * Cria o elemento div que representa a janela do aplicativo, incluindo barra de título, botões de controle (minimizar, maximizar, fechar) e área de conteúdo.  
  * Implementa a funcionalidade de **arrastar** a janela pela barra de título (enableMove).  
  * Implementa a funcionalidade de **redimensionar** a janela pelas bordas (enableResizeRight, enableResizeLeft, enableResizeTop, enableResizeBottom).  
  * Carrega o HTML específico do aplicativo (dirApp) na área de conteúdo da janela.  
  * Chama o método onRun() da instância do aplicativo *após* a janela ser totalmente renderizada e anexada ao DOM.

### **2.6. /core/AppCustomUI.js**

* **Versão:** v1.0.1  
* **Caminho:** /core/AppCustomUI.js  
* **Função:** Gerencia a interface de usuário para aplicativos do tipo custom\_ui (aplicativos de sistema com UI personalizada).  
  * Cria um div para o aplicativo e o injeta diretamente no div\#desktop (ou outro contêiner especificado).  
  * Carrega o HTML específico do aplicativo (dirApp) diretamente no seu elemento.  
  * **Não** cria botões de fechar, minimizar ou maximizar por padrão.  
  * **Não** pode ser fechado diretamente pelo usuário através do AppManager.removeApp().  
  * Chama o método onRun() da instância do aplicativo *após* o elemento ser renderizado e anexado ao DOM.

### **2.7. /core/BaseApp.js**

* **Versão:** v1.0.1  
* **Caminho:** /core/BaseApp.js  
* **Função:** É a classe base que todos os aplicativos devem estender.  
  * Fornece acesso à instância do AppCore e ao AppManager global.  
  * Oferece métodos de timer seguros (setTimeout, setInterval, clearTimeout, clearInterval) que são gerenciados pelo AppCore para garantir a limpeza de recursos.  
  * Define os métodos de ciclo de vida onRun() (para inicialização da lógica do app) e onCleanup() (para limpeza de recursos ao encerrar). As classes filhas devem sobrescrever esses métodos.

### **2.8. apps/apps.json**

* **Versão:** v1.0.1  
* **Caminho:** /apps/apps.json  
* **Função:** Arquivo de configuração que lista todos os aplicativos disponíveis no sistema. Cada entrada de aplicativo inclui:  
  * app\_name: Nome de exibição do aplicativo.  
  * id: ID único do aplicativo.  
  * width, height, x\_position, y\_position: Dimensões e posição iniciais (para system\_window apps).  
  * dirApp: Caminho para o arquivo HTML da UI do aplicativo.  
  * jsFile: Caminho para o arquivo JavaScript principal do aplicativo.  
  * icon\_url: Caminho para o ícone do aplicativo.  
  * hidden: true se o aplicativo não deve aparecer no menu de aplicativos.  
  * autorun: true se o aplicativo deve ser iniciado automaticamente na inicialização do sistema.  
  * mode: Define o tipo de aplicativo (system\_window, custom\_ui, headless).

## **3\. Tipos de Aplicativos**

O unkayOS suporta três modos de operação para aplicativos, definidos na propriedade mode do apps.json:

### **3.1. system\_window**

* **Descrição:** Aplicativos que rodam em uma janela tradicional do sistema.  
* **Características:**  
  * Possuem barra de título com botões de minimizar, maximizar e fechar.  
  * Podem ser arrastados e redimensionados pelo usuário.  
  * Aparecem na barra de tarefas.  
  * São gerenciados pelo AppWindowSystem.  
* **Exemplo:** O aplicativo Terminal.

### **3.2. custom\_ui (Aplicativos de Sistema com UI)**

* **Descrição:** Aplicativos de sistema que possuem uma interface de usuário personalizada, mas que não usam o sistema de janelas.  
* **Características:**  
  * Iniciam automaticamente com o sistema (autorun: true).  
  * São injetados diretamente no div\#desktop (ou outro contêiner específico).  
  * **Não** aparecem na barra de tarefas.  
  * **Não** podem ser fechados pelo usuário (não possuem botões de controle de janela nem método close() chamável pelo AppManager).  
  * São gerenciados pelo AppCustomUI.  
* **Exemplo:** O System Clock (Relógio do Sistema).

### **3.3. headless**

* **Descrição:** Aplicativos que rodam em segundo plano, sem interface de usuário.  
* **Características:**  
  * Podem ser iniciados automaticamente (autorun: true).  
  * Não possuem representação visual na tela ou na barra de tarefas.  
  * Podem interagir com o sistema através de callbacks (ex: enviar mensagens para o Terminal) ou manipular o estado global.  
  * São gerenciados diretamente pelo AppCore.  
* **Exemplo:** O Background Logger.

## **4\. Conceitos Chave**

### **4.1. Caminhos Absolutos**

Todos os caminhos para arquivos (JS, CSS, imagens, HTML de apps) devem ser absolutos, começando com / (ex: /core/AppManager.js, /assets/style/main.less). Isso garante que os recursos sejam carregados corretamente, independentemente do diretório do arquivo que os está referenciando.

### **4.2. Versionamento**

Cada arquivo JavaScript e HTML principal inclui um comentário de versão (// /caminho/do/arquivo \- vX.Y.Z ou \<\!-- caminho/do/arquivo \- vX.Y.Z \--\>) para facilitar o rastreamento de alterações e o gerenciamento do código.

### **4.3. LESS para Estilização**

O sistema utiliza LESS para pré-processamento CSS, permitindo o uso de variáveis, mixins e aninhamento para uma estilização mais organizada e modular. O less.min.js é incluído para compilar o main.less em tempo real no navegador.

### **4.4. Estrutura DOM e Z-Index**

A organização visual do sistema depende de uma estrutura DOM bem definida e do gerenciamento de z-index para garantir que os elementos apareçam na ordem correta:

* \#desktop (z-index: 0): O plano de fundo principal.  
* custom-ui-app (z-index: 10): Aplicativos de sistema com UI personalizada (ex: relógio), que ficam acima do desktop.  
* app (z-index: 100+): Janelas de aplicativos, gerenciadas dinamicamente pelo AppManager para garantir que a janela ativa esteja sempre no topo.  
* tool\_bar (z-index: 999): A barra de tarefas, sempre visível no topo.  
* menu\_apps (z-index: 1000): O menu de aplicativos, que aparece acima de todos os outros elementos quando aberto.

### **4.5. Ciclo de Vida do Aplicativo (onRun, onCleanup)**

Cada classe de aplicativo (que estende BaseApp) deve implementar os métodos onRun() e onCleanup():

* onRun(): Contém a lógica de inicialização do aplicativo. É chamado quando o aplicativo é executado, após seus elementos DOM estarem prontos.  
* onCleanup(): Contém a lógica de limpeza de recursos. É chamado quando o aplicativo é encerrado, garantindo que listeners, timers e outros recursos sejam liberados para evitar vazamentos de memória.
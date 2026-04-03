# Documento de Requisitos — Evolução da Stack do unkayOS

## Introdução

Este documento define os requisitos para evoluir a stack tecnológica do unkayOS — um sistema operacional web modular construído com vanilla JavaScript e ES modules. O objetivo central é triplo: (1) introduzir ferramentas modernas de desenvolvimento (build, testes, tipagem, linting) e melhorar o isolamento e a persistência; (2) criar um sistema de autenticação local próprio, semelhante ao modelo de sistemas operacionais reais (Linux, Windows) — com usuários, senhas, níveis de acesso, grupos e permissões, tudo armazenado localmente; e (3) projetar uma arquitetura de autenticação modular com uma interface abstrata (Auth Provider Interface) que o sistema local implementa e que futuros provedores externos (SSO como Authentik, OAuth como Google/GitHub, etc.) possam implementar sem alterar o core — tudo sem comprometer a modularidade que permite criar novos apps facilmente seguindo o padrão existente (config.json + main.js + index.html + style.css + icon.svg estendendo BaseApp).

## Glossário

- **Build_System**: Sistema de build baseado em Vite que compila, minifica e otimiza os módulos do unkayOS para produção, mantendo ES modules nativos em desenvolvimento.
- **Type_Checker**: Camada de verificação de tipos via JSDoc + TypeScript em modo checkJs, sem necessidade de converter arquivos .js para .ts.
- **Test_Runner**: Infraestrutura de testes automatizados baseada em Vitest para testes unitários e de integração dos módulos core e apps.
- **Linter**: Ferramenta ESLint com configuração padronizada para garantir consistência de código no projeto.
- **Formatter**: Ferramenta Prettier para formatação automática e consistente do código.
- **CSS_Isolation_System**: Sistema de isolamento de CSS por app que substitui o namespacing baseado em regex por uma abordagem mais robusta.
- **Dev_Server**: Servidor de desenvolvimento com hot module replacement (HMR) para feedback rápido durante o desenvolvimento.
- **FileSystem_Backend**: Camada de persistência do sistema de arquivos virtual que utiliza IndexedDB com armazenamento granular por entry (metadata e conteúdo separados), cache em memória da árvore de diretórios, API assíncrona, enforcement real de permissões baseado no usuário logado, suporte a conteúdo binário e emissão de eventos de mudança via EventBus.
- **App_Scaffold_CLI**: Ferramenta de linha de comando para gerar a estrutura de um novo app automaticamente.
- **EventBus**: Sistema global de pub/sub para comunicação desacoplada entre módulos do unkayOS.
- **BaseApp**: Classe base que todos os apps do unkayOS estendem, fornecendo ciclo de vida (onRun, onCleanup), utilitários DOM e acesso a APIs do sistema.
- **SystemManager**: Gerenciador centralizado de estado e ciclo de vida de todos os sistemas singleton do unkayOS.
- **AppManager**: Sistema responsável pelo ciclo de vida dos apps (carregar, iniciar, parar, múltiplas instâncias).
- **App**: Módulo de aplicação do unkayOS que segue o padrão config.json + main.js + index.html + style.css + icon.svg.
- **LocalAuthSystem**: Sistema de autenticação local do unkayOS que gerencia usuários, senhas (hashed), sessões, grupos e permissões, armazenados localmente via IndexedDB — análogo ao modelo de /etc/passwd, /etc/shadow e /etc/group de sistemas Unix.
- **UserManager**: Subsistema do LocalAuthSystem responsável por CRUD de usuários, atribuição de roles/grupos, perfis de usuário e gerenciamento de contas (criação, exclusão, ativação, desativação).
- **PermissionSystem**: Subsistema que gerencia permissões e níveis de acesso, verificando se um usuário ou role possui autorização para executar uma ação ou acessar um recurso.
- **AuthProviderInterface**: Interface abstrata/contrato que define os métodos obrigatórios que qualquer provedor de autenticação (local ou externo) deve implementar, permitindo extensibilidade futura para SSO, OAuth e outros mecanismos sem alterar o core.
- **Session**: Representação de uma sessão de usuário autenticado, contendo identificador de sessão, referência ao usuário, timestamp de criação e expiração.
- **Role**: Papel atribuído a um usuário que agrupa um conjunto de permissões (ex: root, admin, user, guest).
- **App_Backend_Gateway**: Camada de abstração no core que permite apps se comunicarem com backends externos (APIs REST, WebSocket, IA) de forma padronizada, gerenciando autenticação, retry e erros.
- **App_Service_Manifest**: Extensão do config.json que declara dependências de serviços externos e requisitos de autenticação que um app necessita, permitindo ao sistema validar e provisionar essas dependências antes do app iniciar.

---

## Requisitos

### Requisito 1: Introdução do Build System

**User Story:** Como desenvolvedor do unkayOS, eu quero um sistema de build moderno, para que o código seja otimizado em produção sem alterar o fluxo de desenvolvimento com ES modules nativos.

#### Critérios de Aceitação

1. THE Build_System SHALL utilizar Vite como bundler, mantendo ES modules nativos durante o desenvolvimento.
2. WHEN o comando de build de produção for executado, THE Build_System SHALL gerar arquivos minificados com tree-shaking aplicado.
3. THE Build_System SHALL preservar a estrutura de diretórios dos apps (apps/{app-name}/) nos artefatos de build, permitindo carregamento dinâmico via import().
4. WHEN um novo app for adicionado ao diretório apps/, THE Build_System SHALL incluir o app no build sem necessidade de configuração manual adicional.
5. THE Build_System SHALL gerar source maps para facilitar debugging em produção.
6. IF o build falhar por erro de sintaxe em um módulo, THEN THE Build_System SHALL reportar o arquivo e a linha do erro de forma clara.

---

### Requisito 2: Servidor de Desenvolvimento com HMR

**User Story:** Como desenvolvedor do unkayOS, eu quero hot module replacement durante o desenvolvimento, para que alterações no código sejam refletidas no navegador sem recarregar a página inteira.

#### Critérios de Aceitação

1. THE Dev_Server SHALL servir os módulos ES nativos diretamente, sem bundling durante o desenvolvimento.
2. WHEN um arquivo .js de um app for modificado, THE Dev_Server SHALL aplicar a atualização via HMR sem perder o estado das outras janelas abertas.
3. WHEN um arquivo .css de um app for modificado, THE Dev_Server SHALL injetar o CSS atualizado sem recarregar a página.
4. WHEN um arquivo index.html de um app for modificado, THE Dev_Server SHALL recarregar apenas a instância do app afetado.
5. IF o HMR falhar para um módulo específico, THEN THE Dev_Server SHALL executar um full reload da página como fallback.

---

### Requisito 3: Verificação de Tipos via JSDoc

**User Story:** Como desenvolvedor do unkayOS, eu quero verificação de tipos sem migrar para TypeScript, para que erros de tipo sejam detectados em tempo de desenvolvimento mantendo arquivos .js puros.

#### Critérios de Aceitação

1. THE Type_Checker SHALL utilizar TypeScript em modo checkJs com anotações JSDoc para verificação de tipos nos arquivos .js existentes.
2. THE Type_Checker SHALL fornecer um arquivo tsconfig.json configurado com allowJs: true e checkJs: true.
3. WHEN um desenvolvedor adicionar anotações @param, @returns ou @typedef em um arquivo .js, THE Type_Checker SHALL validar os tipos declarados.
4. THE Type_Checker SHALL fornecer arquivos de definição de tipos (.d.ts) para as APIs públicas do core (BaseApp, EventBus, SystemManager, AppManager, FileSystem).
5. WHEN um app chamar uma API do core com parâmetros de tipo incorreto, THE Type_Checker SHALL reportar o erro no editor.
6. THE Type_Checker SHALL permitir adoção incremental, sem exigir anotações em todos os arquivos simultaneamente.

---

### Requisito 4: Infraestrutura de Testes Automatizados

**User Story:** Como desenvolvedor do unkayOS, eu quero uma infraestrutura de testes, para que eu possa validar o comportamento dos módulos core e dos apps de forma automatizada.

#### Critérios de Aceitação

1. THE Test_Runner SHALL utilizar Vitest como framework de testes, integrado com o Build_System baseado em Vite.
2. THE Test_Runner SHALL suportar testes unitários para módulos do core (EventBus, FileSystem, AppManager, SystemManager, BaseApp).
3. THE Test_Runner SHALL suportar testes de integração que simulem o ciclo de vida de um app (carregar, iniciar, parar).
4. WHEN o comando de testes for executado, THE Test_Runner SHALL reportar cobertura de código para os módulos core.
5. THE Test_Runner SHALL fornecer utilitários de mock para o DOM (via jsdom ou happy-dom) para testar componentes que manipulam elementos HTML.
6. WHEN um teste falhar, THE Test_Runner SHALL reportar o nome do teste, o arquivo e a diferença entre o valor esperado e o valor recebido.
7. THE Test_Runner SHALL executar todos os testes em menos de 30 segundos para o conjunto inicial de testes do core.

---

### Requisito 5: Linting e Formatação Padronizados

**User Story:** Como desenvolvedor do unkayOS, eu quero regras de linting e formatação automática, para que o código do projeto mantenha um estilo consistente.

#### Critérios de Aceitação

1. THE Linter SHALL utilizar ESLint com regras configuradas para ES modules e padrões do projeto.
2. THE Formatter SHALL utilizar Prettier com configuração compartilhada para formatação automática.
3. THE Linter SHALL detectar variáveis não utilizadas, imports duplicados e uso de var em vez de const/let.
4. WHEN o comando de lint for executado, THE Linter SHALL reportar violações com o arquivo, a linha e a regra violada.
5. THE Linter SHALL incluir regras específicas para o padrão de apps do unkayOS, detectando acesso direto ao document.querySelector fora do escopo de BaseApp.
6. THE Formatter SHALL formatar arquivos .js, .css e .json de forma consistente ao salvar.

---

### Requisito 6: Isolamento de CSS Robusto por App

**User Story:** Como desenvolvedor do unkayOS, eu quero isolamento de CSS mais robusto para cada app, para que estilos de um app não vazem para outros apps ou para o sistema.

#### Critérios de Aceitação

1. THE CSS_Isolation_System SHALL substituir o namespacing baseado em regex por CSS Scoping nativo ou por transformação automática via build.
2. WHEN um app definir estilos em seu style.css, THE CSS_Isolation_System SHALL garantir que os seletores se apliquem apenas ao container da instância do app.
3. THE CSS_Isolation_System SHALL permitir que apps acessem design tokens globais (custom properties definidas em :root) sem restrição.
4. WHEN duas instâncias do mesmo app estiverem abertas, THE CSS_Isolation_System SHALL aplicar os estilos corretamente a cada instância de forma independente.
5. IF um app definir um seletor global (html, body, *), THEN THE CSS_Isolation_System SHALL ignorar o seletor global e não aplicar namespace a ele.
6. THE CSS_Isolation_System SHALL manter compatibilidade com os arquivos style.css existentes dos apps sem exigir reescrita.

---

### Requisito 7: Refatoração do FileSystem — IndexedDB, Armazenamento Granular, Permissões Reais e Suporte Binário

**User Story:** Como usuário e desenvolvedor do unkayOS, eu quero que o sistema de arquivos virtual seja robusto, escalável e seguro — com persistência em IndexedDB, armazenamento granular por entry, API assíncrona, enforcement real de permissões baseado no usuário logado, eventos de mudança e suporte a conteúdo binário — para que o filesystem se comporte como um sistema de arquivos real.

#### Critérios de Aceitação

**Persistência e Armazenamento Granular**

1. THE FileSystem_Backend SHALL utilizar IndexedDB como camada de persistência em vez de LocalStorage, com dois object stores separados: um para metadata (type, name, permissions, owner, children, created, modified, size) e outro para conteúdo de arquivos (blobs/strings).
2. THE FileSystem_Backend SHALL armazenar cada entry (arquivo ou diretório) como um registro individual no IndexedDB, eliminando a necessidade de serializar/deserializar a árvore inteira a cada operação.
3. THE FileSystem_Backend SHALL manter um cache em memória da árvore de metadata (diretórios e atributos de arquivos) para operações rápidas de navegação (exists, stat, readdir), acessando o IndexedDB apenas para leitura/escrita de conteúdo de arquivos.
4. WHEN o sistema inicializar e detectar dados existentes no LocalStorage (formato JSON monolítico legado), THE FileSystem_Backend SHALL migrar os dados automaticamente para o novo formato granular no IndexedDB, convertendo cada entry do JSON em um registro individual.
5. WHEN os dados forem migrados do LocalStorage para IndexedDB com sucesso, THE FileSystem_Backend SHALL remover os dados antigos do LocalStorage.

**API Assíncrona**

6. THE FileSystem_Backend SHALL expor todas as operações como métodos assíncronos (retornando Promises): readFile, writeFile, mkdir, remove, readdir, stat, exists, move, copy, find.
7. THE FileSystem_Backend SHALL manter compatibilidade de assinatura com a API existente (mesmos nomes de métodos e parâmetros), alterando apenas o retorno de síncrono para assíncrono (Promise).
8. THE FileSystem_Backend SHALL realizar operações de leitura e escrita de forma assíncrona sem bloquear a thread principal.

**Capacidade e Limites**

9. THE FileSystem_Backend SHALL suportar armazenamento de arquivos de até 50MB individualmente.
10. WHEN uma operação de escrita falhar por falta de espaço, THE FileSystem_Backend SHALL retornar um erro descritivo informando o espaço disponível.

**Suporte a Conteúdo Binário**

11. THE FileSystem_Backend SHALL suportar armazenamento e leitura de conteúdo binário (ArrayBuffer, Blob, Uint8Array) além de strings, permitindo que apps armazenem imagens, áudio e outros arquivos binários no filesystem virtual.
12. WHEN writeFile for chamado com conteúdo binário, THE FileSystem_Backend SHALL armazenar o conteúdo no formato nativo (sem conversão para string) e registrar o tipo MIME no metadata do arquivo.
13. WHEN readFile for chamado para um arquivo binário, THE FileSystem_Backend SHALL retornar o conteúdo no formato original (ArrayBuffer/Blob) em que foi armazenado.

**Enforcement Real de Permissões**

14. THE FileSystem_Backend SHALL integrar com o PermissionSystem (Requisito 12) para enforçar permissões de leitura, escrita e execução baseadas no usuário logado e no owner/permissions do arquivo ou diretório.
15. WHEN um usuário sem permissão de escrita tentar executar writeFile em um arquivo cujo owner é outro usuário e cujas permissões não incluem escrita para "others", THE FileSystem_Backend SHALL negar a operação e retornar um erro descritivo (ex: "Permission denied: write access required").
16. WHEN um usuário com role "root" executar qualquer operação no filesystem, THE FileSystem_Backend SHALL permitir a operação independentemente das permissões do arquivo (root bypass).
17. THE FileSystem_Backend SHALL suportar os campos de permissão existentes (permissions no formato Unix-like 'rwxr-xr-x', owner) e interpretá-los de forma funcional, verificando permissões de owner, group e others.

**Eventos de Filesystem**

18. THE FileSystem_Backend SHALL emitir eventos via EventBus para mudanças no filesystem: fs:file:created, fs:file:modified, fs:file:deleted, fs:directory:created, fs:directory:deleted, fs:file:moved, fs:file:copied.
19. WHEN um evento de filesystem for emitido, THE FileSystem_Backend SHALL incluir no payload do evento: o path afetado, o tipo de operação, o usuário que executou a operação e o timestamp.

**Propriedades de Corretude**

20. FOR ALL objetos FileSystem válidos, ler um arquivo após escrevê-lo SHALL retornar o conteúdo idêntico ao que foi escrito (propriedade round-trip), tanto para conteúdo string quanto binário.
21. FOR ALL operações de mkdir seguidas de readdir no diretório pai, o diretório criado SHALL aparecer na listagem retornada.
22. FOR ALL operações de remove seguidas de exists no mesmo path, exists SHALL retornar false.

---

### Requisito 8: Ferramenta de Scaffold para Novos Apps

**User Story:** Como desenvolvedor do unkayOS, eu quero uma ferramenta CLI para gerar a estrutura de um novo app, para que eu possa começar a desenvolver rapidamente seguindo o padrão do projeto.

#### Critérios de Aceitação

1. WHEN o comando de scaffold for executado com um nome de app, THE App_Scaffold_CLI SHALL gerar a estrutura completa: config.json, main.js, index.html, style.css e icon.svg no diretório apps/{app-name}/.
2. THE App_Scaffold_CLI SHALL gerar um main.js com uma classe que estende BaseApp, incluindo os métodos onRun() e onCleanup() como stubs.
3. THE App_Scaffold_CLI SHALL gerar um config.json com valores padrão válidos (app_name, mode, dimensões, caminhos de arquivos).
4. THE App_Scaffold_CLI SHALL registrar automaticamente o novo app no arquivo apps/apps.json.
5. WHEN o comando de scaffold for executado com um nome de app que já existe, THE App_Scaffold_CLI SHALL abortar a operação e informar que o app já existe.
6. THE App_Scaffold_CLI SHALL gerar um style.css com imports dos design tokens e um seletor raiz do app como exemplo.
7. THE App_Scaffold_CLI SHALL aceitar um parâmetro --mode para definir o modo do app (system_window, desktop_ui, custom_ui, headless), usando system_window como padrão.

---

### Requisito 9: Gerenciamento de Dependências via package.json

**User Story:** Como desenvolvedor do unkayOS, eu quero um package.json com scripts padronizados, para que as ferramentas de desenvolvimento sejam instaláveis e os comandos do projeto sejam documentados.

#### Critérios de Aceitação

1. THE Build_System SHALL fornecer um package.json com as dependências de desenvolvimento necessárias (vite, vitest, eslint, prettier, typescript).
2. THE Build_System SHALL definir scripts npm padronizados: dev (servidor de desenvolvimento), build (build de produção), test (executar testes), lint (executar linter), format (executar formatter), scaffold (gerar novo app).
3. THE Build_System SHALL manter zero dependências de runtime no bundle de produção, preservando a filosofia vanilla JS do projeto.
4. WHEN um novo desenvolvedor clonar o repositório e executar npm install seguido de npm run dev, THE Build_System SHALL iniciar o ambiente de desenvolvimento funcional.
5. THE Build_System SHALL incluir um arquivo .gitignore atualizado para excluir node_modules/ e dist/ do controle de versão.

---

### Requisito 10: Preservação da Modularidade de Apps

**User Story:** Como desenvolvedor do unkayOS, eu quero que todas as evoluções da stack preservem o padrão de criação de apps, para que novos apps continuem sendo simples de implementar.

#### Critérios de Aceitação

1. THE Build_System SHALL manter o padrão de app como unidade independente: config.json + main.js + index.html + style.css + icon.svg dentro de apps/{app-name}/.
2. THE Build_System SHALL preservar o carregamento dinâmico de apps via import() e fetch(), sem exigir registro estático no bundler.
3. WHILE o sistema estiver em modo de desenvolvimento, THE Dev_Server SHALL carregar apps diretamente dos seus diretórios sem transformação, mantendo o comportamento idêntico ao de servir arquivos estáticos.
4. THE BaseApp SHALL continuar fornecendo os utilitários $() para DOM scoping, ciclo de vida (onRun/onCleanup), e acesso a APIs do sistema (fileSystem, appManager) sem alterações na interface pública.
5. WHEN um desenvolvedor criar um novo app seguindo o padrão documentado, THE AppManager SHALL carregar e executar o app sem necessidade de configuração adicional no build ou no core.
6. THE EventBus SHALL continuar sendo o mecanismo principal de comunicação entre apps e sistemas, sem introdução de dependências de frameworks de estado.

---

### Requisito 11: Sistema de Autenticação Local (LocalAuthSystem)

**User Story:** Como usuário do unkayOS, eu quero um sistema de autenticação local próprio — semelhante ao modelo de sistemas operacionais reais como Linux e Windows — para que eu possa ter minha conta de usuário com senha, nível de acesso e sessão, tudo gerenciado localmente dentro do sistema.

#### Critérios de Aceitação

1. THE LocalAuthSystem SHALL gerenciar usuários, senhas e sessões localmente, armazenando todos os dados de autenticação no IndexedDB (via FileSystem_Backend ou store dedicado).
2. THE LocalAuthSystem SHALL armazenar senhas exclusivamente em formato hash utilizando um algoritmo seguro (PBKDF2 via Web Crypto API), sem armazenar senhas em texto plano em nenhum momento.
3. WHEN o unkayOS for inicializado pela primeira vez (sem usuários cadastrados), THE LocalAuthSystem SHALL criar automaticamente um usuário root com uma senha padrão e exibir um prompt obrigatório para o usuário definir uma nova senha antes de prosseguir.
4. WHEN um usuário fornecer credenciais válidas (username e senha) na tela de login, THE LocalAuthSystem SHALL criar uma Session com identificador único, referência ao usuário, timestamp de criação e tempo de expiração configurável.
5. WHEN um usuário fornecer credenciais inválidas, THE LocalAuthSystem SHALL retornar um erro descritivo sem revelar se o problema é no username ou na senha.
6. THE LocalAuthSystem SHALL suportar um modo guest (convidado) com permissões restritas, permitindo uso limitado do sistema sem necessidade de login.
7. WHEN a Session do usuário expirar, THE LocalAuthSystem SHALL emitir um evento auth:session:expired via EventBus e redirecionar o usuário para a tela de login.
8. THE LocalAuthSystem SHALL fornecer métodos para login, logout, verificação de sessão ativa e obtenção do usuário corrente: login(username, password), logout(), isAuthenticated(), getCurrentUser(), getCurrentSession().
9. WHEN o usuário executar logout, THE LocalAuthSystem SHALL invalidar a Session corrente, limpar dados de sessão do armazenamento e emitir um evento auth:logout via EventBus.
10. THE LocalAuthSystem SHALL emitir eventos via EventBus para mudanças de estado de autenticação: auth:login, auth:logout, auth:session:expired, auth:user:changed.
11. FOR ALL senhas válidas, aplicar hash e depois verificar a senha original contra o hash armazenado SHALL retornar verdadeiro (propriedade round-trip de verificação de hash).

---

### Requisito 12: Gerenciamento de Usuários e Permissões

**User Story:** Como administrador do unkayOS, eu quero gerenciar usuários, grupos e permissões — semelhante ao modelo de /etc/passwd, /etc/group e permissões Unix — para que eu possa controlar quem acessa o quê dentro do sistema.

#### Critérios de Aceitação

1. THE UserManager SHALL suportar operações CRUD de usuários: createUser(username, password, role), deleteUser(username), updateUser(username, fields), getUser(username), listUsers().
2. THE UserManager SHALL armazenar para cada usuário: uid (identificador numérico único), username (único, case-insensitive), passwordHash, role, groups (array), displayName, createdAt, lastLoginAt, isActive (boolean).
3. THE PermissionSystem SHALL definir roles hierárquicos padrão com níveis de acesso crescentes: guest (nível 0), user (nível 1), admin (nível 2), root (nível 3).
4. THE PermissionSystem SHALL fornecer métodos para verificação de permissões: hasPermission(username, permission), hasRole(username, role), getUserAccessLevel(username), canExecute(username, action).
5. WHEN um usuário com role "user" tentar executar uma ação que requer role "admin" ou superior, THE PermissionSystem SHALL negar a ação e retornar um erro descritivo informando o nível de acesso necessário.
6. THE UserManager SHALL suportar grupos de usuários, permitindo atribuir permissões a um grupo e herdar essas permissões para todos os membros: createGroup(groupName, permissions), addUserToGroup(username, groupName), removeUserFromGroup(username, groupName).
7. THE PermissionSystem SHALL definir permissões granulares para ações do sistema: system:shutdown, system:settings, apps:install, apps:uninstall, files:read, files:write, files:delete, users:manage, users:create, users:delete.
8. WHEN o usuário root executar deleteUser para o próprio usuário root, THE UserManager SHALL negar a operação e retornar um erro informando que o usuário root não pode ser excluído.
9. WHEN um novo usuário for criado sem role explícito, THE UserManager SHALL atribuir o role "user" como padrão.
10. THE UserManager SHALL fornecer um método para alterar senha: changePassword(username, oldPassword, newPassword), que valida a senha antiga antes de aplicar a nova.
11. WHEN changePassword for chamado com uma senha antiga incorreta, THE UserManager SHALL negar a operação e retornar um erro descritivo.
12. THE PermissionSystem SHALL permitir que apps consultem o nível de acesso do usuário corrente via API pública acessível na BaseApp: this.auth.hasPermission(permission), this.auth.hasRole(role), this.auth.getCurrentUser().

---

### Requisito 13: Interface Abstrata de Provedor de Autenticação (AuthProviderInterface)

**User Story:** Como desenvolvedor do unkayOS, eu quero uma interface abstrata de autenticação que o sistema local implementa e que futuros provedores externos (SSO, OAuth) possam implementar, para que a arquitetura de autenticação seja extensível sem alterar o core do sistema.

#### Critérios de Aceitação

1. THE AuthProviderInterface SHALL definir um contrato (interface/classe abstrata) com os seguintes métodos obrigatórios: login(credentials), logout(), isAuthenticated(), getCurrentUser(), validateSession(), getProviderName(), getProviderType().
2. THE AuthProviderInterface SHALL definir tipos de provedor suportados: "local" (autenticação local), "sso" (Single Sign-On externo), "oauth" (OAuth2/OIDC externo) — sendo que apenas o tipo "local" será implementado nesta versão.
3. THE LocalAuthSystem SHALL implementar a AuthProviderInterface como provedor do tipo "local", sendo o provedor padrão e ativo do sistema.
4. THE AuthProviderInterface SHALL definir um método de registro de provedores: registerProvider(providerName, providerInstance), permitindo que futuros módulos registrem provedores externos sem modificar o core.
5. THE AuthProviderInterface SHALL definir um método para selecionar o provedor ativo: setActiveProvider(providerName), permitindo alternar entre provedor local e externo.
6. THE AuthProviderInterface SHALL definir um método getAvailableProviders() que retorna a lista de provedores registrados com nome, tipo e status (ativo/inativo).
7. WHEN um provedor externo for registrado via registerProvider, THE AuthProviderInterface SHALL validar que o provedor implementa todos os métodos obrigatórios do contrato antes de aceitar o registro.
8. IF um provedor externo registrado não implementar algum método obrigatório, THEN THE AuthProviderInterface SHALL rejeitar o registro e retornar um erro descritivo listando os métodos faltantes.
9. THE AuthProviderInterface SHALL emitir um evento auth:provider:registered via EventBus quando um novo provedor for registrado com sucesso.
10. THE AuthProviderInterface SHALL emitir um evento auth:provider:changed via EventBus quando o provedor ativo for alterado.
11. THE SystemManager SHALL inicializar o LocalAuthSystem como provedor padrão durante a fase de boot, antes de inicializar o AppManager.

---

### Requisito 14: Gateway de Comunicação com Backend para Apps

**User Story:** Como desenvolvedor de um app do unkayOS, eu quero uma camada padronizada para comunicar com backends externos (APIs REST, WebSocket, serviços de IA), para que eu não precise reimplementar fetch, autenticação, retry e tratamento de erros em cada app.

#### Critérios de Aceitação

1. THE App_Backend_Gateway SHALL fornecer uma API na BaseApp para chamadas HTTP: this.api.get(url, options), this.api.post(url, body, options), this.api.put(url, body, options), this.api.delete(url, options).
2. WHEN um app fizer uma chamada via App_Backend_Gateway e o AuthProviderInterface possuir um token ou sessão ativa, THE App_Backend_Gateway SHALL incluir automaticamente as credenciais de autenticação apropriadas na requisição (header Authorization ou cookie, conforme o provedor ativo).
3. THE App_Backend_Gateway SHALL implementar retry automático com backoff exponencial para erros de rede (timeout, 5xx), com número máximo de tentativas configurável (padrão: 3).
4. WHEN uma resposta HTTP retornar status 401, THE App_Backend_Gateway SHALL solicitar ao AuthProviderInterface a revalidação da sessão e repetir a requisição uma vez antes de propagar o erro ao app.
5. THE App_Backend_Gateway SHALL suportar conexões WebSocket persistentes via this.api.connectWebSocket(url, options), com reconexão automática em caso de desconexão.
6. THE App_Backend_Gateway SHALL emitir eventos via EventBus para estados de conectividade: api:request:start, api:request:complete, api:request:error, api:websocket:connected, api:websocket:disconnected.
7. WHEN o app for encerrado (onCleanup), THE App_Backend_Gateway SHALL fechar automaticamente todas as conexões WebSocket e cancelar requisições HTTP pendentes associadas àquela instância.
8. THE App_Backend_Gateway SHALL permitir que apps declarem seus endpoints de backend no config.json via uma seção "services.api", com baseUrl e provedor de autenticação associado (referência ao AuthProviderInterface).
9. THE App_Backend_Gateway SHALL suportar streaming de respostas (ReadableStream) para integração com APIs de IA que retornam dados incrementalmente (ex: streaming de tokens de LLM).

---

### Requisito 15: Manifesto de Serviços para Apps Complexos

**User Story:** Como desenvolvedor do unkayOS, eu quero declarar no config.json do meu app quais serviços e requisitos de autenticação ele necessita, para que o sistema possa validar dependências e fornecer feedback claro ao usuário antes do app iniciar.

#### Critérios de Aceitação

1. THE App_Service_Manifest SHALL estender o config.json com uma seção "services" que declara dependências de serviços e requisitos de autenticação do app.
2. THE App_Service_Manifest SHALL suportar declaração de requisitos de autenticação na seção "services.auth" com campos: required (boolean — se o app exige usuário autenticado), minRole (role mínimo necessário, ex: "user", "admin"), permissions (array de permissões específicas necessárias).
3. THE App_Service_Manifest SHALL suportar declaração de endpoints de API na seção "services.api" com campos: name (identificador), baseUrl, authProvider (referência ao provedor de autenticação, opcional), type (rest ou websocket).
4. WHEN o AppManager carregar um app que declara "services.auth.required: true", THE AppManager SHALL verificar via AuthProviderInterface se o usuário está autenticado e possui o role/permissões mínimas antes de iniciar o app.
5. IF o usuário não atender aos requisitos de autenticação declarados no manifesto, THEN THE AppManager SHALL exibir uma mensagem de erro descritiva informando o requisito não atendido (ex: "Este app requer nível de acesso admin"), sem impedir o carregamento de outros apps.
6. THE App_Service_Manifest SHALL manter retrocompatibilidade — apps sem seção "services" no config.json SHALL continuar funcionando normalmente como apps puramente client-side acessíveis a qualquer usuário.
7. WHEN o App_Scaffold_CLI gerar um novo app com flags de serviço (ex: --with-auth admin --with-api), THE App_Scaffold_CLI SHALL gerar a seção "services" no config.json com valores de exemplo.
8. THE App_Service_Manifest SHALL suportar um campo "services.ai" para declarar integrações com serviços de IA, com campos: provider (openai, anthropic, custom), model (nome do modelo), baseUrl (endpoint da API), authProvider (referência ao provedor de autenticação).

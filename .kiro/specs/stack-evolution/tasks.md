# Plano de Implementação: Evolução da Stack do unkayOS

## Visão Geral

Implementação em 6 fases sequenciais que evoluem a stack do unkayOS de forma incremental, sem quebrar o sistema em nenhum estágio. Cada fase produz um sistema funcional. A ordem segue: Dev Tooling → Testing → FileSystem → CSS Isolation → Authentication → App Integration.

## Tarefas

- [x] 1. Fase 1 — Dev Tooling Foundation (Impacto runtime: zero)
  - [x] 1.1 Criar package.json com dependências de desenvolvimento e scripts npm
    - Criar `package.json` na raiz com `"type": "module"`, zero dependências de runtime
    - Incluir devDependencies: vite, vitest, eslint, prettier, typescript, @vitest/coverage-v8, happy-dom, fast-check
    - Definir scripts: dev, build, preview, test, test:watch, test:coverage, lint, lint:fix, format, format:check, scaffold, typecheck
    - Criar `.gitignore` atualizado incluindo `node_modules/` e `dist/`
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 1.2 Configurar Vite como build system e dev server com HMR
    - Criar `vite.config.js` com root `.`, outDir `dist`, sourcemap habilitado
    - Configurar rollup input dinâmico para detectar apps automaticamente em `apps/*/`
    - Preservar estrutura de diretórios `apps/{app-name}/` nos artefatos de build
    - Garantir tree-shaking e minificação no build de produção
    - HMR habilitado por padrão para .js, .css e .html dos apps
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Configurar ESLint (flat config v9) e Prettier
    - Criar `eslint.config.js` com flat config para ES modules
    - Incluir regras para: variáveis não utilizadas, imports duplicados, uso de `var`
    - Criar regra customizada para detectar `document.querySelector` fora do escopo de BaseApp
    - Criar `.prettierrc` com configuração para `.js`, `.css`, `.json`
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 1.4 Configurar TypeScript em modo checkJs com JSDoc
    - Criar `tsconfig.json` com allowJs, checkJs, noEmit, target ES2022, module ES2022, moduleResolution bundler
    - Incluir `core/**/*.js`, `apps/**/*.js`, `main.js` no escopo
    - Criar diretório `core/types/` com arquivos de definição `.d.ts` para APIs públicas: BaseApp.d.ts, EventBus.d.ts, FileSystem.d.ts, AppManager.d.ts, SystemManager.d.ts
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 1.5 Checkpoint — Validar ambiente de desenvolvimento
    - Garantir que `npm install` seguido de `npm run dev` inicia o ambiente funcional
    - Garantir que `npm run build` gera artefatos com source maps
    - Garantir que `npm run lint` e `npm run format` executam sem erros de configuração
    - Garantir que `npm run typecheck` executa sem erros de configuração
    - Perguntar ao usuário se há dúvidas antes de prosseguir

- [ ] 2. Fase 2 — Testing (Rede de segurança antes de refatorar)
  - [ ] 2.1 Configurar Vitest e estrutura de testes
    - Criar `vitest.config.js` com environment happy-dom, include `tests/**/*.test.js`, coverage v8 para `core/**/*.js`
    - Criar estrutura de diretórios: `tests/unit/core/`, `tests/integration/`, `tests/properties/`
    - _Requisitos: 4.1, 4.5, 4.7_

  - [ ] 2.2 Escrever testes unitários para módulos core existentes
    - Criar `tests/unit/core/EventBus.test.js` — testar pub/sub, on/off/emit, múltiplos listeners
    - Criar `tests/unit/core/FileSystem.test.js` — testar API síncrona atual (readFile, writeFile, mkdir, remove, readdir, stat, exists)
    - Criar `tests/unit/core/AppManager.test.js` — testar carregamento de apps, ciclo de vida
    - Criar `tests/unit/core/BaseApp.test.js` — testar $() DOM scoping, ciclo de vida onRun/onCleanup
    - _Requisitos: 4.2, 4.4, 4.6_

  - [ ] 2.3 Escrever testes de integração para ciclo de vida de app
    - Criar `tests/integration/app-lifecycle.test.js` — simular carregar, iniciar e parar um app completo
    - _Requisitos: 4.3_

  - [ ] 2.4 Checkpoint — Garantir que todos os testes passam
    - Executar `npm run test` e garantir que todos os testes passam
    - Verificar cobertura de código dos módulos core
    - Perguntar ao usuário se há dúvidas antes de prosseguir

- [ ] 3. Fase 3 — Refatoração do FileSystem (sync → async, IndexedDB)
  - [ ] 3.1 Criar wrapper IndexedDB e MetadataCache
    - Criar `core/IndexedDBStore.js` — wrapper para operações IndexedDB com dois object stores: `fs_metadata` (keyPath: path) e `fs_content` (keyPath: path)
    - Criar `core/MetadataCache.js` — cache em memória com Map<string, FileMetadata>, métodos get/set/delete/has/loadFromStore
    - _Requisitos: 7.1, 7.2, 7.3_

  - [ ]* 3.2 Escrever property tests para FileSystem (round-trip string)
    - **Property FS-P1: Round-trip string** — `∀ path, content: string → writeFile(path, content) then readFile(path) === content`
    - **Valida: Requisitos 7.6, 7.20**

  - [ ]* 3.3 Escrever property tests para FileSystem (round-trip binário)
    - **Property FS-P2: Round-trip binário** — `∀ path, content: ArrayBuffer → writeFile(path, content) then readFile(path) ≡ content`
    - **Valida: Requisitos 7.11, 7.12, 7.13, 7.20**

  - [ ]* 3.4 Escrever property tests para FileSystem (mkdir + readdir)
    - **Property FS-P3: mkdir + readdir** — `∀ parent, name → mkdir(parent/name) then name ∈ readdir(parent)`
    - **Valida: Requisitos 7.6, 7.21**

  - [ ]* 3.5 Escrever property tests para FileSystem (remove + exists)
    - **Property FS-P4: remove + exists** — `∀ path existente → remove(path) then exists(path) === false`
    - **Valida: Requisitos 7.6, 7.22**

  - [ ]* 3.6 Escrever property tests para FileSystem (idempotência mkdir, move, copy)
    - **Property FS-P5: Idempotência de mkdir** — `∀ path → mkdir(path, {recursive:true}) twice não lança erro`
    - **Property FS-P6: move preserva conteúdo** — `∀ src, dest, content → writeFile(src, content); move(src, dest) then readFile(dest) === content ∧ exists(src) === false`
    - **Property FS-P7: copy preserva conteúdo** — `∀ src, dest, content → writeFile(src, content); copy(src, dest) then readFile(dest) === content ∧ readFile(src) === content`
    - **Valida: Requisitos 7.6, 7.20**

  - [ ] 3.7 Refatorar FileSystem.js para API assíncrona com IndexedDB
    - Refatorar `core/FileSystem.js` — converter todos os métodos para async (readFile, writeFile, mkdir, remove, readdir, stat, exists, move, copy, find)
    - Integrar com IndexedDBStore para persistência granular por entry
    - Integrar com MetadataCache para operações rápidas de navegação
    - Manter compatibilidade de assinatura (mesmos nomes de métodos e parâmetros)
    - Implementar suporte a conteúdo binário (ArrayBuffer, Blob, Uint8Array) com registro de mimeType no metadata
    - Implementar limites de capacidade (50MB por arquivo, erro descritivo para falta de espaço)
    - _Requisitos: 7.1, 7.2, 7.3, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13_

  - [ ] 3.8 Implementar migração automática localStorage → IndexedDB
    - No `FileSystem.initialize()`, detectar key `unkayOS_filesystem` no localStorage
    - Parsear JSON monolítico e iterar sobre cada entry, gravando metadata e conteúdo separadamente no IndexedDB
    - Após migração completa e verificada, remover dados antigos do localStorage
    - Se migração falhar, manter localStorage intacto para retry no próximo boot
    - _Requisitos: 7.4, 7.5_

  - [ ] 3.9 Implementar eventos de FileSystem via EventBus
    - Emitir eventos: fs:file:created, fs:file:modified, fs:file:deleted, fs:directory:created, fs:directory:deleted, fs:file:moved, fs:file:copied
    - Payload de cada evento: path, tipo de operação, usuário, timestamp
    - _Requisitos: 7.18, 7.19_

  - [ ] 3.10 Implementar stub de enforcement de permissões (ativação na Fase 5)
    - Criar método `_checkPermission(path, operation)` que aceita referência ao PermissionSystem via injeção
    - Sem PermissionSystem injetado, todas as operações são permitidas (comportamento Fase 3)
    - Implementar lógica de parsing de permissões Unix (owner/group/others) e root bypass
    - _Requisitos: 7.14, 7.15, 7.16, 7.17_

  - [ ] 3.11 Migrar apps existentes para API assíncrona do FileSystem
    - Atualizar `apps/terminal/filesystem-commands.js` — adicionar `await` em todas as chamadas ao FileSystem
    - Atualizar `apps/terminal/commands.js` — adicionar `await` onde necessário
    - Atualizar `apps/file-manager/main.js` — migrar operações CRUD para async
    - Atualizar `apps/text-editor/main.js` — migrar readFile/writeFile para async
    - Atualizar demais apps que usam FileSystem (system-info, etc.)
    - _Requisitos: 7.6, 7.7_

  - [ ]* 3.12 Escrever testes unitários para FileSystem refatorado
    - Atualizar `tests/unit/core/FileSystem.test.js` para testar API assíncrona
    - Testar migração localStorage → IndexedDB
    - Testar suporte binário
    - Testar eventos de filesystem
    - _Requisitos: 7.6, 7.11, 7.18, 7.20, 7.21, 7.22_

  - [ ] 3.13 Checkpoint — Garantir que FileSystem funciona end-to-end
    - Garantir que todos os testes passam
    - Verificar que apps migrados funcionam corretamente com API assíncrona
    - Perguntar ao usuário se há dúvidas antes de prosseguir

- [ ] 4. Fase 4 — CSS Isolation + Preservação de Modularidade
  - [ ] 4.1 Criar Vite plugin para CSS scoping
    - Criar `vite-plugin-css-scope.mjs` que transforma seletores CSS de apps adicionando `[data-app-id="{appName}"]` como escopo
    - Ignorar seletores globais (html, body, *, :root) e custom properties
    - Aplicar transformação apenas em arquivos CSS dentro de `apps/`
    - Integrar plugin no `vite.config.js`
    - _Requisitos: 6.1, 6.2, 6.5, 6.6_

  - [ ] 4.2 Implementar CSS scoping em runtime no AppWindowSystem
    - Atualizar `core/AppWindowSystem.js` para adicionar atributo `data-app-instance="{instanceId}"` e `data-app-id="{appName}"` no container de cada instância de app
    - Garantir que CSS scoping funciona em dev (runtime) e em produção (build transform)
    - Garantir acesso a design tokens globais (custom properties em :root)
    - Garantir que múltiplas instâncias do mesmo app recebem estilos independentes
    - _Requisitos: 6.2, 6.3, 6.4_

  - [ ] 4.3 Validar preservação da modularidade de apps
    - Verificar que o padrão config.json + main.js + index.html + style.css + icon.svg continua funcional
    - Verificar que carregamento dinâmico via import() e fetch() funciona sem registro estático
    - Verificar que BaseApp mantém $() DOM scoping, ciclo de vida e acesso a APIs sem alterações
    - Verificar que EventBus continua como mecanismo principal de comunicação
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 4.4 Escrever testes para CSS isolation
    - Testar que seletores de app são escopados corretamente
    - Testar que seletores globais não são transformados
    - Testar que custom properties permanecem acessíveis
    - _Requisitos: 6.1, 6.2, 6.3, 6.5_

  - [ ] 4.5 Checkpoint — Garantir isolamento CSS e modularidade
    - Garantir que todos os testes passam
    - Verificar que apps existentes renderizam corretamente com CSS scoping
    - Perguntar ao usuário se há dúvidas antes de prosseguir

- [ ] 5. Fase 5 — Sistema de Autenticação
  - [ ] 5.1 Criar AuthProviderInterface e AuthManager
    - Criar `core/AuthProviderInterface.js` — classe abstrata com métodos obrigatórios: login, logout, isAuthenticated, getCurrentUser, validateSession, getProviderName, getProviderType
    - Criar `core/AuthManager.js` — orquestrador de providers com: registerProvider (validação de métodos obrigatórios), setActiveProvider, getActiveProvider, getAvailableProviders
    - Emitir eventos via EventBus: auth:provider:registered, auth:provider:changed
    - Implementar proxy methods no AuthManager para o provider ativo (login, logout, isAuthenticated, getCurrentUser)
    - _Requisitos: 13.1, 13.2, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

  - [ ]* 5.2 Escrever property test para validação de registro de provider
    - Testar que providers sem métodos obrigatórios são rejeitados com erro descritivo listando métodos faltantes
    - _Requisitos: 13.7, 13.8_

  - [ ] 5.3 Criar utilitário de hashing de senhas (PBKDF2)
    - Criar `core/utils/passwordHash.js` com funções hashPassword(password, salt?) e verifyPassword(password, storedHash, storedSalt)
    - Usar Web Crypto API (crypto.subtle) com PBKDF2, 100.000 iterações, SHA-256
    - _Requisitos: 11.2_

  - [ ]* 5.4 Escrever property tests para hashing de senhas
    - **Property AUTH-P1: Hash round-trip** — `∀ password → hash(password) then verify(password, hash) === true`
    - **Property AUTH-P2: Hash diferença** — `∀ p1 ≠ p2 → hash(p1) then verify(p2, hash) === false`
    - **Valida: Requisitos 11.2, 11.11**

  - [ ] 5.5 Implementar LocalAuthSystem
    - Criar `core/LocalAuthSystem.js` que implementa AuthProviderInterface com tipo "local"
    - Armazenar dados em IndexedDB (stores: auth_users, auth_sessions)
    - Implementar: login(credentials), logout(), isAuthenticated(), getCurrentUser(), getCurrentSession(), validateSession(), getProviderName(), getProviderType()
    - Implementar lógica de primeiro boot: criar usuário root com senha temporária + prompt obrigatório de redefinição
    - Implementar modo guest com permissões restritas (nível 0)
    - Emitir eventos via EventBus: auth:login, auth:logout, auth:session:expired, auth:user:changed
    - Implementar expiração de sessão configurável
    - Retornar erro genérico em credenciais inválidas (não revelar se é username ou senha)
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 13.3_

  - [ ]* 5.6 Escrever property tests para ciclo login/logout e expiração de sessão
    - **Property AUTH-P3: Login/logout cycle** — `∀ user válido → login(user) then isAuthenticated() === true; logout() then isAuthenticated() === false`
    - **Property AUTH-P4: Session expiry** — `∀ session com expiresAt no passado → validateSession() === false`
    - **Valida: Requisitos 11.4, 11.7, 11.8, 11.9_

  - [ ] 5.7 Implementar UserManager
    - Criar `core/UserManager.js` com operações CRUD: createUser, deleteUser, updateUser, getUser, listUsers
    - Implementar changePassword(username, oldPassword, newPassword) com validação da senha antiga
    - Implementar grupos: createGroup(groupName, permissions), addUserToGroup, removeUserFromGroup
    - Armazenar para cada usuário: uid, username (único, case-insensitive), passwordHash, passwordSalt, role, groups, displayName, createdAt, lastLoginAt, isActive
    - Atribuir role "user" como padrão quando não especificado
    - Negar exclusão do usuário root
    - Armazenar grupos em IndexedDB (store: auth_groups)
    - _Requisitos: 12.1, 12.2, 12.6, 12.8, 12.9, 12.10, 12.11_

  - [ ]* 5.8 Escrever property test para proteção do root e testes unitários do UserManager
    - **Property PERM-P5: Root não deletável** — `∀ tentativa → deleteUser('root') lança erro`
    - Testar CRUD de usuários, changePassword com senha incorreta, criação de grupos
    - **Valida: Requisitos 12.1, 12.8, 12.10, 12.11**

  - [ ] 5.9 Implementar PermissionSystem
    - Criar `core/PermissionSystem.js` com roles hierárquicos: guest (0), user (1), admin (2), root (3)
    - Implementar: hasPermission, hasRole, getUserAccessLevel, canExecute
    - Definir permissões granulares: system:shutdown, system:settings, apps:install, apps:uninstall, files:read, files:write, files:delete, users:manage, users:create, users:delete
    - Implementar herança de permissões via grupos
    - _Requisitos: 12.3, 12.4, 12.5, 12.7_

  - [ ]* 5.10 Escrever property tests para PermissionSystem
    - **Property PERM-P1: Hierarquia de roles** — `∀ action com minRole=N, user com role nível M → M ≥ N ⟹ canExecute === true`
    - **Property PERM-P2: Root bypass** — `∀ action, user com role='root' → canExecute === true`
    - **Property PERM-P3: Guest restrição** — `∀ action com minRole > 0, user guest → canExecute === false`
    - **Property PERM-P4: Group herança** — `∀ user ∈ group com permission P → hasPermission(user, P) === true`
    - **Valida: Requisitos 12.3, 12.4, 12.5, 12.7**

  - [ ] 5.11 Integrar autenticação no SystemManager e BaseApp
    - Atualizar `core/SystemManager.js` — inicializar AuthManager e registrar LocalAuthSystem como provider padrão durante o boot, antes do AppManager
    - Atualizar `core/BaseApp.js` — expor `this.auth` como proxy para AuthManager (isAuthenticated, getCurrentUser, hasPermission, hasRole, getAccessLevel, on, off)
    - Remover `core/AuthSystem.js` antigo e `core/configs/auth-config.js`
    - Manter `auth/callback.html` como scaffold para futuros provedores OAuth
    - _Requisitos: 12.12, 13.3, 13.11_

  - [ ] 5.12 Ativar enforcement de permissões no FileSystem
    - Injetar referência ao PermissionSystem no FileSystem via SystemManager
    - Ativar `_checkPermission` para enforçar permissões de leitura/escrita/execução baseadas no usuário logado
    - Implementar root bypass e verificação owner/group/others
    - _Requisitos: 7.14, 7.15, 7.16, 7.17_

  - [ ]* 5.13 Escrever testes de integração para fluxo de autenticação
    - Criar `tests/integration/auth-flow.test.js` — testar fluxo completo: primeiro boot, login, logout, sessão expirada, modo guest
    - Criar `tests/unit/core/AuthManager.test.js`, `tests/unit/core/LocalAuthSystem.test.js`, `tests/unit/core/UserManager.test.js`, `tests/unit/core/PermissionSystem.test.js`
    - _Requisitos: 11.1, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [ ] 5.14 Checkpoint — Garantir que sistema de autenticação funciona
    - Garantir que todos os testes passam
    - Verificar fluxo de primeiro boot, login, logout, permissões
    - Perguntar ao usuário se há dúvidas antes de prosseguir

- [ ] 6. Fase 6 — App Integration + Services
  - [ ] 6.1 Implementar App Backend Gateway
    - Criar `core/AppBackendGateway.js` com métodos: get, post, put, delete, connectWebSocket, stream, destroy
    - Implementar auto-auth: injetar Authorization header automaticamente se provider ativo tiver sessão
    - Implementar retry com backoff exponencial (padrão 3 tentativas para 5xx e timeout)
    - Implementar handling de 401: solicitar revalidação de sessão ao AuthManager antes de propagar erro
    - Implementar suporte a WebSocket com reconexão automática (backoff exponencial)
    - Implementar suporte a streaming de respostas (ReadableStream) para APIs de IA
    - Implementar cleanup automático no destroy(): abortar requisições pendentes e fechar WebSockets
    - Emitir eventos via EventBus: api:request:start, api:request:complete, api:request:error, api:websocket:connected, api:websocket:disconnected
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_

  - [ ]* 6.2 Escrever property tests para App Backend Gateway
    - **Property GW-P1: Cleanup completo** — `∀ gateway.destroy() → pendingRequests.size === 0 ∧ webSockets.size === 0`
    - **Property GW-P2: Retry bounded** — `∀ request com maxRetries=N → no máximo N+1 tentativas são feitas`
    - **Valida: Requisitos 14.3, 14.7**

  - [ ] 6.3 Integrar App Backend Gateway na BaseApp
    - Atualizar `core/BaseApp.js` — expor `this.api` como instância de AppBackendGateway por app
    - Chamar `this.api.destroy()` automaticamente no onCleanup do app
    - _Requisitos: 14.1, 14.7_

  - [ ] 6.4 Implementar Service Manifest e validação no AppManager
    - Estender schema do config.json com seção "services" (auth, api, ai)
    - Atualizar `core/AppManager.js` — validar Service Manifest antes de iniciar app
    - Verificar requisitos de autenticação (services.auth.required, minRole, permissions) via AuthManager e PermissionSystem
    - Exibir mensagem de erro descritiva se usuário não atender requisitos, sem impedir outros apps
    - Manter retrocompatibilidade: apps sem seção "services" funcionam normalmente
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8_

  - [ ]* 6.5 Escrever testes para Service Manifest e validação
    - Testar validação de manifesto com auth required
    - Testar retrocompatibilidade com apps sem services
    - Testar rejeição de app quando usuário não tem permissão suficiente
    - _Requisitos: 15.4, 15.5, 15.6_

  - [ ] 6.6 Criar Scaffold CLI para novos apps
    - Criar `scripts/scaffold-app.mjs` que gera estrutura completa: config.json, main.js (extends BaseApp com onRun/onCleanup stubs), index.html, style.css (com import de design tokens), icon.svg
    - Gerar config.json com valores padrão válidos (app_name, mode, dimensões, caminhos)
    - Registrar automaticamente o novo app em `apps/apps.json`
    - Abortar se app com mesmo nome já existir
    - Aceitar parâmetro `--mode` (system_window, desktop_ui, custom_ui, headless) com system_window como padrão
    - Aceitar flags `--with-auth` e `--with-api` para gerar seção "services" no config.json
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 15.7_

  - [ ]* 6.7 Escrever testes para Scaffold CLI
    - Testar geração de estrutura completa
    - Testar registro em apps.json
    - Testar aborto quando app já existe
    - Testar flags --mode, --with-auth, --with-api
    - _Requisitos: 8.1, 8.4, 8.5, 8.7_

  - [ ] 6.8 Checkpoint final — Garantir que toda a stack funciona
    - Garantir que todos os testes passam
    - Verificar que apps existentes funcionam com todas as evoluções
    - Verificar que scaffold gera apps funcionais
    - Perguntar ao usuário se há dúvidas

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental entre fases
- Property tests validam propriedades universais de corretude (fast-check)
- Testes unitários validam exemplos específicos e edge cases

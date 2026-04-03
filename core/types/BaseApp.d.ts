/**
 * Type definitions for core/BaseApp.js
 * Classe base que todos os apps do unkayOS estendem.
 */

import type { AppCore } from "./AppCore";

/** APIs padrão injetadas pelo sistema no construtor de BaseApp. */
export interface StandardAPIs {
  setTimeout: typeof globalThis.setTimeout;
  setInterval: typeof globalThis.setInterval;
  clearTimeout: typeof globalThis.clearTimeout;
  clearInterval: typeof globalThis.clearInterval;
  appManager: any;
  fileSystem: any;
  fs: any;
}

/** Schema de um parâmetro aceito por um app. */
export interface ParameterDef {
  type: string;
  required: boolean;
  description?: string;
}

export declare class BaseApp {
  appCore: any;
  instanceId: string;
  appName: string;
  setTimeout: typeof globalThis.setTimeout;
  setInterval: typeof globalThis.setInterval;
  clearTimeout: typeof globalThis.clearTimeout;
  clearInterval: typeof globalThis.clearInterval;
  appManager: any;
  fileSystem: any;
  fs: any;
  appContentRoot: HTMLElement | null;
  desktopElement: HTMLElement | null;

  static parameters: Record<string, ParameterDef>;

  constructor(
    CORE: any,
    standardAPIs: StandardAPIs,
    appContentRoot?: HTMLElement | null,
    desktopElement?: HTMLElement | null,
  );

  /**
   * Busca um elemento dentro do DOM local da instância.
   * @param selector - Seletor CSS.
   */
  $(selector: string): Element | null;

  /**
   * Método de ciclo de vida — chamado quando o app é executado e seu DOM está pronto.
   * @param terminalOutputCallback - Callback para saída no terminal (apps headless).
   * @param appParams - Parâmetros nomeados passados ao iniciar o app.
   */
  onRun(
    terminalOutputCallback?: ((output: string) => void) | null,
    appParams?: Record<string, any>,
  ): void;

  /**
   * Método de ciclo de vida — chamado quando o app é encerrado.
   */
  onCleanup(): Promise<void>;

  /**
   * Registra um atalho de teclado seguro para esta instância.
   * @param keys - Combinação de teclas (ex: 'ctrl+s') ou array de combinações.
   * @param callback - Função chamada quando o atalho é pressionado.
   * @param options - Opções adicionais.
   */
  registerKeyboardShortcut(
    keys: string | string[],
    callback: (event: KeyboardEvent) => void,
    options?: Record<string, any>,
  ): Promise<void>;

  /**
   * Registra um listener de teclado customizado para esta instância.
   * @param eventType - Tipo do evento ('keydown' ou 'keyup').
   * @param listener - Função listener.
   * @param options - Opções adicionais.
   */
  registerKeyboardListener(
    eventType: string,
    listener: (event: KeyboardEvent) => void,
    options?: Record<string, any>,
  ): Promise<void>;

  /**
   * Verifica se esta instância está atualmente ativa (com foco).
   */
  isActive(): Promise<boolean>;

  /**
   * Retorna o texto de ajuda formatado com base no schema de parâmetros.
   */
  getHelpText(): string;
}

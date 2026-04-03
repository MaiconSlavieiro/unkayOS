/**
 * Type definitions for core/SystemManager.js
 * Gerenciador centralizado de estado e ciclo de vida de todos os sistemas singleton.
 */

import type { EventBus } from "./EventBus";
import type { FileSystem } from "./FileSystem";
import type { AppManager } from "./AppManager";

/** Mapa de sistemas gerenciados pelo SystemManager. */
export interface SystemsMap {
  eventBus: EventBus;
  fileSystem: FileSystem;
  fs: any;
  keyboardManager: any;
  windowLayerManager: any;
  dragManager: any;
  positionManager: any;
  loadingManager: any;
  loadingUI: any;
  lazyResourceLoader: any;
  authSystem: any | null;
  appManager: AppManager | null;
}

/** Estatísticas do sistema retornadas por getSystemStats(). */
export interface SystemStats {
  isInitialized: boolean;
  isInitializing: boolean;
  systemsLoaded: string[];
  runningApps: number;
  eventListeners: Array<{ event: string; count: number }>;
}

export declare class SystemManager {
  isInitialized: boolean;
  isInitializing: boolean;
  initializationPromise: Promise<void> | null;
  systems: SystemsMap;
  config: {
    desktop: HTMLElement | null;
    appConfigs: any[];
  };

  constructor();

  /**
   * Inicializa todos os sistemas na ordem correta.
   * @param desktopElement - Elemento DOM do desktop.
   */
  initialize(desktopElement: HTMLElement): Promise<void>;

  /**
   * Obtém uma instância de sistema pelo nome.
   * @param systemName - Nome do sistema.
   */
  getSystem<K extends keyof SystemsMap>(systemName: K): SystemsMap[K];
  getSystem(systemName: string): any | null;

  /** Obtém todos os sistemas (cópia somente leitura). */
  getAllSystems(): SystemsMap;

  /**
   * Registra um listener de evento do sistema.
   * @param event - Nome do evento.
   * @param callback - Callback do evento.
   * @param listenerId - ID único do listener (opcional).
   * @returns ID do listener registrado.
   */
  onSystemEvent(
    event: string,
    callback: (data?: any) => void,
    listenerId?: string | null,
  ): string;

  /**
   * Remove um listener de evento do sistema.
   * @param event - Nome do evento.
   * @param listenerId - ID do listener.
   */
  offSystemEvent(event: string, listenerId: string): void;

  /** Executa shutdown limpo de todos os sistemas. */
  shutdown(): Promise<void>;

  /** Obtém estatísticas do sistema. */
  getSystemStats(): SystemStats;
}

/** Instância singleton global do SystemManager. */
export declare const systemManager: SystemManager;

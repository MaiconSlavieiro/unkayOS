/**
 * Type definitions for core/AppManager.js
 * Sistema responsável pelo ciclo de vida dos apps.
 */

/** Configuração base de um app vinda de apps.json. */
export interface BaseAppConfig {
  id: string;
  path: string;
}

/** Configuração completa de um app após merge com config.json. */
export interface AppData {
  id: string;
  app_name: string;
  basePath: string;
  icon_url: string;
  dirApp: string | null;
  jsFile: string | null;
  styleFile: string | null;
  mode: "system_window" | "custom_ui" | "desktop_ui" | "headless";
  width: string;
  height: string;
  x_position: string;
  y_position: string;
  minWidth: number;
  minHeight: number;
  autorun: boolean;
  hidden: boolean;
  _cachedParametersSchema?: Record<string, any> | null;
}

/** Informações de um app em execução. */
export interface RunningAppInfo {
  CORE: any;
  UI: any;
  ICON: HTMLElement | null;
}

export declare class AppManager {
  focusHistory: string[];
  desktopElement: HTMLElement;
  appsOnToolBarElement: HTMLElement | null;
  baseAppConfigs: BaseAppConfig[];
  loadedAppDetails: Map<string, AppData>;
  runningApps: Map<string, RunningAppInfo>;
  activeAppInstanceId: string | null;

  constructor(
    desktopElement: HTMLElement,
    appsOnToolBarElement: HTMLElement | null,
    appConfigs: BaseAppConfig[],
  );

  /** Carrega configurações detalhadas de todos os apps. */
  loadAppConfigs(): Promise<void>;

  /** Registra listeners de eventos no EventBus. */
  registerEventBusListeners(): void;

  /** Inicia apps marcados com autorun. */
  initAutorunApps(): void;

  /**
   * Inicia um app pelo ID.
   * @param appId - ID do app.
   * @param appParams - Parâmetros passados ao app.
   * @returns instanceId do app iniciado ou null em caso de erro.
   */
  runApp(appId: string, appParams?: any[]): Promise<string | null>;

  /** Verifica se um app está em execução. */
  isAppRunning(appId: string): boolean;

  /** Define qual app está em primeiro plano (foco). */
  defineFirstPlaneApp(instanceId: string): void;

  /** Para um app em execução. */
  stopApp(instanceId: string): Promise<void>;

  /** Para todos os apps de janela e headless. */
  killAll(): Promise<number>;

  /**
   * Retorna o schema de parâmetros aceitos por um app.
   * @param appId - ID do app.
   */
  getAppParametersSchema(appId: string): Record<string, any> | null;
}

/**
 * Type definitions for core/FileSystem.js
 * Sistema de arquivos virtual do unkayOS (API síncrona atual).
 */

/** Metadata de um entry no sistema de arquivos. */
export interface FSEntry {
  type: "file" | "directory";
  name: string;
  parent?: string;
  children?: string[];
  content?: string;
  permissions: string;
  owner: string;
  created: string;
  modified: string;
  size: number;
}

/** Entry retornado por readdir, com path incluso. */
export interface FSEntryWithPath extends FSEntry {
  path: string;
}

/** Opções para writeFile. */
export interface WriteFileOptions {
  permissions?: string;
  owner?: string;
}

/** Opções para mkdir. */
export interface MkdirOptions {
  force?: boolean;
  recursive?: boolean;
  permissions?: string;
  owner?: string;
}

/** Opções para remove. */
export interface RemoveOptions {
  force?: boolean;
  recursive?: boolean;
}

/** Opções para copy. */
export interface CopyOptions {
  force?: boolean;
  recursive?: boolean;
}

/** Opções para find. */
export interface FindOptions {
  recursive?: boolean;
}

/** Resultado de find. */
export interface FindResult {
  path: string;
  name: string;
  type: "file" | "directory";
}

export declare class FileSystem {
  STORAGE_KEY: string;
  currentPath: string;
  separator: string;

  constructor();

  /** Inicializa o sistema de arquivos com estrutura padrão. */
  initializeFileSystem(): void;

  /** Cria a estrutura do sistema de arquivos baseada na estrutura real do unkayOS. */
  createRealFileSystemStructure(): Record<string, FSEntry>;

  /** Carrega o sistema de arquivos do localStorage. */
  loadFileSystem(): Record<string, FSEntry>;

  /** Salva o sistema de arquivos no localStorage. */
  saveFileSystem(fs: Record<string, FSEntry>): void;

  /** Normaliza um caminho, resolvendo . e .. */
  normalizePath(path: string): string;

  /** Resolve um caminho relativo para absoluto. */
  resolvePath(path: string): string;

  /** Verifica se um caminho existe. */
  exists(path: string): boolean;

  /** Obtém informações sobre um arquivo ou diretório. */
  stat(path: string): FSEntryWithPath;

  /** Lista o conteúdo de um diretório. */
  readdir(path?: string): FSEntryWithPath[];

  /** Lê o conteúdo de um arquivo. */
  readFile(path: string): string;

  /** Escreve conteúdo em um arquivo. */
  writeFile(path: string, content: string, options?: WriteFileOptions): void;

  /** Cria um diretório. */
  mkdir(path: string, options?: MkdirOptions): void;

  /** Remove um arquivo ou diretório. */
  remove(path: string, options?: RemoveOptions): void;

  /** Move/renomeia um arquivo ou diretório. */
  move(srcPath: string, destPath: string): void;

  /** Copia um arquivo ou diretório. */
  copy(srcPath: string, destPath: string, options?: CopyOptions): void;

  /** Obtém o caminho do diretório pai. */
  getParentPath(path: string): string | null;

  /** Obtém o nome do arquivo/diretório. */
  getBaseName(path: string): string;

  /** Muda o diretório atual. */
  changeDirectory(path: string): string;

  /** Obtém o diretório atual. */
  getCurrentDirectory(): string;

  /** Busca arquivos por padrão (glob-like). */
  find(pattern: string, startPath?: string, options?: FindOptions): FindResult[];

  /** Sincroniza o sistema de arquivos virtual com arquivos reais do projeto. */
  syncWithRealFiles(): Promise<{ success: boolean; message?: string; error?: string }>;

  /** Reseta o sistema de arquivos e recria com estrutura atual. */
  resetFileSystem(): { success: boolean; message: string };
}

/** Instância singleton global do FileSystem. */
export declare const fileSystem: FileSystem;

/** API simplificada para uso em aplicativos. */
export declare const fs: {
  ls(path: string): FSEntryWithPath[];
  cd(path: string): string;
  pwd(): string;
  mkdir(path: string, options?: MkdirOptions): void;
  rmdir(path: string, options?: RemoveOptions): void;

  cat(path: string): string;
  touch(path: string, content?: string): void;
  rm(path: string, options?: RemoveOptions): void;
  cp(src: string, dest: string, options?: CopyOptions): void;
  mv(src: string, dest: string): void;

  exists(path: string): boolean;
  stat(path: string): FSEntryWithPath;
  find(pattern: string, startPath?: string, options?: FindOptions): FindResult[];

  normalize(path: string): string;
  resolve(path: string): string;
  basename(path: string): string;
  dirname(path: string): string | null;
};

export interface IIpcRenderer {
  send(channel: string, ...args: any[]): void;
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  off(channel: string, listener: (...args: any[]) => void): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
  interface Window {
    ipcRenderer: IIpcRenderer;
  }
}

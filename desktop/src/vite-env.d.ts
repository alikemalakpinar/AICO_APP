/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    selectFile: (options?: any) => Promise<string>;
    saveFile: (options?: any) => Promise<string>;
    showConfirm: (options: { title?: string; message: string }) => Promise<boolean>;
    onNavigate: (callback: (path: string) => void) => void;
    platform: string;
    isElectron: boolean;
  };
}

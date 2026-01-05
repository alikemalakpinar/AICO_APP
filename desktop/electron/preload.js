const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),

  // Dialogs
  showConfirm: (options) => ipcRenderer.invoke('show-confirm', options),

  // Navigation listener
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  // Platform info
  platform: process.platform,
  isElectron: true
});

// Remove any contextBridge warning
window.addEventListener('DOMContentLoaded', () => {
  console.log('AICO ERP Desktop initialized');
});

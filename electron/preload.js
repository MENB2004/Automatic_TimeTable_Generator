const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process if needed
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});

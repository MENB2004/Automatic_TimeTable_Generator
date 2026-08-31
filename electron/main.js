const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Disable GPU sandbox warnings and diagnostic logging on Windows graphics drivers
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('log-level', '3');

let mainWindow;
let server;

function startStaticServer(distPath, callback) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
  };

  server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distPath, reqUrl);

    // Default to index.html for SPA routing or missing files
    if (filePath.endsWith('/') || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        });
        res.end(data);
      }
    });
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    callback(`http://127.0.0.1:${port}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ATG - Automatic Timetable Generator',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#0a0e1a',
  });

  const distPath = path.join(__dirname, '..', 'dist');

  startStaticServer(distPath, (serverUrl) => {
    mainWindow.loadURL(serverUrl);
  });

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external HTTP/HTTPS links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('127.0.0.1')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });

  // Build application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Schedule',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript("window.location.hash = '#/Generator';");
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ATG',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ATG',
              message: 'ATG - Automatic Timetable Generator',
              detail:
                'Version 1.0.0\n\nSmart, constraint-based school timetable generator.\nBuilt with React Native + Electron.\n\n© 2026 ATG Timetable Generator',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// Electron app lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

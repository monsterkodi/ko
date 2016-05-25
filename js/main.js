(function() {
  var BrowserWindow, Menu, Tray, app, clipboard, createWindow, debug, electron, execute, fs, ipc, log, open, prefs, resolve, saveBounds, showWindow, toggleWindow, tray, win;

  electron = require('electron');

  resolve = require('./tools/resolve');

  prefs = require('./tools/prefs');

  fs = require('fs');

  execute = require('./execute');

  app = electron.app;

  BrowserWindow = electron.BrowserWindow;

  Tray = electron.Tray;

  Menu = electron.Menu;

  clipboard = electron.clipboard;

  ipc = electron.ipcMain;

  win = void 0;

  tray = void 0;

  debug = false;

  open = true;

  log = function() {
    return console.log(([].slice.call(arguments, 0)).join(" "));
  };

  ipc.on('execute', (function(_this) {
    return function(event, arg) {
      return event.sender.send('execute-result', execute.execute(arg));
    };
  })(this));

  ipc.on('bounds', (function(_this) {
    return function(event, arg) {
      return saveBounds();
    };
  })(this));

  toggleWindow = function() {
    if (win != null ? win.isVisible() : void 0) {
      win.hide();
      return app.dock.hide();
    } else {
      return showWindow();
    }
  };

  showWindow = function() {
    if (win != null) {
      win.show();
      return app.dock.show();
    } else {
      return createWindow();
    }
  };

  createWindow = function() {
    var bounds;
    win = new BrowserWindow({
      width: 1000,
      height: 1200,
      minWidth: 120,
      minHeight: 120,
      useContentSize: true,
      backgroundColor: '#181818',
      fullscreen: false,
      show: true,
      titleBarStyle: 'hidden'
    });
    bounds = prefs.get('bounds');
    if (bounds != null) {
      win.setBounds(bounds);
    }
    win.loadURL("file://" + __dirname + "/../index.html");
    if (debug) {
      win.webContents.openDevTools();
    }
    app.dock.show();
    win.on('closed', function() {
      return win = null;
    });
    win.on('close', function(event) {
      win.hide();
      app.dock.hide();
      return event.preventDefault();
    });
    return win;
  };

  saveBounds = function() {
    if (win != null) {
      return prefs.set('bounds', win.getBounds());
    }
  };

  app.on('ready', function() {
    tray = new Tray(__dirname + "/../img/menu.png");
    tray.on('click', toggleWindow);
    if (app.dock) {
      app.dock.hide();
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: app.getName(),
        submenu: [
          {
            label: 'Save',
            accelerator: 'Command+S',
            click: function() {
              return log('save');
            }
          }, {
            label: 'Close Window',
            accelerator: 'Command+W',
            click: function() {
              return win.close();
            }
          }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
              saveBounds();
              return app.exit(0);
            }
          }
        ]
      }
    ]));
    prefs.init((app.getPath('userData')) + "/kandis.json", {
      shortcut: 'F2'
    });
    electron.globalShortcut.register(prefs.get('shortcut'), showWindow);
    electron.globalShortcut.register('Command+Alt+I', function() {
      return win != null ? win.webContents.openDevTools() : void 0;
    });
    execute.init();
    if (open) {
      return showWindow();
    }
  });

}).call(this);

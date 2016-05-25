# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

electron      = require 'electron'
resolve       = require './tools/resolve'
prefs         = require './tools/prefs'
fs            = require 'fs'
execute       = require './execute'
app           = electron.app
BrowserWindow = electron.BrowserWindow
Tray          = electron.Tray
Menu          = electron.Menu
clipboard     = electron.clipboard
ipc           = electron.ipcMain
win           = undefined
tray          = undefined
debug         = false
open          = true

log = -> console.log ([].slice.call arguments, 0).join " "

#00000000  000   000  00000000   0000000  000   000  000000000  00000000
#000        000 000   000       000       000   000     000     000     
#0000000     00000    0000000   000       000   000     000     0000000 
#000        000 000   000       000       000   000     000     000     
#00000000  000   000  00000000   0000000   0000000      000     00000000

ipc.on 'execute', (event, arg) => event.sender.send 'execute-result', execute.execute arg
ipc.on 'bounds',  (event, arg) => saveBounds()

#000   000  000  000   000  0000000     0000000   000   000
#000 0 000  000  0000  000  000   000  000   000  000 0 000
#000000000  000  000 0 000  000   000  000   000  000000000
#000   000  000  000  0000  000   000  000   000  000   000
#00     00  000  000   000  0000000     0000000   00     00

toggleWindow = ->
    if win?.isVisible()
        win.hide()    
        app.dock.hide()        
    else
        showWindow()

showWindow = ->
    if win?
        win.show()
        app.dock.show()
    else
        createWindow()
    
createWindow = ->
    win = new BrowserWindow
        width:           1000
        height:          1200
        minWidth:        120
        minHeight:       120
        useContentSize:  true
        backgroundColor: '#181818'
        fullscreen:      false
        show:            true
        titleBarStyle:   'hidden'
        
    bounds = prefs.get 'bounds'
    win.setBounds bounds if bounds?
        
    win.loadURL "file://#{__dirname}/../index.html"
    win.webContents.openDevTools() if debug
    app.dock.show()
    win.on 'closed', -> win = null
    win.on 'close', (event) ->
        win.hide()
        app.dock.hide()
        event.preventDefault()
    win

saveBounds = ->
    if win?
        prefs.set 'bounds', win.getBounds()
        
#00000000   00000000   0000000   0000000    000   000
#000   000  000       000   000  000   000   000 000 
#0000000    0000000   000000000  000   000    00000  
#000   000  000       000   000  000   000     000   
#000   000  00000000  000   000  0000000       000   

app.on 'ready', -> 
    
    tray = new Tray "#{__dirname}/../img/menu.png"
    tray.on 'click', toggleWindow
    app.dock.hide() if app.dock
    
    Menu.setApplicationMenu Menu.buildFromTemplate [
        label: app.getName()
        submenu: [
            label: 'Save'
            accelerator: 'Command+S'
            click: -> log 'save'
        ,
            label: 'Close Window'
            accelerator: 'Command+W'
            click: -> win.close()
        ,
            label: 'Quit'
            accelerator: 'Command+Q'
            click: -> 
                saveBounds()
                app.exit 0
        ]
    ]
        
    prefs.init "#{app.getPath('userData')}/kandis.json",
        shortcut: 'F2'

    electron.globalShortcut.register prefs.get('shortcut'), showWindow
    electron.globalShortcut.register 'Command+Alt+I', () -> win?.webContents.openDevTools()
    
    execute.init()
        
    if open
        showWindow()
        
            
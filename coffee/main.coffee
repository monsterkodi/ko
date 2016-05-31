# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

resolve       = require './tools/resolve'
prefs         = require './tools/prefs'
log           = require './tools/log'
{first,del}   = require './tools/tools'
execute       = require './execute'
fs            = require 'fs'
noon          = require 'noon'
electron      = require 'electron'
app           = electron.app
BrowserWindow = electron.BrowserWindow
Tray          = electron.Tray
Menu          = electron.Menu
clipboard     = electron.clipboard
ipc           = electron.ipcMain
dialog        = electron.dialog
currentFile   = undefined
win           = undefined
tray          = undefined

#  0000000   00000000    0000000    0000000
# 000   000  000   000  000        000     
# 000000000  0000000    000  0000  0000000 
# 000   000  000   000  000   000       000
# 000   000  000   000   0000000   0000000 

pkg   = require "../package.json"
args  = require('karg') """
#{pkg.name}
    arglist  . ? argument list           . ** .
    show     . ? open window on startup  . = true
    debug    . ? open developer tools    . = false . - D
    verbose  . ? log more                . = false
version  #{pkg.version}
"""
if args.verbose
    log noon.stringify args, colors:true


# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

addToRecent = (file) ->
    recent = prefs.get 'recentFiles', []
    del recent, file
    recent.unshift file
    log 'recent', recent
    prefs.set 'recentFiles', recent
    
mostRecentFile = -> first prefs.get 'recentFiles', []

prefs.init "#{app.getPath('userData')}/kandis.json",
    shortcut: 'F2'

if args.arglist.length
    currentFile = resolve args.arglist[0]
else
    currentFile = mostRecentFile()

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'execute',   (event, arg) => event.sender.send 'executeResult', execute.execute arg
ipc.on 'bounds',         (event) => saveBounds()
ipc.on 'toggleDevTools', (event) => win?.webContents.toggleDevTools()
ipc.on 'reloadWindow',   (event) => 
    dev = win?.webContents.isDevToolsOpened()
    if dev
        win.webContents.closeDevTools()
        setTimeout win.webContents.reloadIgnoringCache, 100
    else
        win?.webContents.reloadIgnoringCache()

# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000

openFile = ->
    dialog.showOpenDialog win,
        title: "Open File"
        defaultPath: resolve '.'
        properties: ['openFile']
        filters: [
                name: 'Coffee-Script', extensions: ['coffee']
                name: 'All Files', extensions: ['*']
        ]
        , (files) => 
            if files.length
                currentFile = resolve files[0]
                addToRecent currentFile
                win?.webContents.send 'openFile', files[0]

saveFileAs = ->
    dialog.showSaveDialog win,
        title: "Save File As"
        defaultPath: currentFile
        properties: ['openFile']
        filters: [
                name: 'Coffee-Script', extensions: ['coffee']
                name: 'All Files', extensions: ['*']
        ]
        , (filename) => 
            if filename
                currentFile = filename
                addToRecent currentFile
                saveFile()
                
saveFile = ->
    log 'saveFile', currentFile
    win?.webContents.send 'saveFile', currentFile
    
# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

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
    win.webContents.openDevTools() if args.debug
    app.dock.show()
    win.on 'closed', -> win = null
    win.on 'close', (event) ->
        win.hide()
        app.dock.hide()
        event.preventDefault()
        
    if currentFile
        win.webContents.on 'dom-ready', ->
            win.webContents.send 'openFile', currentFile
    win

saveBounds = ->
    if win?
        prefs.set 'bounds', win.getBounds()
        
# 00000000   00000000   0000000   0000000    000   000
# 000   000  000       000   000  000   000   000 000 
# 0000000    0000000   000000000  000   000    00000  
# 000   000  000       000   000  000   000     000   
# 000   000  00000000  000   000  0000000       000   

app.on 'ready', -> 
    
    tray = new Tray "#{__dirname}/../img/menu.png"
    tray.on 'click', toggleWindow
    app.dock.hide() if app.dock
    
    # 00     00  00000000  000   000  000   000
    # 000   000  000       0000  000  000   000
    # 000000000  0000000   000 0 000  000   000
    # 000 0 000  000       000  0000  000   000
    # 000   000  00000000  000   000   0000000 
    
    Menu.setApplicationMenu Menu.buildFromTemplate [
        label: app.getName()
        submenu: [
            label: 'Open ...'
            accelerator: 'Command+O'
            click: openFile 
        ,            
            label: 'Save'
            accelerator: 'Command+S'
            click: saveFile
        ,            
            label: 'Save As ...'
            accelerator: 'Command+Shift+S'
            click: saveFileAs
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
        
    electron.globalShortcut.register prefs.get('shortcut'), showWindow
    
    execute.init()
        
    if args.show or currentFile
        showWindow()
                
            
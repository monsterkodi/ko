# 00     00   0000000   000  000   000  00     00  00000000  000   000  000   000
# 000   000  000   000  000  0000  000  000   000  000       0000  000  000   000
# 000000000  000000000  000  000 0 000  000000000  0000000   000 0 000  000   000
# 000 0 000  000   000  000  000  0000  000 0 000  000       000  0000  000   000
# 000   000  000   000  000  000   000  000   000  00000000  000   000   0000000 

fs    = require 'fs'
path  = require 'path'
prefs = require './tools/prefs'
log   = require './tools/log'
pkg   = require '../package.json'
Menu  = require('electron').Menu

class MainMenu
    
    @init: (main) -> 
    
        recent = []
        for f in prefs.get 'recentFiles', []
            if fs.existsSync f
                recent.unshift 
                    label: path.basename(f) + ' - ' + path.dirname(f)
                    path: f
                    click: (i) -> main.loadFile i.path
        if recent.length
            recent.push
                type: 'separator'
            recent.push
                label: 'Clear List'
                click: (i) -> 
                    prefs.set 'recentFiles', []
                    MainMenu.init main
            
        Menu.setApplicationMenu Menu.buildFromTemplate [
            
            label: pkg.name   
            submenu: [     
                label:       "About #{pkg.name}"
                accelerator: 'CmdOrCtrl+.'
                click:        main.showAbout
            ,
                type: 'separator'
            ,
                label:       "Hide #{pkg.name}"
                accelerator: 'Command+H'
                click:       main.hideWindows
            ,
                label:       'Hide Others'
                accelerator: 'Command+Alt+H'
                role:        'hideothers'
            ,
                type: 'separator'
            ,
                label:       'Quit'
                accelerator: 'Command+Q'
                click:       main.quit
            ]
        ,
            ###
            00000000  000  000      00000000
            000       000  000      000     
            000000    000  000      0000000 
            000       000  000      000     
            000       000  0000000  00000000
            ###
            label: 'File'
            role: 'file'
            submenu: [
                label:       'New File'
                accelerator: 'Command+N'
                click:       => main.createWindow()
            ,
                label:       'New Window'
                accelerator: 'Command+Shift+N'
                click:       (i,win) => win?.webContents.send "cloneFile"
            ,
                label:       'Open...'
                accelerator: 'CmdOrCtrl+O'
                click:       (i,win) => win?.webContents.send "openFile"
            ,
                label:       'Open Recent'
                submenu:     recent
            ,
                label:       'Save'
                accelerator: 'Command+S'
                click:       (i,win) => win?.webContents.send 'saveFile'
            ,            
                label:       'Save As ...'
                accelerator: 'Command+Shift+S'
                click:       (i,win) => win?.webContents.send 'saveFileAs'
            ,
            
                type: 'separator'
            ,
                label:       'Reload'
                accelerator: 'CmdOrCtrl+R'
                click:       (i,win) => win?.webContents.send "reloadFile"
            ,
                label:       'Close Window'
                accelerator: 'Command+W'
                click:       (i,win) -> win?.close()
            ]
        ,    
            ###
            00000000  0000000    000  000000000
            000       000   000  000     000   
            0000000   000   000  000     000   
            000       000   000  000     000   
            00000000  0000000    000     000   
            ###
            label: "Edit",
            submenu: [
                label:       "Undo"
                accelerator: "CmdOrCtrl+Z"
                selector:    "undo:" 
            ,
                label:       "Redo"
                accelerator: "Shift+CmdOrCtrl+Z"
                selector:    "redo:" 
            ,
                type: "separator" 
            ,
                label:       "Cut"
                accelerator: "CmdOrCtrl+X"
                selector:    "cut:" 
            ,
                label:       "Copy"
                accelerator: "CmdOrCtrl+C"
                selector:    "copy:" 
            ,
                label:       "Paste"
                accelerator: "CmdOrCtrl+V"
                selector:    "paste:"
            ]
        ,        
            ###
            000   000  000  000   000  0000000     0000000   000   000
            000 0 000  000  0000  000  000   000  000   000  000 0 000
            000000000  000  000 0 000  000   000  000   000  000000000
            000   000  000  000  0000  000   000  000   000  000   000
            00     00  000  000   000  0000000     0000000   00     00
            ###
            label: 'Window'
            role: 'window'
            submenu: [
                label:       'Minimize'
                accelerator: 'Cmd+M'
                click:       (i,win) -> win?.minimize()
            ,
                label:       'Maximize'
                accelerator: 'Cmd+Shift+m'
                click:       (i,win) -> win?.maximize()
            ,
                type: 'separator'
            ,                            
                label:       'Bring All to Front'
                accelerator: 'Alt+Cmd+`'
                role:        'front'
            ,
                label:       'Cycle Through Windows'
                accelerator: 'CmdOrCtrl+`'
                click:       (i,win) -> main.focusNextWindow win
            ,
                type: 'separator'
            ,   
                label:       'Reload Window'
                accelerator: 'Ctrl+Alt+Cmd+L'
                click:       (i,win) -> main.reloadWin win
            ]
        ,        
            label: 'Help'
            role: 'help'
            submenu: []            
        ]

module.exports = MainMenu

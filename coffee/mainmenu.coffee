# 00     00   0000000   000  000   000  00     00  00000000  000   000  000   000
# 000   000  000   000  000  0000  000  000   000  000       0000  000  000   000
# 000000000  000000000  000  000 0 000  000000000  0000000   000 0 000  000   000
# 000 0 000  000   000  000  000  0000  000 0 000  000       000  0000  000   000
# 000   000  000   000  000  000   000  000   000  00000000  000   000   0000000 

{
unresolve
}     = require './tools/tools'
prefs = require './tools/prefs'
log   = require './tools/log'
pkg   = require '../package.json'
fs    = require 'fs'
path  = require 'path'
Menu  = require('electron').Menu

class MainMenu
    
    @init: (main) -> 
        
        fileLabel = (f) -> 
            return path.basename(f) + ' - ' + unresolve path.dirname(f) if f?
            "untitled"
    
        recent = []
        for f in prefs.get 'recentFiles', []
            if fs.existsSync f
                recent.unshift 
                    label: fileLabel f
                    path: f
                    click: (i) -> main.createWindow i.path
        if recent.length
            recent.push
                type: 'separator'
            recent.push
                label: 'Clear List'
                click: (i) -> 
                    prefs.set 'recentFiles', []
                    MainMenu.init main

        Menu.setApplicationMenu Menu.buildFromTemplate [
            
            # 000   000   0000000 
            # 000  000   000   000
            # 0000000    000   000
            # 000  000   000   000
            # 000   000   0000000 
            
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
            ,
                label:       'Close All Windows And Quit'
                accelerator: 'Command+Alt+Q'
                click:       main.closeWindowsAndQuit
            ]
        ,
            # 00000000  000  000      00000000
            # 000       000  000      000     
            # 000000    000  000      0000000 
            # 000       000  000      000     
            # 000       000  0000000  00000000
            
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
                label:       'Open In New Window...'
                accelerator: 'CmdOrCtrl+Shift+O'
                click:       (i,win) => win?.webContents.send "openFile", newWindow: true
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
                click:       (i,win) -> main.closeWindow win
            ]
        ,        
            # 000   000  000  000   000  0000000     0000000   000   000
            # 000 0 000  000  0000  000  000   000  000   000  000 0 000
            # 000000000  000  000 0 000  000   000  000   000  000000000
            # 000   000  000  000  0000  000   000  000   000  000   000
            # 00     00  000  000   000  0000000     0000000   00     00
            
            label: 'Window'
            submenu: [
                label:       'Minimize'
                accelerator: 'Alt+Cmd+M'
                click:       (i,win) -> win?.minimize()
            ,
                label:       'Maximize'
                accelerator: 'Cmd+Shift+m'
                click:       (i,win) -> main.toggleMaximize win
            ,
                type: 'separator'
            ,                            
                label:       'Close All Windows'
                accelerator: 'Alt+Cmd+W'
                click:       main.closeWindows
            ,
                label:       'Close Other Windows'
                accelerator: 'CmdOrCtrl+Shift+w'
                click:       main.closeOtherWindows
            ,
                type: 'separator'
            ,                            
                label:       'Bring All to Front'
                accelerator: 'Alt+Cmd+`'
                role:        'front'
            ,
                label:       'Arrange'
                accelerator: 'Alt+Cmd+A'
                click:       main.arrangeWindows
            ,
                label:       'Cycle Through Windows'
                accelerator: 'CmdOrCtrl+`'
                click:       (i,win) -> main.activateNextWindow win
            ,
                type: 'separator'
            ,   
                label:       'Reload Window'
                accelerator: 'Ctrl+Alt+Cmd+L'
                click:       (i,win) -> main.reloadWin win
            ,                
                label:       'Toggle FullScreen'
                accelerator: 'Ctrl+Command+Alt+F'
                click:       (i,win) -> win?.setFullScreen !win.isFullScreen()
            ]
        ,        
            # 000   000  00000000  000      00000000 
            # 000   000  000       000      000   000
            # 000000000  0000000   000      00000000 
            # 000   000  000       000      000      
            # 000   000  00000000  0000000  000      
            
            label: 'Help'
            role: 'help'
            submenu: []            
        ]

module.exports = MainMenu

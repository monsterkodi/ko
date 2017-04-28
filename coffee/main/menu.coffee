
# 00     00  00000000  000   000  000   000
# 000   000  000       0000  000  000   000
# 000000000  0000000   000 0 000  000   000
# 000 0 000  000       000  0000  000   000
# 000   000  00000000  000   000   0000000 

{ unresolve, prefs, fs, post, path, log
}     = require 'kxk'
pkg   = require '../../package.json'
AppMenu = require('electron').Menu

class Menu
    
    @init: (main) ->
        
        fileLabel = (f) ->
            return path.basename(f) + ' - ' + unresolve path.dirname(f) if f?
            'untitled'
    
        recent = []
        for f in prefs.get 'recentFiles', []
            if fs.existsSync f
                recent.unshift
                    label: fileLabel f
                    path: f
                    click: (i) -> main.createWindow file:i.path
        if recent.length
            recent.push
                type: 'separator'
            recent.push
                label: 'Clear List'
                click: (i) ->
                    prefs.set 'recentFiles', []
                    Menu.init main

        AppMenu.setApplicationMenu AppMenu.buildFromTemplate [
            
            # 000   000   0000000 
            # 000  000   000   000
            # 0000000    000   000
            # 000  000   000   000
            # 000   000   0000000 
            
            label: pkg.name   
            submenu: [     
                label:       "About #{pkg.productName}"
                accelerator: 'Alt+.'
                click:        main.showAbout
            ,
                type: 'separator'
            ,
                label:       "Hide #{pkg.productName}"
                accelerator: 'Command+H'
                role:        'hide'
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
            # 00000000  000  000      00000000
            # 000       000  000      000     
            # 000000    000  000      0000000 
            # 000       000  000      000     
            # 000       000  0000000  00000000
            
            label: 'File'
            role: 'file'
            submenu: [
                label:       'New Tab'
                accelerator: 'Command+N'
                click:       (i,win) -> post.toWin win.id, "newTabWithFile"
            ,
                label:       'New Window'
                accelerator: 'Command+Shift+N'
                click:       (i,win) -> post.toWin win.id, "cloneFile"
            ,
                type: 'separator'
            ,
                label:       'Open...'
                accelerator: 'CmdOrCtrl+O'
                click:       (i,win) -> post.toWin win.id, "openFile"
            ,
                label:       'Open In New Window...'
                accelerator: 'CmdOrCtrl+Shift+O'
                click:       (i,win) -> post.toWin win.id, "openFile", newWindow: true
            ,
                label:       'Open Recent'
                submenu:     recent
            ,
                type: 'separator'
            ,
                label:       'Save'
                accelerator: 'Command+S'
                click:       (i,win) -> post.toWin win.id, 'saveFile'
            ,            
                label:       'Save As ...'
                accelerator: 'Command+Shift+S'
                click:       (i,win) -> post.toWin win.id, 'saveFileAs'
            ,
                type: 'separator'
            ,
                label:       'Reload'
                accelerator: 'CmdOrCtrl+R'
                click:       (i,win) -> post.toWin win.id, 'reloadFile'
            ,
                label:       'Close Tab or Window'
                accelerator: 'Command+W'
                click:       (i,win) -> post.toWin win.id, 'closeTabOrWindow'
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
                click:       (i,win) -> post.toWin win.id, 'reloadWin'
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

module.exports = Menu

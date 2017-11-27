###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000 
###

{ fileList, unresolve, prefs, fs, post, path, os, log } = require 'kxk'

pkg      = require '../../package.json'
electron = require 'electron'
AppMenu  = electron.Menu
MenuItem = electron.MenuItem

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
                    click: (i, win) -> post.toWin win.id, 'newTabWithFile', i.path
        if recent.length
            recent.push
                type: 'separator'
            recent.push
                label: 'Clear List'
                click: (i) ->
                    prefs.set 'recentFiles', []
                    Menu.init main

        menu = AppMenu.buildFromTemplate [
            
            # 000   000   0000000 
            # 000  000   000   000
            # 0000000    000   000
            # 000  000   000   000
            # 000   000   0000000 
            
            label: pkg.productName   
            submenu: [     
                label:       "About #{pkg.productName}"
                accelerator: 'Alt+.'
                click:        main.showAbout
            ,
                type: 'separator'
            ,
                label:       "Hide #{pkg.productName}"
                accelerator: 'CmdOrCtrl+H'
                role:        'hide'
            ,
                label:       'Hide Others'
                accelerator: 'CmdOrCtrl+Alt+H'
                role:        'hideothers'
            ,
                type: 'separator'
            ,
                label:       'Quit'
                accelerator: 'CmdOrCtrl+Q'
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
                accelerator: 'CmdOrCtrl+N'
                click:       (i,win) -> post.toWin win.id, "newTabWithFile"
            ,
                label:       'New Window'
                accelerator: 'CmdOrCtrl+Shift+N'
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
                accelerator: 'CmdOrCtrl+S'
                click:       (i,win) -> post.toWin win.id, 'saveFile'
            ,            
                label:       'Save As ...'
                accelerator: 'CmdOrCtrl+Shift+S'
                click:       (i,win) -> post.toWin win.id, 'saveFileAs'
            ,
                type: 'separator'
            ,
                label:       'Reload'
                accelerator: 'CmdOrCtrl+R'
                click:       (i,win) -> post.toWin win.id, 'reloadFile'
            ,
                type: 'separator'
            ,
                label:       'Close Other Tabs'
                accelerator: 'CmdOrCtrl+Shift+T'
                click:       (i,win) -> post.toWin win.id, 'closeOtherTabs'
            ,
                label:       'Close Tab or Window'
                accelerator: 'CmdOrCtrl+W'
                click:       (i,win) -> post.toWin win.id, 'closeTabOrWindow'
            ]
        ,
            #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    
            # 000       000   000  000   000  000   000  000   000  0000  000  000   000  
            # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  
            # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
            #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    
            
            label: 'Command'
            submenu: [
                label:      'Open'
                submenu:    [
                        label:      'In Current Tab'
                        accelerator: 'CmdOrCtrl+p'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+p'
                    ,
                        label:      'In New Tab'
                        accelerator: 'CmdOrCtrl+shift+p'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+shift+p'
                    ,
                        label:      'In New Window'
                        accelerator: 'CmdOrCtrl+alt+p'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+p'
                ]
            ,
                label:      'Search'
                submenu:    [
                        label:      'Case Insensitive'
                        accelerator: 'CmdOrCtrl+Shift+F'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+shift+f'
                    ,
                        label:      'Case Sensitive'
                        #accelerator: 'ctrl+shift+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'ctrl+shift+f'
                    ,
                        label:      'Regexp Case Insensitive'
                        #accelerator: 'alt+shift+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+shift+f'
                    ,
                        label:      'Regexp Case Sensitive'
                        #accelerator: 'alt+shift+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+ctrl+shift+f'
                ]
            ,
                label:      'Find'
                submenu:    [
                        label:      'Case Insensitive'
                        accelerator: 'CmdOrCtrl+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+f'
                    ,
                        label:      'Case Sensitive'
                        #accelerator: 'ctrl+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'ctrl+f'
                    ,
                        label:      'Regexp Case Insensitive'
                        #accelerator: 'alt+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+f'
                    ,
                        label:      'Regexp Case Sensitive'
                        #accelerator: 'alt+ctrl+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+ctrl+f'
                    ,
                        label:      'Fuzzy'
                        #accelerator: 'command+alt+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+f'
                    ,
                        label:      'Glob'
                        #accelerator: 'command+ctrl+f'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+ctrl+f'
                ]
            ,
                label:      'Coffee'
                submenu:    [
                        label:      'In Window Process'
                        accelerator: 'alt+c'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+c'
                    ,
                        label:      'In Main Process'
                        accelerator: 'alt+shift+c'
                        click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+shift+c'
                ]
            ,
                label:      'Goto'
                accelerator: 'CmdOrCtrl+;'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+;'
            ,
                label:      'Term'
                accelerator: 'CmdOrCtrl+,'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+,'
            ,
                label:      'Browse'
                accelerator: 'CmdOrCtrl+.'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+.'
            ,
                label:      'Debug'
                accelerator: 'alt+d'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+d'
            ,
                label:      'Build'
                accelerator: 'CmdOrCtrl+b'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+b'
            ,
                label:      'Macro'
                accelerator: 'CmdOrCtrl+m'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+m'
            ]   
        ,
            # 000   000  000  00000000  000   000  
            # 000   000  000  000       000 0 000  
            #  000 000   000  0000000   000000000  
            #    000     000  000       000   000  
            #     0      000  00000000  00     00  
            
            label: 'View'
            submenu: [
                label:      'Navigate Backward'
                accelerator: 'command+ctrl+left'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+ctrl+left'
            ,
                label:      'Navigate Forward'
                accelerator: 'command+ctrl+right'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+ctrl+right'
            ,
                type: 'separator'
            ,
                label:      'Maximize Editor'
                accelerator: 'CmdOrCtrl+shift+y'
                click:      (i,win) -> post.toWin win.id, 'menuCombo', 'command+shift+y'
            ,
                label:      'Toggle Center Text'
                accelerator: 'CmdOrCtrl+\\'
                click:      (i,win) -> post.toWin win.id, 'menuCombo', 'command+\\'
            ,
                type: 'separator'
            ,
                label:       'Activate Next Tab'
                accelerator: 'CmdOrCtrl+alt+right'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+right'
            , 
                label:       'Activate Previous Tab'
                accelerator: 'CmdOrCtrl+alt+left'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+left'
            ,
                type: 'separator'
            ,
                label:       'Move Tab Right'
                accelerator: 'CmdOrCtrl+alt+shift+right'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+shift+right'
            , 
                label:       'Move Tab Left'
                accelerator: 'CmdOrCtrl+alt+shift+left'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'command+alt+shift+left'
            ,
                type: 'separator'
            ,
                label: 'Font Size'
                submenu: [
                    label:       'Increase'
                    accelerator: 'CmdOrCtrl+='
                    click:      (i,win) -> post.toWin win.id, 'menuCombo', 'command+='
                ,
                    label:       'Decrease'
                    accelerator: 'CmdOrCtrl+-'
                    click:      (i,win) -> post.toWin win.id, 'menuCombo', 'command+-'
                ,
                    label:       'Reset'
                    accelerator: 'CmdOrCtrl+0'
                    click:      (i,win) -> post.toWin win.id, 'menuCombo', 'command+0'
                ]
            ]
        ,
            # 000   000  000  000   000  0000000     0000000   000   000
            # 000 0 000  000  0000  000  000   000  000   000  000 0 000
            # 000000000  000  000 0 000  000   000  000   000  000000000
            # 000   000  000  000  0000  000   000  000   000  000   000
            # 00     00  000  000   000  0000000     0000000   00     00
            
            label: 'Window'
            submenu: [
                label:       'Toggle Scheme'
                accelerator: 'alt+i'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+i'
            ,
                type: 'separator'
            ,                            
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
                type: 'separator'
            ,
                label:       'Open Window List'
                accelerator: 'alt+`'
                click:       (i,win) -> post.toWin win.id, 'menuCombo', 'alt+`'
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

        # 00000000  0000000    000  000000000  
        # 000       000   000  000     000     
        # 0000000   000   000  000     000     
        # 000       000   000  000     000     
        # 00000000  0000000    000     000     
        
        submenu = 
            Misc: new AppMenu
            
        for actionFile in fileList path.join __dirname, '../editor/actions'
            continue if path.extname(actionFile) not in ['.js', '.coffee']
            actions = require actionFile
            for key,value of actions
                menuName = 'Misc'
                if key == 'actions'
                    if value['menu']? 
                        menuName = value['menu']
                        submenu[menuName] ?= new AppMenu
                    for k,v of value
                        if v.name and v.combo
                            menuCombo = (c) -> (i,win) -> post.toWin win.id, 'menuCombo', c
                            item = new MenuItem 
                                label:       v.name
                                accelerator: v.combo
                                click: menuCombo v.combo
                            if v.menu?
                                submenu[v.menu] ?= new AppMenu
                            if v.separator
                                submenu[v.menu ? menuName].append new MenuItem type: 'separator'
                            submenu[v.menu ? menuName].append item
                    submenu[menuName].append new MenuItem type: 'separator'
        
        editMenu = AppMenu.buildFromTemplate [
            label: 'Undo', 
            click: (i,win) -> post.toWin win.id, 'menuCombo', 'command+z'
            accelerator: 'CmdOrCtrl+Z'
        ,
            label: 'Redo', 
            click: (i,win) -> post.toWin win.id, 'menuCombo', 'command+shift+z'
            accelerator: 'CmdOrCtrl+Shift+Z'
        ,
            type: 'separator'
        ,
            label: 'Cut', 
            click: (i,win) -> post.toWin win.id, 'menuCombo', 'command+x'
            accelerator: os.platform() == 'win32' and 'Ctrl+X' or 'CmdOrCtrl+X'
        ,
            label: 'Copy', 
            click: (i,win) -> post.toWin win.id, 'menuCombo', 'command+c'
            accelerator: os.platform() == 'win32' and 'Ctrl+C' or 'CmdOrCtrl+C'
        ,
            label: 'Paste', 
            click: (i,win) -> post.toWin win.id, 'menuCombo', 'command+v'
            accelerator: os.platform() == 'win32' and 'Ctrl+V' or 'CmdOrCtrl+V'
        ,
            type: 'separator'
        ]
        
        for k,v of submenu
            editMenu.append new MenuItem label: k, submenu: v
        
        menu.insert 2, new MenuItem label: 'Edit', submenu: editMenu
                
        AppMenu.setApplicationMenu menu
        
module.exports = Menu

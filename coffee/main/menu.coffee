###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000 
###

{ fileList, prefs, fs, post, slash, os, log } = require 'kxk'

pkg      = require '../../package.json'
electron = require 'electron'
AppMenu  = electron.Menu
MenuItem = electron.MenuItem

class Menu
    
    @init: (main) ->
        
        fileLabel = (f) ->
            return slash.basename(f) + ' - ' + slash.tilde slash.dirname(f) if f?
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
                label:      'Browse'
                submenu:    [
                        label:      'Small'
                        accelerator: 'command+.'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'browse'
                    ,
                        label:      'Large'
                        accelerator: 'command+alt+.'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'Browse'
                    ,
                        label:      'Shelf'
                        accelerator: 'alt+.'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'shelf'
                    ,
                        type: 'separator'
                    ,
                        label:      'Add to Shelf'
                        accelerator: 'alt+shift+.'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'Add to Shelf'
                    
                ]
            ,
                label:      'Open'
                submenu:    [
                        label:      'In Current Tab'
                        accelerator: 'command+p'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'open'
                    ,
                        label:      'In New Tab'
                        accelerator: 'command+shift+p'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'new tab'
                    ,
                        label:      'In New Window'
                        accelerator: 'command+alt+p'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'new window'
                ]
            ,
                label:      'Search'
                submenu:    [
                        label:      'Case Insensitive'
                        accelerator: 'command+Shift+F'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'search'
                    ,
                        label:      'Case Sensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'Search'
                    ,
                        label:      'Regexp Case Insensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', '/search/'
                    ,
                        label:      'Regexp Case Sensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', '/Search/'
                ]
            ,
                label:      'Find'
                submenu:    [
                        label:      'Case Insensitive'
                        accelerator: 'command+f'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'find'
                    ,
                        label:      'Case Sensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'Find'
                    ,
                        label:      'Regexp Case Insensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', '/find/'
                    ,
                        label:      'Regexp Case Sensitive'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', '/Find/'
                    ,
                        label:      'Fuzzy'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'fiZd'
                    ,
                        label:      'Glob'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'f*nd'
                ]
            ,
                label:      'Coffee'
                submenu:    [
                        label:      'In Window Process'
                        accelerator: 'alt+c'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'coffee'
                    ,
                        label:      'In Main Process'
                        accelerator: 'alt+shift+c'
                        click:       (i,win) -> post.toWin win.id, 'menuAction', 'Coffee'
                ]
            ,
                label:      'Goto'
                accelerator: 'command+;'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'goto'
            ,
                label:      'Build'
                accelerator: 'command+b'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'build'
            ,
                label:      'Macro'
                accelerator: 'command+m'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'macro'
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
                accelerator: 'command+1' #'alt+ctrl+left'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Navigate Backward'
            ,
                label:      'Navigate Forward'
                accelerator: 'command+2' # 'alt+ctrl+right'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Navigate Forward'
            ,
                type: 'separator'
            ,
                label:      'Maximize Editor'
                accelerator: 'command+shift+y'
                click:      (i,win) -> post.toWin win.id, 'menuAction', 'Maximize Editor'
            ,
                label:      'Toggle Center Text'
                accelerator: 'command+\\'
                click:      (i,win) -> post.toWin win.id, 'menuAction', 'Toggle Center Text'
            ,
                type: 'separator'
            ,
                label:       'Activate Next Tab'
                accelerator: 'command+alt+shift+right'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Activate Next Tab'
            , 
                label:       'Activate Previous Tab'
                accelerator: 'command+alt+shift+left'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Activate Previous Tab'
            ,
                type: 'separator'
            ,
                label:       'Move Tab Right'
                accelerator: 'command+alt+shift+.'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Move Tab Right'
            , 
                label:       'Move Tab Left'
                accelerator: 'command+alt+shift+,'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Move Tab Left'
            ,
                type: 'separator'
            ,
                label: 'Font Size'
                submenu: [
                    label:       'Increase'
                    accelerator: 'command+='
                    click:      (i,win) -> post.toWin win.id, 'menuAction', 'Font Size Increase'
                ,
                    label:       'Decrease'
                    accelerator: 'command+-'
                    click:      (i,win) -> post.toWin win.id, 'menuAction', 'Font Size Decrease'
                ,
                    label:       'Reset'
                    # accelerator: 'command+0' # broken on mac! fix me 
                    click:      (i,win) -> post.toWin win.id, 'menuAction', 'Font Size Reset'
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
                accelerator: 'command+i'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Toggle Scheme'
            ,
                type: 'separator'
            ,                            
                label:       'Minimize'
                accelerator: 'command+Alt+M'
                click:       (i,win) -> win?.minimize()
            ,
                label:       'Maximize'
                accelerator: 'command+Alt+Shift+m'
                click:       (i,win) -> main.toggleMaximize win
            ,
                type: 'separator'
            ,
                label:       'Arrange'
                accelerator: 'command+Alt+A'
                click:       main.arrangeWindows
            ,                            
                type: 'separator'
            ,
                label:       'Open Window List'
                accelerator: 'alt+`'
                click:       (i,win) -> post.toWin win.id, 'menuAction', 'Open Window List'
            ,
                label:       'Cycle Through Windows'
                accelerator: 'command+`'
                click:       (i,win) -> main.activateNextWindow win
            ,
                type: 'separator'
            ,   
                label:       'Reload Window'
                accelerator: 'command+Alt+L'
                click:       (i,win) -> post.toWin win.id, 'reloadWin'
            ,                
                label:       'Toggle FullScreen'
                accelerator: 'command+Alt+F'
                click:       (i,win) -> win?.setFullScreen !win.isFullScreen()
            ,                
                label:       'Open DevTools'
                accelerator: 'command+Alt+I'
                click:       (i,win) -> win?.webContents.openDevTools()                
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
            
        actionFiles = fileList slash.join __dirname, '../editor/actions'
        # log 'actionFiles:', actionFiles
        for actionFile in actionFiles
            continue if slash.ext(actionFile) not in ['js', 'coffee']
            actions = require actionFile
            for key,value of actions
                menuName = 'Misc'
                if key == 'actions'
                    if value['menu']? 
                        menuName = value['menu']
                        submenu[menuName] ?= new AppMenu
                    for k,v of value
                        if v.name and v.combo
                            menuAction = (c) -> (i,win) -> post.toWin win.id, 'menuAction', c
                            item = new MenuItem 
                                label:       v.name
                                accelerator: v.accel ? v.combo
                                click: menuAction v.name
                            if v.menu?
                                submenu[v.menu] ?= new AppMenu
                            if v.separator
                                submenu[v.menu ? menuName].append new MenuItem type: 'separator'
                            submenu[v.menu ? menuName].append item
                    submenu[menuName].append new MenuItem type: 'separator'
        
        editMenu = AppMenu.buildFromTemplate [
            label: 'Undo', 
            click: (i,win) -> post.toWin win.id, 'menuAction', 'Undo'
            accelerator: 'command+z'
        ,
            label: 'Redo', 
            click: (i,win) -> post.toWin win.id, 'menuAction', 'Redo'
            accelerator: 'command+shift+z'
        ,
            type: 'separator'
        ,
            label: 'Cut', 
            click: (i,win) -> post.toWin win.id, 'menuAction', 'Cut'
            accelerator: 'command+x'
        ,
            label: 'Copy', 
            click: (i,win) -> post.toWin win.id, 'menuAction', 'Copy'
            accelerator: 'command+c'
        ,
            label: 'Paste', 
            click: (i,win) -> post.toWin win.id, 'menuAction', 'Paste'
            accelerator: 'command+v'
        ,
            type: 'separator'
        ]
        
        for k,v of submenu
            editMenu.append new MenuItem label: k, submenu: v
        
        menu.insert 2, new MenuItem label: 'Edit', submenu: editMenu
                
        AppMenu.setApplicationMenu menu
        
module.exports = Menu

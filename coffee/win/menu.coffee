###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000 
###

{ fileList, post, slash, fs, log, _ } = require 'kxk'

Syntax    = require '../editor/syntax'
Transform = require '../editor/actions/transform'
Macro     = require '../commands/macro'

getMenu = (template, name) ->
    
    for item in template
        if item.text == name
            return item

menu = (template) ->
        
    template = _.cloneDeep template
        
    actionFiles = fileList slash.join __dirname, '../editor/actions'
    submenu = Misc: []

    EditMenu = []
    for actionFile in actionFiles
        continue if slash.ext(actionFile) not in ['js', 'coffee']
        actions = require actionFile
        for key,value of actions
            menuName = 'Misc'
            if key == 'actions'
                if value['menu']?
                    menuName = value['menu']
                    submenu[menuName] ?= []
                for k,v of value
                    if v.name and v.combo
                        menuAction = (c) -> (i,win) -> post.toWin win.id, 'menuAction', c
                        item = 
                            text:   v.name
                            accel:  v.accel ? v.combo
                        if v.menu?
                            submenu[v.menu] ?= []
                        if v.separator
                            submenu[v.menu ? menuName].push text: ''
                        submenu[v.menu ? menuName].push item
                submenu[menuName].push text: ''

    for key, menu of submenu
        EditMenu.push text:key, menu:menu
    
    editMenu = getMenu template, 'Edit'
    editMenu.menu = editMenu.menu.concat EditMenu
    
    MacroMenu = [ text:'Macro', accel:'ctrl+m', action:'macro' ]
    for macro in Macro.macroNames
        MacroMenu.push
            text:   macro
            actarg: macro
            action: 'doMacro'

    commandMenu = getMenu template, 'Command'
    commandMenu.menu = commandMenu.menu.concat text:'Macro', menu:MacroMenu

    TransformMenu = []
    for transformMenu, transformList of Transform.Transform.transformMenus
        transformSubmenu = []
        for transform in transformList
            transformSubmenu.push
                text:   transform
                actarg: transform
                action: 'doTransform'

        TransformMenu.push
            text: transformMenu
            menu: transformSubmenu

    editMenu.menu = editMenu.menu.concat text:'Transform', menu:TransformMenu

    fileSpan = (f) ->
        if f?
            span  = Syntax.spanForTextAndSyntax slash.tilde(slash.dir(f)), 'browser'
            span += Syntax.spanForTextAndSyntax '/' + slash.base(f), 'browser'
        return span

    RecentMenu = []
    
    recent = window.state?.get 'recentFiles', []
    log window.state?, recent?
    recent ?= []
    for f in recent
        if fs.existsSync f

            RecentMenu.unshift
                # text: fileLabel f
                html: fileSpan f
                arg: f
                cb: (arg) -> post.emit 'newTabWithFile', arg

    if RecentMenu.length
        RecentMenu.push
            text: ''
        RecentMenu.push
            text: 'Clear List'
            # cb: ->
            #     state.set 'recentFiles', []
            #     window.mainmenu.loadMenu()
        fileMenu = getMenu template, 'File'
        fileMenu.menu = [{text:'Recent', menu: RecentMenu}, {text:''}].concat fileMenu.menu
    
    # log 'template', template    
    template

module.exports = menu

# Syntax    = require '../editor/syntax'
# Transform = require '../editor/actions/transform'
# Macro     = require '../commands/macro'
# 
        #     text: 'Command'
        #     menu: [
        # 
        #         # 0000000    00000000    0000000   000   000   0000000  00000000
        #         # 000   000  000   000  000   000  000 0 000  000       000
        #         # 0000000    0000000    000   000  000000000  0000000   0000000
        #         # 000   000  000   000  000   000  000   000       000  000
        #         # 0000000    000   000   0000000   00     00  0000000   00000000
        # 
        #         text:   'Browse'
        #         menu:   [
        #             text:   'Small',                    accel:  'ctrl+.',      action: 'browse'
        #         ,
        #             text:   'Large',                    accel:  'alt+ctrl+.',  action: 'Browse'
        #         ,
        #             text:   ''
        #         ,
        #             text:   'Shelf',                    accel:  'alt+.',        action: 'shelf'
        #         ,
        #             text:   'Add to Shelf',             accel:  'alt+shift+.'
        #         ,
        #             text:   'Toggle History',           accel:  'alt+h'
        #         ]
        #     ,
        #         #  0000000   00000000   00000000  000   000
        #         # 000   000  000   000  000       0000  000
        #         # 000   000  00000000   0000000   000 0 000
        #         # 000   000  000        000       000  0000
        #         #  0000000   000        00000000  000   000
        # 
        #         text:      'Open'
        #         menu:    [
        #             text:   'In Current Tab',           accel:  'ctrl+p',       action: 'open'
        #         ,
        #             text:   'In New Tab',               accel:  'ctrl+shift+p', action: 'new tab'
        #         ,
        #             text:   'In New Window',            accel:  'alt+ctrl+p',   action: 'new window'
        #         ]
        #     ,
        #         #  0000000  00000000   0000000   00000000    0000000  000   000
        #         # 000       000       000   000  000   000  000       000   000
        #         # 0000000   0000000   000000000  0000000    000       000000000
        #         #      000  000       000   000  000   000  000       000   000
        #         # 0000000   00000000  000   000  000   000   0000000  000   000
        # 
        #         text:   'Search'
        #         menu:   [ 
        #             text: 'Case Insensitive',           accel: 'ctrl+shift+f',  action: 'search'
        #         ,
        #             text: 'Case Sensitive',                                     action: 'Search'
        #         ,                        
        #             text: 'Regexp Case Insensitive',                            action: '/search/'
        #         ,                        
        #             text: 'Regexp Case Sensitive',                              action: '/Search/'
        #         ]
        #     ,
        #         # 00000000  000  000   000  0000000
        #         # 000       000  0000  000  000   000
        #         # 000000    000  000 0 000  000   000
        #         # 000       000  000  0000  000   000
        #         # 000       000  000   000  0000000
        # 
        #         text:   'Find'
        #         menu:    [
        #             text:   'Case Insensitive',         accel:  'ctrl+f',       action: 'find' 
        #         ,    
        #             text:   'Case Sensitive',                                   action: 'Find'
        #         ,                        
        #             text:   'Regexp Case Insensitive',                          action: '/find/'
        #         ,                        
        #             text:   'Regexp Case Sensitive',                            action: '/Find/'
        #         ,                        
        #             text:   'Fuzzy',                                            action: 'fiZd'
        #         ,                        
        #             text:   'Glob',                                             action: 'f*nd'
        #         ]    
        #     ,
        #         #  0000000   0000000   00000000  00000000  00000000  00000000
        #         # 000       000   000  000       000       000       000
        #         # 000       000   000  000000    000000    0000000   0000000
        #         # 000       000   000  000       000       000       000
        #         #  0000000   0000000   000       000       00000000  00000000
        # 
        #         text:   'Coffee'
        #         menu:   [
        #             text:   'In Window Process',        accel:  'alt+c',        action: 'coffee'
        #         ,
        #             text:   'In Main Process',          accel:  'alt+shift+c',  action: 'Coffee'
        #         ]
        #     ,
        #         # 000000000  00000000  00000000   00     00  000  000   000   0000000   000
        #         #    000     000       000   000  000   000  000  0000  000  000   000  000
        #         #    000     0000000   0000000    000000000  000  000 0 000  000000000  000
        #         #    000     000       000   000  000 0 000  000  000  0000  000   000  000
        #         #    000     00000000  000   000  000   000  000  000   000  000   000  0000000
        # 
        #         text:   'Terminal'
        #         menu:   [
        #             text:   'Small',                    accel:  'ctrl+,',       action: 'term'
        #         ,
        #             text:   'Large',                    accel:  'alt+,',        action: 'Term'
        #         ]
        # 
        #         text:   'Transform',    menu:   TransformMenu
        #     ,
        #         text:   'Goto',                         accel:  'ctrl+;',       action: 'goto'
        #     ,
        #         text:   'Build',                        accel:  'ctrl+b',       action: 'build'
        #     ]
        # ,
        #     # 000   000  000  00000000  000   000
        #     # 000   000  000  000       000 0 000
        #     #  000 000   000  0000000   000000000
        #     #    000     000  000       000   000
        #     #     0      000  00000000  00     00
        # 
        # 
        #         text:   'Font Size'
        #         menu: [
        #             text:   'Increase',                 accel:  'ctrl+=',   action: 'Font Size Increase'   
        #         ,
        #             text:   'Decrease',                 accel:  'ctrl+-',   action: 'Font Size Decrease'
        #         ,
        #             text:   'Reset',                    accel:  'ctrl+0',   action: 'Font Size Reset'
        #         ]
        #     ]
        # ,
    # constructor: ->
    # 
    #     post.on 'stash',   @stash
    #     post.on 'restore', @restore
            
    # restore: => @toggle() if window.stash.get('menu') != @visible()
    # stash:   => if @visible() then window.stash.set('menu', true) else window.stash.set 'menu'


    

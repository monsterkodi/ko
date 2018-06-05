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
    recent ?= []
    for f in recent
        if fs.existsSync f
            log 'fileSpan', fileSpan f
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
    
    template

module.exports = menu


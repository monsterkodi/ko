###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000 
###

{ post, elem, log, menu, $, _ } = require 'kxk'

Transform = require '../editor/actions/transform'
Macro     = require '../commands/macro'

class Menu

    @template: ->
        
        MacroMenu = [ text:'Macro', accel:'ctrl+m', action:'macro' ]
        for macro in Macro.macroNames
            MacroMenu.push
                text:   macro
                actarg: macro
                action: 'doMacro'

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
        
        [
            # 000   000   0000000
            # 000  000   000   000
            # 0000000    000   000
            # 000  000   000   000
            # 000   000   0000000
    
            text: 'ko'
            menu: [
                text:   "About ko",                     accel:  'ctrl+shift+/'
            ,
                text:   ''
            ,
                text:   'Preferences',                  accel:  'ctrl+shift+,'
            ,
                text:   ''
            ,
                text:   'Quit',                         accel:  'ctrl+q'
            ]
        ,
            # 00000000  000  000      00000000
            # 000       000  000      000
            # 000000    000  000      0000000
            # 000       000  000      000
            # 000       000  0000000  00000000
    
            text: 'File'
            menu: [
                text:   'New Tab',                      accel:  'ctrl+n'
            ,
                text:   'New Window',                   accel:  'ctrl+shift+n'
            ,
                text:   ''
            ,
                text:   'Open...',                      accel:  'ctrl+o'
            ,
                text:   'Open In New Window...',        accel:  'ctrl+shift+o'
            ,
                # text:       'Open Recent', menu:     recent
            # ,
                text:   ''
            ,
                text:   'Save',                         accel:  'ctrl+s'
            ,
                text:   'Save As ...',                  accel:  'ctrl+shift+s'
            ,
                text:   ''
            ,
                text:   'Reload',                       accel:  'ctrl+r'
            ,
                text:   ''
            ,
                text:   'Close Other Tabs',             accel:  'ctrl+shift+w'
            ,
                text:   'Close Tab or Window',          accel:  'ctrl+w'
            ]
        ,
            #  0000000   0000000   00     00  00     00   0000000   000   000  0000000
            # 000       000   000  000   000  000   000  000   000  0000  000  000   000
            # 000       000   000  000000000  000000000  000000000  000 0 000  000   000
            # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
            #  0000000   0000000   000   000  000   000  000   000  000   000  0000000
    
            text: 'Command'
            menu: [
    
                # 0000000    00000000    0000000   000   000   0000000  00000000
                # 000   000  000   000  000   000  000 0 000  000       000
                # 0000000    0000000    000   000  000000000  0000000   0000000
                # 000   000  000   000  000   000  000   000       000  000
                # 0000000    000   000   0000000   00     00  0000000   00000000
    
                text:   'Browse'
                menu:   [
                    text:   'Small',                    accel:  'ctrl+.',      action: 'browse'
                ,
                    text:   'Large',                    accel:  'alt+ctrl+.',  action: 'Browse'
                ,
                    text:   ''
                ,
                    text:   'Shelf',                    accel:  'alt+.',        action: 'shelf'
                ,
                    text:   'Add to Shelf',             accel:  'alt+shift+.'
                ,
                    text:   'Toggle History',           accel:  'alt+h'
                ]
            ,
                #  0000000   00000000   00000000  000   000
                # 000   000  000   000  000       0000  000
                # 000   000  00000000   0000000   000 0 000
                # 000   000  000        000       000  0000
                #  0000000   000        00000000  000   000
    
                text:      'Open'
                menu:    [
                    text:   'In Current Tab',           accel:  'ctrl+p',       action: 'open'
                ,
                    text:   'In New Tab',               accel:  'ctrl+shift+p', action: 'new tab'
                ,
                    text:   'In New Window',            accel:  'ctrl+alt+p',   action: 'new window'
                ]
            ,
                #  0000000  00000000   0000000   00000000    0000000  000   000
                # 000       000       000   000  000   000  000       000   000
                # 0000000   0000000   000000000  0000000    000       000000000
                #      000  000       000   000  000   000  000       000   000
                # 0000000   00000000  000   000  000   000   0000000  000   000
    
                text:   'Search'
                menu:   [ 
                    text: 'Case Insensitive',           accel: 'ctrl+shift+f',  action: 'search'
                ,
                    text: 'Case Sensitive',                                     action: 'Search'
                ,                        
                    text: 'Regexp Case Insensitive',                            action: '/search/'
                ,                        
                    text: 'Regexp Case Sensitive',                              action: '/Search/'
                ]
            ,
                # 00000000  000  000   000  0000000
                # 000       000  0000  000  000   000
                # 000000    000  000 0 000  000   000
                # 000       000  000  0000  000   000
                # 000       000  000   000  0000000
    
                text:   'Find'
                menu:    [
                    text:   'Case Insensitive',         accel:  'ctrl+f',       action: 'find' 
                ,    
                    text:   'Case Sensitive',                                   action: 'Find'
                ,                        
                    text:   'Regexp Case Insensitive',                          action: '/find/'
                ,                        
                    text:   'Regexp Case Sensitive',                            action: '/Find/'
                ,                        
                    text:   'Fuzzy',                                            action: 'fiZd'
                ,                        
                    text:   'Glob',                                             action: 'f*nd'
                ]    
            ,
                #  0000000   0000000   00000000  00000000  00000000  00000000
                # 000       000   000  000       000       000       000
                # 000       000   000  000000    000000    0000000   0000000
                # 000       000   000  000       000       000       000
                #  0000000   0000000   000       000       00000000  00000000
    
                text:   'Coffee'
                menu:   [
                    text:   'In Window Process',        accel:  'alt+c',        action: 'coffee'
                ,
                    text:   'In Main Process',          accel:  'alt+shift+c',  action: 'Coffee'
                ]
            ,
                # 000000000  00000000  00000000   00     00  000  000   000   0000000   000
                #    000     000       000   000  000   000  000  0000  000  000   000  000
                #    000     0000000   0000000    000000000  000  000 0 000  000000000  000
                #    000     000       000   000  000 0 000  000  000  0000  000   000  000
                #    000     00000000  000   000  000   000  000  000   000  000   000  0000000
    
                text:   'Terminal'
                menu:   [
                    text:   'small',                    accel:  'ctrl+,',       action: 'term'
                ,
                    text:   'large',                    accel:  'alt+,',        action: 'Term'
                ]
            ,
                # 00     00   0000000    0000000  00000000    0000000
                # 000   000  000   000  000       000   000  000   000
                # 000000000  000000000  000       0000000    000   000
                # 000 0 000  000   000  000       000   000  000   000
                # 000   000  000   000   0000000  000   000   0000000
    
                text:   'Macro',        menu:   MacroMenu
            ,
                text:   'Transform',    menu:   TransformMenu
            ,
                text:   'Goto',                         accel:  'ctrl+;',       action: 'goto'
            ,
                text:   'Build',                        accel:  'ctrl+b',       action: 'build'
            ]
        ,
            # 000   000  000  00000000  000   000
            # 000   000  000  000       000 0 000
            #  000 000   000  0000000   000000000
            #    000     000  000       000   000
            #     0      000  00000000  00     00
    
            text: 'View'
            menu: [
                text:   'Maximize Editor',              accel:  'ctrl+shift+y'
            ,
                text:   'Toggle Center Text',           accel:  'ctrl+\\'
            ,
                text:   ''
            ,
                text:   'Navigate Backward',            accel:  'ctrl+1'
            ,
                text:   'Navigate Forward',             accel:  'ctrl+2'
            ,
                text:   ''
            ,
                text:   'Activate Next Tab',            accel:  'ctrl+alt+shift+right'
            ,
                text:   'Activate Previous Tab',        accel:  'ctrl+alt+shift+left'
            ,
                text:   ''
            ,
                text:   'Move Tab Right',               accel:  'ctrl+alt+shift+.'
            ,
                text:   'Move Tab Left',                accel:  'ctrl+alt+shift+,'
            ,
                text:   ''
            ,
                text:   'Toggle Menu',                  accel:  'alt+m'
            ,
                text:   ''
            ,
                text:   'Font Size'
                menu: [
                    text:   'Increase',                 accel:  'ctrl+=',   action: 'Font Size Increase'   
                ,
                    text:   'Decrease',                 accel:  'ctrl+-',   action: 'Font Size Decrease'
                ,
                    text:   'Reset',                    accel:  'ctrl+0',   action: 'Font Size Reset'
                ]
            ]
        ,
            # 000   000  000  000   000  0000000     0000000   000   000
            # 000 0 000  000  0000  000  000   000  000   000  000 0 000
            # 000000000  000  000 0 000  000   000  000   000  000000000
            # 000   000  000  000  0000  000   000  000   000  000   000
            # 00     00  000  000   000  0000000     0000000   00     00
    
            text:   'Window'
            menu: [
                text:   'Toggle Scheme',                accel:  'alt+i'
            ,
                text:   ''
            ,
                text:   'Minimize',                     accel:  'ctrl+alt+m'
            ,
                text:   'Maximize',                     accel:  'ctrl+alt+shift+m'
            ,
                text:   ''
            ,
                text:   'Arrange',                      accel:  'ctrl+alt+a'
            ,
                text:   ''
            ,
                text:   'Open Window List',             accel:  'alt+`'
            ,
                text:   'Cycle Windows',                accel:  'ctrl+`'
            ,
                text:   ''
            ,
                text:   'Reload Window',                accel:  'ctrl+alt+l'
            ,
                text:   'Toggle FullScreen',            accel:  'ctrl+alt+f'
            ,
                text:   'Open DevTools',                accel:  'ctrl+alt+i'
            ]
        ]
    
    constructor: ->
        
        @menu = new menu items:Menu.template()
        
        @elem = @menu.elem
        window.titlebar.elem.insertBefore @elem, window.titlebar.elem.firstChild
        
        post.on 'stash',   @stash
        post.on 'restore', @restore
        
    visible: => @elem.style.display != 'none'
    toggle:  => @elem.style.display = @visible() and 'none' or 'inline-block'
    show:    => @elem.style.display = 'inline-block'; @menu.focus()
    hide:    => @elem.style.display = 'none'
    toggle:  => if @visible() then @hide() else @show()

    restore: => @toggle() if window.stash.get('menu') != @visible()
    stash:   => if @visible() then window.stash.set('menu', true) else window.stash.set 'menu'

module.exports = Menu

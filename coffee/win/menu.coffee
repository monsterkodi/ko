###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000 
###

{ post, elem, log, menu, $, _ } = require 'kxk'

class Menu

    @template = [
            
        # 000   000   0000000
        # 000  000   000   000
        # 0000000    000   000
        # 000  000   000   000
        # 000   000   0000000

        text: 'ko'
        menu: [
            text:   "About ko"
            accel:  'ctrl+shift+/'
        ,
            text:   ''
        ,
            text:   'Preferences'
            accel:  'ctrl+shift+,'
        ,
            text:   ''
        ,
            text:   'Quit'
            accel:  'Ctrl+Q'
        ]
    ,
        # 00000000  000  000      00000000
        # 000       000  000      000
        # 000000    000  000      0000000
        # 000       000  000      000
        # 000       000  0000000  00000000

        text: 'File'
        menu: [
            text:   'New Tab'
            accel:  'cmdorctrl+n'
        ,
            text:   'New Window'
            accel:  'Ctrl+Shift+N'
        ,
            text:   ''
        ,
            text:   'Open...'
            accel:  'Ctrl+O'
        ,
            text:   'Open In New Window...'
            accel:  'Ctrl+Shift+O'
        ,
            # text:       'Open Recent'
            # menu:     recent
        # ,
            text:   ''
        ,
            text:   'Save'
            accel:  'Ctrl+S'
        ,
            text:   'Save As ...'
            accel:  'Ctrl+Shift+S'
        ,
            text:   ''
        ,
            text:   'Reload'
            accel:  'Ctrl+R'
        ,
            text:   ''
        ,
            text:   'Close Other Tabs'
            accel:  'ctrl+shift+w'
        ,
            text:   'Close Tab or Window'
            accel:  'ctrl+w'
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
                text:   'Small'
                accel:  'Ctrl+.'
            ,
                text:   'Large'
                accel:  'alt+ctrl+.'
            ,
                text:   ''
            ,
                text:   'Shelf'
                accel:  'alt+.'
            ,
                text:   'Add to Shelf'
                accel:  'alt+shift+.'
            ,
                text:   'Toggle History'
                accel:  'alt+h'
            ]
        ,
            #  0000000   00000000   00000000  000   000
            # 000   000  000   000  000       0000  000
            # 000   000  00000000   0000000   000 0 000
            # 000   000  000        000       000  0000
            #  0000000   000        00000000  000   000

            text:      'Open'
            menu:    [
                text:   'In Current Tab'
                accel:  'Ctrl+p'
            ,
                text:   'In New Tab'
                accel:  'Ctrl+shift+p'
            ,
                text:   'In New Window'
                accel:  'Ctrl+alt+p'
            ]
        ,
            #  0000000  00000000   0000000   00000000    0000000  000   000
            # 000       000       000   000  000   000  000       000   000
            # 0000000   0000000   000000000  0000000    000       000000000
            #      000  000       000   000  000   000  000       000   000
            # 0000000   00000000  000   000  000   000   0000000  000   000

            text:   'Search'
            menu:   [
                text:   'Case Insensitive'
                accel:  'Ctrl+Shift+F'
            ,
                text:   'Case Sensitive'
            ,
                text:   'Regexp Case Insensitive'
            ,
                text:   'Regexp Case Sensitive'
            ]
        ,
            # 00000000  000  000   000  0000000
            # 000       000  0000  000  000   000
            # 000000    000  000 0 000  000   000
            # 000       000  000  0000  000   000
            # 000       000  000   000  0000000

            text:   'Find'
            menu:    [
                text:   'Case Insensitive'
                accel:  'Ctrl+f'
            ,
                text:   'Case Sensitive'
            ,
                text:   'Regexp Case Insensitive'
            ,
                text:   'Regexp Case Sensitive'
            ,
                text:   'Fuzzy'
            ,
                text:   'Glob'
            ]
        ,
            #  0000000   0000000   00000000  00000000  00000000  00000000
            # 000       000   000  000       000       000       000
            # 000       000   000  000000    000000    0000000   0000000
            # 000       000   000  000       000       000       000
            #  0000000   0000000   000       000       00000000  00000000

            text:   'Coffee'
            menu:   [
                text:   'In Window Process'
                accel:  'alt+c'
            ,
                text:   'In Main Process'
                accel:  'alt+shift+c'
            ]
        ,
            # 000000000  00000000  00000000   00     00  000  000   000   0000000   000
            #    000     000       000   000  000   000  000  0000  000  000   000  000
            #    000     0000000   0000000    000000000  000  000 0 000  000000000  000
            #    000     000       000   000  000 0 000  000  000  0000  000   000  000
            #    000     00000000  000   000  000   000  000  000   000  000   000  0000000

            text:   'Terminal'
            menu:   [
                text:   'small'
                accel:  'ctrl+,'
            ,
                text:   'large'
                accel:  'alt+,'
            ]
        ,
            # 00     00   0000000    0000000  00000000    0000000
            # 000   000  000   000  000       000   000  000   000
            # 000000000  000000000  000       0000000    000   000
            # 000 0 000  000   000  000       000   000  000   000
            # 000   000  000   000   0000000  000   000   0000000

            text:   'Macro'
            # menu:   MacroMenu
        ,
            text:   'Transform'
            # menu:   TransformMenu
        ,
            text:   'Goto'
            accel:  'Ctrl+;'
        ,
            text:   'Build'
            accel:  'Ctrl+b'
        ]
    ,
        # 000   000  000  00000000  000   000
        # 000   000  000  000       000 0 000
        #  000 000   000  0000000   000000000
        #    000     000  000       000   000
        #     0      000  00000000  00     00

        text: 'View'
        menu: [
            text:   'Navigate Backward'
            accel:  'ctrl+1'
        ,
            text:   'Navigate Forward'
            accel:  'ctrl+2'
        ,
            text:   ''
        ,
            text:   'Maximize Editor'
            accel:  'Ctrl+shift+y'
        ,
            text:   'Toggle Center Text'
            accel:  'Ctrl+\\'
        ,
            text:   ''
        ,
            text:   'Activate Next Tab'
            accel:  'ctrl+alt+shift+right'
        ,
            text:   'Activate Previous Tab'
            accel:  'ctrl+alt+shift+left'
        ,
            text:   ''
        ,
            text:   'Move Tab Right'
            accel:  'ctrl+alt+shift+.'
        ,
            text:   'Move Tab Left'
            accel:  'Ctrl+alt+shift+,'
        ,
            text:   ''
        ,
            text:   'Font Size'
            menu: [
                text:   'Increase'
                accel:  'Ctrl+='
            ,
                text:   'Decrease'
                accel:  'Ctrl+-'
            ,
                text:   'Reset'
                accel:  'Ctrl+0'
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
            text:   'Toggle Scheme'
            accel:  'alt+i'
        ,
            text:   ''
        ,
            text:   'Minimize'
            accel:  'Ctrl+Alt+M'
        ,
            text:   'Maximize'
            accel:  'Ctrl+Alt+Shift+m'
        ,
            text:   ''
        ,
            text:   'Arrange'
            accel:  'Ctrl+Alt+A'
        ,
            text:   ''
        ,
            text:   'Open Window List'
            accel:  'alt+`'
        ,
            text:   'Cycle Through Windows'
            accel:  'Ctrl+`'
        ,
            text:   ''
        ,
            text:   'Reload Window'
            accel:  'Ctrl+Alt+L'
        ,
            text:   'Toggle FullScreen'
            accel:  'Ctrl+Alt+F'
        ,
            text:   'Open DevTools'
            accel:  'Ctrl+Alt+I'
        ]
    ]
    
    constructor: ->
        
        @menu = new menu items:Menu.template
        
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

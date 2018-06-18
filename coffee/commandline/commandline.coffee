###
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
###

{ fileList, stopEvent, elem, keyinfo, clamp, post, slash, error, log, str, os, $, _ } = require 'kxk'

TextEditor = require '../editor/texteditor'

class Commandline extends TextEditor

    constructor: (viewElem) ->

        super viewElem, features: [], fontSize: 24, syntaxName:'commandline'

        @mainCommands = ['browse', 'goto', 'open', 'search', 'find', 'coffee', 'build', 'macro', 'term']
        @hideCommands = ['selecto', 'Term', 'Build', 'Browse']

        @size.lineHeight = 30
        @scroll.setLineHeight @size.lineHeight

        @button =$ 'commandline-button'
        @button.classList.add 'empty'
        @button.addEventListener 'mousedown', @onCmmdClick

        @commands = {}
        @command = null

        @loadCommands()

        window.split.on 'split', @onSplit

        post.on 'restore', @restore
        post.on 'stash',   @stash
        
        @view.onblur = =>
            @button.classList.remove 'active'
            @list?.remove()
            @list = null
            @command?.onBlur()

        @view.onfocus = =>
            @button.className = "commandline-button active #{@command?.prefsID}"

    #  0000000  000000000   0000000    0000000  000   000
    # 000          000     000   000  000       000   000
    # 0000000      000     000000000  0000000   000000000
    #      000     000     000   000       000  000   000
    # 0000000      000     000   000  0000000   000   000

    stash: => 
        
        if @command? 
            window.stash.set 'commandline', @command.state()

    restore: =>

        state = window.stash.get 'commandline'
        
        @setText state?.text ? ""

        name = state?.name ? 'open'
        
        if @command = @commandForName name
            activeID = document.activeElement.id
            if activeID.startsWith 'column' then activeID = 'editor'
            @command.setReceiver activeID != 'commandline-editor' and activeID or null
            @setName name
            @button.className = "commandline-button active #{@command.prefsID}"
            @commands[name]?.restoreState? state

    # 000       0000000    0000000   0000000
    # 000      000   000  000   000  000   000
    # 000      000   000  000000000  000   000
    # 000      000   000  000   000  000   000
    # 0000000   0000000   000   000  0000000

    loadCommands: ->

        files = fileList "#{__dirname}/../commands"
        for file in files
            continue if slash.ext(file) != 'js'
            try
                commandClass = require file
                command = new commandClass @
                command.setPrefsID commandClass.name.toLowerCase()
                @commands[command.prefsID] = command
            catch err
                error "can't load command from file '#{file}': #{err}"

    setName: (name) ->

        @button.innerHTML = name
        @layers.style.width = @view.style.width

    setLines: (l) ->

        @scroll.reset()
        super l

    setAndSelectText: (t) ->

        @setLines [t ? '']
        @selectAll()
        @selectSingleRange @rangeForLineAtIndex 0

    setText: (t) ->

        @setLines [t ? '']
        @singleCursorAtPos [@line(0).length, 0]

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        @hideList()
        super changeInfo
        if changeInfo.changes.length
            @button.className = "commandline-button active #{@command?.prefsID}"
            @command?.changed @line(0)

    onSplit: (s) =>

        @command?.onBot? s[1]
        @positionList()

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    startCommand: (name) ->

        r = @command?.cancel name
        
        if r?.status == 'ok'
            @results r
            return

        window.split.showCommandline()

        if @command = @commandForName name
        
            activeID = document.activeElement.id
            if activeID.startsWith 'column' then activeID = 'editor'
            if activeID and activeID != 'commandline-editor'
                @command.setReceiver activeID
                
            @lastFocus = window.lastFocus
            @view.focus()
            @setName name
            @results @command.start name # <-- command start
    
            @button.className = "commandline-button active #{@command.prefsID}"
        else
            error 'no command'

    commandForName: (name) ->

        for n,c of @commands
            if n == name or name in c.names
                return c
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000
    # 0000000     00000    0000000   000       000   000     000     0000000
    # 000        000 000   000       000       000   000     000     000
    # 00000000  000   000  00000000   0000000   0000000      000     00000000

    execute: -> @results @command?.execute @line 0
    
    # 00000000   00000000   0000000  000   000  000      000000000   0000000
    # 000   000  000       000       000   000  000         000     000
    # 0000000    0000000   0000000   000   000  000         000     0000000
    # 000   000  000            000  000   000  000         000          000
    # 000   000  00000000  0000000    0000000   0000000     000     0000000

    results: (r) ->

        @setName r.name if r?.name?
        @setText r.text if r?.text?
        if r?.select then @selectAll() else @selectNone()
        window.split.show   r.show   if r?.show?
        window.split.focus  r.focus  if r?.focus?
        window.split.do     r.do     if r?.do?
        @

    cancel: -> @results @command?.cancel()
    clear:  -> 
        if @text() == ''
            @results @command?.clear()
        else
            super.clear()

    # 000      000   0000000  000000000
    # 000      000  000          000
    # 000      000  0000000      000
    # 000      000       000     000
    # 0000000  000  0000000      000

    onCmmdClick: (event) =>

        if not @list?
            @list = elem class: 'list commands'
            @positionList()
            window.split.elem.appendChild @list
        @command?.hideList?()
        @listCommands()
        @focus()
        @positionList()
        stopEvent event

    listCommands: ->

        @list.innerHTML = ""
        @list.style.display = 'unset'
        for name in @mainCommands
            cmmd = @commands[name]
            for ci in [0...cmmd.names.length]
                cname = cmmd.names[ci]
                continue if cname in @hideCommands
                div = elem class: "list-item"
                namespan = "<span class=\"ko command #{cmmd.prefsID}\" style=\"position:absolute; left: #{ci > 0 and 80 or 12}px\">#{cname}</span>"
                div.innerHTML = namespan
                start = (name) => (event) =>
                    @hideList()
                    @startCommand name
                    stopEvent event
                div.addEventListener 'mousedown', start cname
                @list.appendChild div

    hideList: ->

        @list?.remove()
        @list = null

    # 00000000    0000000    0000000  000  000000000  000   0000000   000   000
    # 000   000  000   000  000       000     000     000  000   000  0000  000
    # 00000000   000   000  0000000   000     000     000  000   000  000 0 000
    # 000        000   000       000  000     000     000  000   000  000  0000
    # 000         0000000   0000000   000     000     000   0000000   000   000

    positionList: ->

        return if not @list?
        listHeight = @list.getBoundingClientRect().height
        flex = window.split.flex
        listTop = flex.posOfPane 2
        spaceBelow = flex.size() - listTop
        spaceAbove = flex.sizeOfPane 0
        if spaceBelow < listHeight and spaceAbove > spaceBelow
            listTop = spaceAbove - listHeight
        @list?.style.top = "#{listTop}px"

    resized: ->

        @list?.resized?()
        @command?.commandList?.resized()
        super()

    focusTerminal: ->

        if window.terminal.numLines() == 0
            window.terminal.singleCursorAtPos [0,0]
        window.split.do "focus terminal"

    # 000   000  00000000  000   000
    # 000  000   000        000 000
    # 0000000    0000000     00000
    # 000  000   000          000
    # 000   000  00000000     000

    handleMenuAction: (name, args) ->
        
        # log 'handleMenuAction', name, args
        if args?.command
            if @commandForName args.command           
                @startCommand args.command    
                return
        'unhandled'
    
    globalModKeyComboEvent: (mod, key, combo, event) ->

        if combo == 'esc'
            if document.activeElement == @view then return @cancel()

        if @command?
            return @command.globalModKeyComboEvent mod, key, combo, event
            
        'unhandled'

    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->

        if @command?
            return if 'unhandled' != @command.handleModKeyComboEvent mod, key, combo, event

        split = window.split
        switch combo
            when 'enter'                then return @execute()
            when 'command+enter'        then return @execute() + window.split.do "focus #{@command?.focus}"
            when 'command+shift+enter'  then return @focusTerminal()
            when 'up'                   then return @command?.selectListItem 'up'
            when 'down'                 then return @command?.selectListItem 'down'
            when 'esc'                  then return @cancel()
            when 'command+k'            then return @clear()
            when 'shift+tab'            then return
            when 'home', 'command+up'   then return split.do 'maximize editor'
            when 'end', 'command+down'  then return split.do 'minimize editor'
            when 'alt+up'               then return split.do 'enlarge editor'
            when 'ctrl+up'              then return split.do 'enlarge editor by 20'
            when 'alt+down'             then return split.do 'reduce editor'
            when 'ctrl+down'            then return split.do 'reduce editor by 20'
            when 'right', 'tab'         then return if @command?.onTabCompletion combo

        return super mod, key, combo, char, event

module.exports = Commandline

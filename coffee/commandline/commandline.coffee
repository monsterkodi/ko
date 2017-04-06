#  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
# 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
{
fileList,
keyinfo,
clamp,
log,
$}        = require 'kxk'
TextEditor  = require '../editor/texteditor'
render    = require '../editor/render'
syntax    = require '../editor/syntax'
split     = require '../split'
path      = require 'path'

class Commandline extends TextEditor
    
    constructor: (viewElem) ->
            
        @fontSizeDefault = 24
        @mainCommands = ['open', 'search', 'find', 'goto', 'term', 'coffee', 'build', 'macro']
        @hideCommands = ['selecto', 'Term', 'Build', 'Coffee']

        super viewElem, features: []
        
        @size.lineHeight = 30
        @scroll?.setLineHeight @size.lineHeight
        @setText ""
                
        @cmmd =$ '.commandline-command' 
        @cmmd.classList.add 'empty'
        @cmmd.addEventListener 'mousedown', @onCmmdClick
        
        @commands = {}
        @command = null

        @loadCommands()
        
        window.split.on 'split', @onSplit
        
        @view.onblur = () => 
            @cmmd.classList.remove 'active'
            @list?.remove()
            @list = null
            @command?.onBlur()
            
        @view.onfocus = () =>
            @cmmd.className = "commandline-command active #{@command?.prefsID}"

    # 000       0000000    0000000   0000000  
    # 000      000   000  000   000  000   000
    # 000      000   000  000000000  000   000
    # 000      000   000  000   000  000   000
    # 0000000   0000000   000   000  0000000  
    
    loadCommands: ->
        files = fileList "#{__dirname}/../commands"
        for file in files
            commandClass = require file
            command = new commandClass @
            command.setPrefsID commandClass.name.toLowerCase()
            @commands[command.prefsID] = command
            
    setName: (name) -> 
        @cmmd.innerHTML = name
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
            @cmmd.className = "commandline-command active #{@command?.prefsID}"
            @command?.changed @line(0)
        
    onSplit: (s) => 
        @command?.onBot? s[1]
        
        cl = window.split.commandlineHeight + window.split.handleHeight
        if s[1] < cl
            @list?.style.opacity = "#{clamp 0, 1, s[1]/cl}"
        else
            @list?.style.opacity = "1"
        
        @positionList()
    
    # 00000000  000  000      00000000        000       0000000    0000000   0000000    00000000  0000000  
    # 000       000  000      000             000      000   000  000   000  000   000  000       000   000
    # 000000    000  000      0000000         000      000   000  000000000  000   000  0000000   000   000
    # 000       000  000      000             000      000   000  000   000  000   000  000       000   000
    # 000       000  0000000  00000000        0000000   0000000   000   000  0000000    00000000  0000000  
    
    fileLoaded: (file) ->
        if not @command?
            @command = @commands['open']
            @command.loadState()
            @setText path.basename file
          
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    startCommand: (name, combo, event) ->        
        event?.preventDefault()
        event?.stopPropagation()
        r = @command?.cancel combo
        if r?.status == 'ok'
            @results r
            return
        window.split.showCommandline()
        @command = @commands[name]
        activeClass = "."+document.activeElement.className
        @command.setFocus activeClass != '.commandline-editor' and activeClass or null
        @view.focus()
        @setName name
        combo = @command.shortcuts[0] if not combo?
        @results @command.start combo # <-- command start
        @cmmd.className = "commandline-command active #{@command.prefsID}"
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: -> @results @command?.execute @line(0)
        
    results: (r) ->
        @setText r.text if r?.text?
        @setName r.name if r?.name?
        if r?.select then @selectAll()
        else @selectNone()
        window.split.focus  r.focus  if r?.focus?
        window.split.reveal r.reveal if r?.reveal?
        window.split.do     r.do     if r?.do?
        
    cancel: -> @results @command?.cancel()
    clear:  -> @results @command?.clear()
      
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    onCmmdClick: (event) =>
        if not @list?
            @list = document.createElement 'div' 
            @list.className = 'list commands'
            @positionList()
            window.split.elem.appendChild @list 
        @command?.hideList?()
        @listCommands()
        @focus()
        @positionList()
        event.preventDefault()
        event.stopPropagation()

    listCommands: ->
        @list.innerHTML = ""        
        @list.style.display = 'unset'
        for name in @mainCommands
            cmmd = @commands[name]
            for ci in [0...cmmd.shortcuts.length]
                combo = cmmd.shortcuts[ci]
                cname = cmmd.names[ci]
                continue if cname in @hideCommands
                div = document.createElement 'div'
                div.className = "list-item"
                namespan = "<span class=\"ko command #{cmmd.prefsID}\" style=\"position:absolute; left: #{ci > 0 and 40 or 6}px\">#{cname}</span>" 
                shortcut = "<span class=\"ko shortcut #{cmmd.prefsID}\"style=\"position:absolute; right: 6px;\">#{keyinfo.short combo}</span>" 
                div.innerHTML = namespan + shortcut
                start = (name,combo) => (event) => 
                    @hideList()
                    @startCommand name, combo
                    event.stopPropagation()
                    event.preventDefault()
                div.addEventListener 'mousedown', start name, combo
                @list.appendChild div

    hideList: ->
        @list?.remove()
        @list = null
        
    positionList: ->
        return if not @list?
        split = window.split
        listTop = split.splitPosY 1
        listHeight = @list.getBoundingClientRect().height
        spaceBelow = split.elemHeight() - listTop
        spaceAbove = split.splitPosY 0
        if spaceBelow < listHeight and spaceAbove > spaceBelow
            listTop = spaceAbove - listHeight
        @list?.style.top = "#{listTop}px"        
    
    resized: -> 
        @list?.resized()
        @command?.commandList?.resized()
        super

    focusTerminal: ->
        if window.terminal.numLines() == 0
            window.terminal.singleCursorAtPos [0,0]
        window.split.do "focus terminal"
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    globalModKeyComboEvent: (mod, key, combo, event) ->
        for n,c of @commands            
            if combo == 'esc'
                if document.activeElement == @view
                    @cancel()
                    return 
            for sc in c.shortcuts
                if sc == combo then return @startCommand n, combo, event
        return 'unhandled'            

    handleModKeyComboEvent: (mod, key, combo, event) ->
        # log "Commandline.handleModKeyComboEvent mod:#{mod} key:#{key} combo:#{combo}"
        if @command?
            return if @command.handleModKeyComboEvent(mod, key, combo, event) != 'unhandled'

        stop = (event) ->
            event.preventDefault()
            event.stopPropagation()        
        
        return if 'unhandled' != super mod, key, combo, event
        split = window.split
        switch combo
            when 'enter'                then return @execute()
            when 'command+enter'        then return @execute() + window.split.do "focus #{@command?.focus}"
            when 'command+shift+enter'  then return @focusTerminal()
            when 'up'                   then return @setAndSelectText @command?.prev()
            when 'down'                 then return @setAndSelectText @command?.next()
            when 'esc'                  then return @cancel()
            when 'command+k'            then return @clear()
            when 'shift+tab'            then return 
            when 'home', 'command+up'   then return split.do 'maximize editor'
            when 'end', 'command+down'  then return split.do 'minimize editor'
            when 'alt+up'               then return split.do 'enlarge editor'
            when 'ctrl+up'              then return split.do 'enlarge editor by 20'
            when 'alt+down'             then return split.do 'reduce editor'
            when 'ctrl+down'            then return split.do 'reduce editor by 20'
            when 'right', 'tab' 
                if @isCursorAtEndOfLine()
                    if @command?.complete()
                        return stop event
                    if @numSelections()
                        @do.start()
                        @do.select []
                        @do.end()
                    return stop event
                else if combo == 'tab'
                    return
        
        return 'unhandled'
    
module.exports = Commandline

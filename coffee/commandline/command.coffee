###
 0000000   0000000   00     00  00     00   0000000   000   000  0000000  
000       000   000  000   000  000   000  000   000  0000  000  000   000
000       000   000  000000000  000000000  000000000  000 0 000  000   000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000  
###

{ reversed, clamp, state, elem, error, log, _ } = require 'kxk'

Syntax      = require '../editor/syntax'
CommandList = require './commandlist'
fuzzy       = require 'fuzzy'

class Command

    constructor: (@commandline) ->
        
        @syntaxName   = 'ko'
        @maxHistory   = 20

    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    state: ->
        text:  @getText()
        name:  @name
        
    restoreState: (state) ->
        @name  = state.name
        @loadState()
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (name) ->
        
        @setName name
        @loadState()
        text = @getText()
        text = @last() if not text?.length
        text:   text
        select: true
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        if @commandList? 
            if 0 <= @selected < @commandList.numLines()
                command = @commandList?.line @selected
            @hideList()
            
        command = command.trim()
        @setCurrent command
        command
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (command) ->
        return if not @commandList?
        
        command = command.trim()
        items = @listItems()
        
        if items.length
            if command.length
                fuzzied = fuzzy.filter command, items, extract: (o) -> 
                    if o?
                        return o if _.isString o
                        return o.text if _.isString o.text
                    ''            
                items = (f.original for f in _.sortBy fuzzied, (o) -> o.index)
            @showItems @weightedItems items, currentText: command
            @select 0
            @positionList()

    weight: (item, opt) ->
        w = 0
        w += item.text.startsWith(opt.currentText) and 65535 * (opt.currentText.length/item.text.length) or 0 
        w
    
    weightedItems: (items, opt) -> items.sort (a,b) => @weight(b, opt) - @weight(a, opt)
    
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: ->
        
        @hideList()        
        text: ''
        focus: @focus
        show: 'editor'
        
    clear: ->
        if window.terminal.numLines() > 0
            window.terminal.clear()
            {}
        else
            text: ''
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    showList: ->

        if not @commandList?
            listView = elem class: "commandlist #{@prefsID}"
            window.split.elem.appendChild listView
            @commandList = new CommandList @, '.commandlist', syntax: @syntaxName
    
    listItems: () -> reversed @history

    showItems: (items) ->
        
        return if not @commandList? and not items.length
        return @hideList() if not items.length
        @showList() if not @commandList?
        @commandList.addItems items
        @positionList()
    
    listClick: (index) =>
        
        @selected = index
        @execute @commandList.line index 
    
    onBot: (bot) => @positionList()
    
    positionList: ->
        
        return if not @commandList?
        flex = window.split.flex
        flex.update()
        listTop = flex.posOfPane 2 
        listHeight = @commandList.view.getBoundingClientRect().height
        spaceBelow = flex.size() - listTop
        if spaceBelow < listHeight
            if flex.sizeOfPane(0) > spaceBelow
                listTop = flex.posOfHandle(0) - listHeight
                if listTop < 0
                    @commandList.view.style.height = "#{listHeight+listTop}px"
                    listTop = 0
            else
                @commandList.view.style.height = "#{spaceBelow}px"
        @commandList?.view.style.top = "#{listTop}px"

    #  0000000  00000000  000      00000000   0000000  000000000
    # 000       000       000      000       000          000   
    # 0000000   0000000   000      0000000   000          000   
    #      000  000       000      000       000          000   
    # 0000000   00000000  0000000  00000000   0000000     000   
        
    select: (i) -> 
        
        @selected = clamp -1, @commandList?.numLines()-1, i
        if @selected >= 0
            @commandList?.selectSingleRange @commandList.rangeForLineAtIndex @selected
            @commandList?.do.cursors [[0, @selected]]
        else
            @commandList?.singleCursorAtPos [0,0] 
                
    # 00000000   00000000   00000000  000   000
    # 000   000  000   000  000       000   000
    # 00000000   0000000    0000000    000 000 
    # 000        000   000  000          000   
    # 000        000   000  00000000      0    
            
    prev: -> 
        
        if @commandList?
            @select clamp -1, @commandList.numLines()-1, @selected-1
            if @selected < 0
                @hideList() 
            else
                return @commandList.line(@selected)
        else            
            if @selected < 0
                @selected = @history.length-1 
            else if @selected > 0
                @selected -= 1
            return @history[@selected]
        ''
        
    # 000   000  00000000  000   000  000000000
    # 0000  000  000        000 000      000   
    # 000 0 000  0000000     00000       000   
    # 000  0000  000        000 000      000   
    # 000   000  00000000  000   000     000   
    
    next: -> 
        
        if not @commandList? and @listItems().length
            @showItems @listItems() 
            @select -1
        if @commandList? 
            @select clamp 0, @commandList.numLines()-1, @selected+1
            return @commandList.line(@selected)
        else if @history.length
            @selected = clamp 0, @history.length-1, @selected+1
            return new @history[@selected]
        else
            @selected = -1
            return ''

    # 000   000  000  0000000    00000000
    # 000   000  000  000   000  000     
    # 000000000  000  000   000  0000000 
    # 000   000  000  000   000  000     
    # 000   000  000  0000000    00000000
         
    onBlur: => 
        
        if not @skipBlur
            @hideList()
        else
            @skipBlur = null
            
    hideList: ->

        @commandList?.del()
        @commandList?.view?.remove()
        @commandList = null

    cancelList: -> @hideList()
                
    # 000   000  000   0000000  000000000   0000000   00000000   000   000
    # 000   000  000  000          000     000   000  000   000   000 000 
    # 000000000  000  0000000      000     000   000  0000000      00000  
    # 000   000  000       000     000     000   000  000   000     000   
    # 000   000  000  0000000      000      0000000   000   000     000   
    
    historyKey: -> 'history'
    
    clearHistory: ->
        
        @history = []
        @selected = -1
        @setState @historyKey(), @history
   
    setHistory: (@history) ->
        
        @setState @historyKey(), @history
    
    setCurrent: (command) ->
        
        @loadState() if not @history?
        error 'Command.setCurrent -- @history not an array?', typeof @history if not _.isArray @history
        _.pull @history, command
        @history.push command if command.trim().length
        while @history.length > @maxHistory
            @history.shift()
        @selected = @history.length-1
        @setState @historyKey(), @history
        
    current: -> @history[@selected] ? ''
        
    last: ->
        if @commandList?
            @selected = @commandList.numLines()-1
            @commandList.line(@selected)
        else            
            @selected = @history.length-1
            return @history[@selected] if @selected >= 0
        ''
        
    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   
    
    setText: (t) -> 
        @currentText = t
        @commandline.setText t
        
    setAndSelectText: (t) -> 
        @currentText = t
        @commandline.setAndSelectText t
        
    getText: -> @commandline.line(0)
        
    setName: (n) ->
        @name = n
        @commandline.setName n

    complete: -> 
        return if not @commandList? 
        if @commandList.line(@selected) != @getText() and @commandList.line(@selected).startsWith @getText()
            @setText @commandList.line(@selected)
            true
    
    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    grabFocus: -> @commandline.focus()
    setFocus: (focus) -> 
        return if focus == 'body'
        @focus = focus ? 'editor'

    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000     
    # 0000000      000     000000000     000     0000000 
    #      000     000     000   000     000     000     
    # 0000000      000     000   000     000     00000000

    setPrefsID: (id) ->
        @prefsID = id
        @loadState()
        
    loadState: ->
        @history = @getState @historyKey(), []
        @selected = @history.length-1

    setState: (key, value) ->
        return if not @prefsID
        if @prefsID
            state.set "command|#{@prefsID}|#{key}", value
        
    getState: (key, value) ->
        return value if not @prefsID
        state.get "command|#{@prefsID}|#{key}", value
        
    delState: (key) ->
        return if not @prefsID
        state.del "command|#{@prefsID}|#{key}"

    isActive: -> @commandline.command == @
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    globalModKeyComboEvent: (mod, key, combo, event) -> 'unhandled'
        
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        # log "command.coffee handleModKeyComboEvent #{key}"
        switch combo
            when 'page up', 'page down'
                if @commandList?
                    log 'dasasasdasfdwqerwqrq r-qowopgf ias0-gia-0i -'
                    return @select clamp 0, @commandList.numLines(), @selected+@commandList.maxLines*(combo=='page up' and -1 or 1)
        'unhandled'

module.exports = Command

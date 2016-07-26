#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  
{
clamp
}           = require '../tools/tools'
log         = require '../tools/log'
prefs       = require '../tools/prefs'
Syntax      = require '../editor/syntax'
CommandList = require './commandlist'
_           = require 'lodash'
fuzzy       = require 'fuzzy'

class Command

    constructor: (@commandline) ->
        @syntaxName   = 'ko'
        @maxHistory   = 20
        @maxListLines = 15
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (combo) ->
        index = @shortcuts.indexOf combo
        @setName @names[index]
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
            if 0 <= @selected < @commandList.lines.length
                command = @commandList?.lines[@selected]
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
        if @listItems().length
            items = @listItems()
            command = command.trim()
            if command.length
                fuzzied  = fuzzy.filter command, (new String(s.text ? s) for s in items)
                filtered = (f.string for f in fuzzied)
                @showItems _.filter items, (i) => (i.text ? i) in filtered
                @select 0
                @positionList()
            else
                @showItems items
                @select 0
                @positionList()
       
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: ->
        @hideList()        
        text: ''
        focus: @focus
        reveal: 'editor'
        
    clear: ->
        text: ''
        focus: @focus
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    showList: ->
        if not @commandList?
            listView = document.createElement 'div' 
            listView.className = "commandlist #{@prefsID}"
            window.split.elem.appendChild listView
            @commandList = new CommandList '.commandlist'
            @commandList.numbers.opacity = 0.1
            @commandList.numbers.setOpacity 0.1
    
    listItems: () -> @history.reversed()

    showItems: (items) ->
        return if not @commandList? and not items.length
        return @hideList() if not items.length
        @showList() if not @commandList?
        @commandList.setLines ['']
        index = 0
        for item in items
            continue if not item? 
            text = (item.text ? item).trim()              
            continue if not text.length
            rngs = item.rngs ? []
            if item.clss?
                rngs.push 
                    match: text
                    start: 0
                    value: item.clss
                    index: 0
            @commandList.appendMeta 
                line: item.line ? ' '
                text: text
                rngs: rngs
                type: item.type ? @syntaxName
                clss: 'searchResult'
                list: index
            index += 1
        @commandList.view.style.height = "#{4 + @commandList.size.lineHeight * Math.min @maxListLines, items.length}px"
        @commandList.resized()
        @positionList()
    
    listClick: (index) => 
        log "listClick index #{index}"
        @selected = index
        @execute @commandList.lines[index]
    
    onBot: (bot) => 
        cl = window.split.commandlineHeight + window.split.handleHeight
        if bot < cl
            @commandList?.view.style.opacity = "#{clamp 0, 1, bot/cl}"
        else
            @commandList?.view.style.opacity = "1"
        @positionList()
    
    positionList: ->
        return if not @commandList?
        split = window.split
        listTop = 6+split.splitPosY 1
        listHeight = @commandList.view.getBoundingClientRect().height
        if (split.elemHeight() - listTop) < listHeight
            if split.splitPosY(0) > split.splitPosY(1) - split.splitPosY(1)
                listTop = split.splitPosY(0) - listHeight
                if listTop < 0
                    @commandList.view.style.height = "#{listHeight+listTop}px"
                    listTop = 0
            else
                @commandList.view.style.height = "#{split.elemHeight() - listTop}px"
        @commandList?.view.style.top = "#{listTop}px"

    #  0000000  00000000  000      00000000   0000000  000000000
    # 000       000       000      000       000          000   
    # 0000000   0000000   000      0000000   000          000   
    #      000  000       000      000       000          000   
    # 0000000   00000000  0000000  00000000   0000000     000   
        
    select: (i) -> 
        @selected = clamp -1, @commandList?.lines.length-1, i
        if @selected >= 0
            @commandList?.selectSingleRange @commandList.rangeForLineAtIndex @selected
            @commandList.do.cursors [[0, @selected]]
        else
            @commandList?.singleCursorAtPos [0,0] 
                
    # 00000000   00000000   00000000  000   000
    # 000   000  000   000  000       000   000
    # 00000000   0000000    0000000    000 000 
    # 000        000   000  000          000   
    # 000        000   000  00000000      0    
            
    prev: -> 
        if @commandList?
            @select clamp -1, @commandList.lines.length-1, @selected-1
            if @selected < 0
                @hideList() 
            else
                return @commandList.lines[@selected]
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
            @select clamp 0, @commandList.lines.length-1, @selected+1
            return @commandList.lines[@selected]
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
        @commandList?.view.remove()
        @commandList = null
                
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
    
    setCurrentText: (command) -> 
        log "Command.setCurrentText command:#{command}"
        @setCurrent command
        if @commandline.command == @
            @setAndSelectText command
        
    setCurrent: (command) ->
        @loadState() if not @history?
        _.pull @history, command
        @history.push command if command.trim().length
        while @history.length > @maxHistory
            @history.shift()
        @selected = @history.length-1
        @setState @historyKey(), @history
        
    current: -> @history[@selected] ? ''
        
    last: ->
        if @commandList?
            @selected = @commandList.lines.length-1
            @commandList.lines[@selected]
        else            
            @selected = @history.length-1
            return @history[@selected] if @selected >= 0
        ''
        
    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   
    
    setText:          (t) -> @commandline.setText t
    setAndSelectText: (t) -> @commandline.setAndSelectText t
        
    getText: -> @commandline.lines[0]
        
    setName: (n) ->
        @name = n
        @commandline.setName n

    complete: -> 
        return if not @commandList? 
        if @commandList.lines[@selected] != @getText() and @commandList.lines[@selected].startsWith @getText()
            @setText @commandList.lines[@selected]
    
    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000     
    # 000000    000   000  000       000   000  0000000 
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000 
    
    grabFocus: -> @commandline.focus()
    setFocus: (focus) -> 
        return if focus == '.body'
        @focus = focus ? '.editor'

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
            prefs.set "command:#{@prefsID}:#{key}", value
        
    getState: (key, value) ->
        return value if not @prefsID
        prefs.get "command:#{@prefsID}:#{key}", value
        
    delState: (key) ->
        return if not @prefsID
        prefs.del "command:#{@prefsID}:#{key}"

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        switch combo
            when 'page up', 'page down'
                if @commandList?
                    return @select clamp 0, @commandList.lines.length, @selected+@maxListLines*(combo=='page up' and -1 or 1)
        'unhandled'

module.exports = Command

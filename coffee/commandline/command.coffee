#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  
{
clamp
}      = require '../tools/tools'
log    = require '../tools/log'
prefs  = require '../tools/prefs'
render = require '../editor/render'
syntax = require '../editor/syntax'
_      = require 'lodash'
fuzzy  = require 'fuzzy'

class Command

    constructor: (@commandline) ->
        @maxHistory = 20
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (combo) ->
        index = @shortcuts.indexOf combo
        @setName @names[index]
        @loadState()
        text:   @last()
        select: true
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        if @list? 
            if 0 <= @selected < @list?.children.length
                command = @list?.children[@selected]?.value
            @hideList()
        @setCurrent command
        command
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (command) ->
        return if not @list?
        if @listItems().length
            items = @listItems()
            command = command.trim()
            if command.length
                fuzzied  = fuzzy.filter command, (new String(s) for s in items)
                filtered = (f.string for f in fuzzied)
                @showItems filtered
                @select -1
            else
                @showItems items
                @select -1
       
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
        if not @list?
            @list = document.createElement 'div' 
            @list.className = 'list open'
            @positionList()
            window.split.elem.appendChild @list 
    
    listItems: () -> @history.reversed()

    showItems: (items) ->    
        return if not @list? and not items.length
        @showList() if not @list?
        @list.innerHTML = ""        
        if items.length == 0
            @list.style.display = 'none'
        else
            @list.style.display = 'unset'
            index = 0
            for item in items
                continue if not item? or not item.trim?().length
                div = document.createElement 'div'
                div.className = 'list-item'
                div.innerHTML = item 
                div.value     = item
                div.addEventListener 'mousedown', @listClick
                @list.appendChild div
                index += 1
    
    listClick: (event) => 
        log "listClick #{event.target.value}"
        @selected = -1
        @execute event.target.value
    
    onBot: (bot) => 
        cl = window.split.commandlineHeight + window.split.handleHeight
        if bot < cl
            @list?.style.opacity = "#{clamp 0, 1, bot/cl}"
        else
            @list?.style.opacity = "1"
        @positionList()
    
    positionList: ->
        return if not @list?
        split = window.split
        listTop = split.splitPosY 1
        listHeight = @list.getBoundingClientRect().height
        if (split.elemHeight() - listTop) < listHeight
            listTop = split.splitPosY(0) - listHeight
        @list?.style.top = "#{listTop}px"

    #  0000000  00000000  000      00000000   0000000  000000000
    # 000       000       000      000       000          000   
    # 0000000   0000000   000      0000000   000          000   
    #      000  000       000      000       000          000   
    # 0000000   00000000  0000000  00000000   0000000     000   
        
    select: (i) ->
        @list?.children[@selected]?.classList.remove 'selected'
        @selected = clamp -1, @list?.children.length-1, i
        if @selected >= 0
            @list?.children[@selected]?.classList.add 'selected'
            @list?.children[@selected]?.scrollIntoViewIfNeeded()
                
    # 00000000   00000000   00000000  000   000
    # 000   000  000   000  000       000   000
    # 00000000   0000000    0000000    000 000 
    # 000        000   000  000          000   
    # 000        000   000  00000000      0    
            
    prev: -> 
        if @list?
            @select clamp -1, @list.children.length-1, @selected-1
            if @selected < 0
                @hideList() 
            else
                return @list.children[@selected]?.value
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
        if not @list? and @listItems().length
            @showItems @listItems() 
            @select -1
        if @list? 
            @select clamp 0, @list.children.length-1, @selected+1
            return @list.children[@selected]?.value
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
        @list?.remove()
        @list = null
                
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
        @setCurrent command
        if @commandline.command == @
            @setText command
        
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
        if @list?
            @selected = @list.children.length-1
            @list.children[@selected]?.value
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
        @commandline.setText t
        @commandline.selectAll()
        
    getText: ->
        @commandline.lines[0]
    
    setName: (n) ->
        @name = n
        @commandline.setName n

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
                if @list?
                    return @select clamp 0, @list.children.length, @selected+20*(combo=='page up' and -1 or 1)
        'unhandled'

module.exports = Command

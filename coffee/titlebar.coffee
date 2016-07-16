# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000
{
unresolve,
clamp,
$}       = require './tools/tools'
log      = require './tools/log'
render   = require './editor/render'
syntax   = require './editor/syntax'
path     = require 'path'
electron = require 'electron'
ipc      = electron.ipcRenderer

class Titlebar
    
    constructor: () ->
        @elem = $('.titlebar')
        @elem.ondblclick = (event) => ipc.send 'maximizeWindow', window.winID
        @selected = -1
        $('.body').addEventListener 'focusout', @closeList
        $('.body').addEventListener 'focusin',  @closeList

    update: (info) ->
        if info.file?
            title   = path.basename info.file
            tooltip = unresolve info.file
        else
            title = ''
        ic  = info.focus and " focus" or ""
        id  = "<span class='clickarea'><span class=\"winid #{ic}\">#{info.winID}</span>"
        dc  = info.dirty and " dirty" or "clean"
        dot = info.sticky and "○" or "●"
        db  = "<span class=\"dot #{dc}#{ic}\">#{dot}</span>"
        da  = info.dirty and dot or ""
        txt = id + db 
        if title.length
            txt += "<span class=\"title #{dc}#{ic}\" data-tip=\"#{tooltip}\">#{title} #{da}</span>"
        txt += "</span>"
        @elem.innerHTML = txt
        $('.clickarea', @elem)?.addEventListener 'click', @showList
       
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    showList: (event) => 
        return if @list?
        document.activeElement.blur()
        @selected = -1
        @list = document.createElement 'div' 
        @list.className = 'list windows'
        @list.style.top = 0
        window.split.elem.appendChild @list             
        @listBuffers()
        event?.preventDefault()
        event?.stopPropagation()

    closeList: =>
        if @list?
            window.split.focusAnything()
            @selected = -1
            @list?.remove()
            @list = null

    listBuffers: ->
        @list.innerHTML = ""        
        @list.style.display = 'unset'
        winInfos = ipc.sendSync 'winInfos'
        for info in winInfos
            continue if info.id == window.winID
            div = document.createElement 'div'
            div.className = "list-item"
            div.winID     = info.id
            file = unresolve info.file
            fileSpan = render.line file, syntax.dissForTextAndSyntax(file, 'ko', join: true), charWidth:0
            id  = "<span class=\"winid\">#{info.id}</span>"
            dc  = info.dirty and " dirty" or "clean"
            dot = "<span class=\"dot #{dc}\">●</span>"
            div.innerHTML = id + dot + fileSpan
            activateWindow = (id) => (event) => 
                @loadWindowWithID id
                event.stopPropagation()
                event.preventDefault()
            div.addEventListener 'mousedown', activateWindow info.id
            @list.appendChild div

    loadWindowWithID: (id) ->
        @closeList()
        ipc.send 'activateWindow', id
        
    loadSelected: -> 
        return @closeList() if @selected < 0
        @loadWindowWithID @list.children[@selected].winID
    
    navigate: (dir = 'down') ->
        return if not @list
        @list.children[@selected]?.classList.remove 'selected'
        @selected += switch dir
            when 'up'   then -1
            when 'down' then +1
        @selected = @list.children.length-1 if @selected < -1
        @selected = -1 if @selected >= @list.children.length
        @list.children[@selected].classList.add 'selected' if @selected > -1
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    globalModKeyComboEvent: (mod, key, combo, event) ->
        if @list? 
            switch combo
                when 'esc', 'alt+`' then return @closeList()
                when 'up', 'down'   then return @navigate key
                when 'enter'      
                    event.stopPropagation()
                    event.preventDefault()
                    return @loadSelected()
        
        return 'unhandled'
        
module.exports = Titlebar

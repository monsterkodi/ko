# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000
{
unresolve,
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
        @elem.onclick = @onClick
        $('.body').addEventListener 'focusin', @closeList

    update: (info) ->
        if info.file?
            title   = path.basename info.file
            tooltip = unresolve info.file
        else
            title = ''
        ic  = info.focus and " focus" or ""
        id  = "<span class=\"winid #{ic}\">#{info.winID}</span>"
        dc  = info.dirty and " dirty" or "clean"
        dot = info.sticky and "○" or "●"
        db  = "<span class=\"dot #{dc}#{ic}\">#{dot}</span>"
        da  = info.dirty and dot or ""
        txt = id + db 
        if title.length
            txt += "<span class=\"title #{dc}#{ic}\" data-tip=\"#{tooltip}\">#{title} #{da}</span>"
        @elem.innerHTML = txt
       
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    onClick: (event) =>
        if not @list?
            @list = document.createElement 'div' 
            @list.className = 'list windows'
            @list.style.top = 0
            window.split.elem.appendChild @list             
        @listBuffers()
        event.preventDefault()
        event.stopPropagation()

    listBuffers: ->
        @list.innerHTML = ""        
        @list.style.display = 'unset'
        winInfos = ipc.sendSync 'winInfos'
        for info in winInfos
            continue if info.id == window.winID
            div = document.createElement 'div'
            div.className = "list-item"
            file = unresolve info.file
            fileSpan = render.line file, syntax.dissForTextAndSyntax(file, 'ko', join: true), charWidth:0
            id  = "<span class=\"winid\">#{info.id}</span>"
            dc  = info.dirty and " dirty" or "clean"
            dot = "<span class=\"dot #{dc}\">●</span>"
            div.innerHTML = id + dot + fileSpan
            activateWindow = (id) => (event) => 
                @closeList()
                ipc.send 'activateWindow', id
                event.stopPropagation()
                event.preventDefault()
            div.addEventListener 'mousedown', activateWindow info.id
            @list.appendChild div

    closeList: =>
        @list?.remove()
        @list = null
        
module.exports = Titlebar

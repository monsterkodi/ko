# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000
{
$}       = require './tools/tools'
log      = require './tools/log'
electron = require 'electron'
ipc      = electron.ipcRenderer

class Titlebar
    
    constructor: () ->
        @elem = $('.titlebar')
        @elem.ondblclick = (event) => ipc.send 'maximizeWindow', window.winID
        @elem.onclick = @onClick
       
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    onClick: (event) =>
        if not @list?
            @list = document.createElement 'div' 
            @list.className = 'list buffers'
            @list.style.top = 0
            window.split.elem.appendChild @list             
        @listBuffers()
        event.preventDefault()
        event.stopPropagation()

    listBuffers: ->
        @list.innerHTML = ""        
        @list.style.display = 'unset'
        winInfos = ipc.sendSync 'winInfos'
        for winInfo in winInfos
            div = document.createElement 'div'
            div.className = "list-item"
            div.innerHTML = "<span class=\"ko windows\" style=\"position:absolute;\">#{winInfo.file}</span>" 
            activateWindow = (id) => (event) => 
                @list.remove()
                @list = null
                ipc.send 'activateWindow', id
                event.stopPropagation()
                event.preventDefault()
            div.addEventListener 'mousedown', activateWindow winInfo.id
            @list.appendChild div
        
module.exports = Titlebar

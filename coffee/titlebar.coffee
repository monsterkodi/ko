# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000

{ packagePath, unresolve, stopEvent, clamp, post, path, log, $
}        = require 'kxk'
render   = require './editor/render'
syntax   = require './editor/syntax'

class Titlebar
    
    constructor: () ->
        @elem =$ 'titlebar' 
        @elem.ondblclick = (event) -> post.toMain 'maximizeWindow', window.winID
        @selected = -1
        document.body.addEventListener 'focusout', @closeList
        document.body.addEventListener 'focusin',  @closeList

    update: (info) ->
        ic  = info.focus and " focus" or ""
        dc  = info.dirty and " dirty" or "clean"
        dot = info.sticky and "○" or "●"
        db  = "<span class=\"dot #{dc}#{ic}\">#{dot}</span>"
        
        if info.file?
            diss = syntax.dissForTextAndSyntax(path.basename(info.file), 'ko', join: true)
            title = render.line diss, charWidth:0
            
            if pkgPath = packagePath info.file
                title = path.basename(pkgPath) + "<span class='#{ic}'> ▸ </span>" + title
            
            tooltip = unresolve info.file
        else
            title = ''
        
        id  = "<span class='clickarea'><span class=\"winid #{ic}\">#{info.winID}</span>"
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
        winInfos = post.get 'winInfos'
        return if winInfos.length < 2
        document.activeElement.blur()
        @selected = -1
        @list = document.createElement 'div' 
        @list.className = 'list windows'
        @list.style.top = 0
        window.split.elem.appendChild @list             
        @listWinInfos winInfos
        stopEvent event

    closeList: =>
        if @list?
            window.split.focusAnything()
            @selected = -1
            @list?.remove()
            @list = null

    listWinInfos: (winInfos) ->
        @list.innerHTML = ""        
        @list.style.display = 'unset'
        for info in winInfos
            continue if info.id == window.winID
            div = document.createElement 'div'
            div.className = "list-item"
            div.winID     = info.id
            file = unresolve info.file ? ''
            diss = syntax.dissForTextAndSyntax(file, 'ko', join: true)
            fileSpan = render.line diss, charWidth:0
            id  = "<span class=\"winid\">#{info.id}</span>"
            dc  = info.dirty and " dirty" or "clean"
            dot = "<span class=\"dot #{dc}\">●</span>"
            div.innerHTML = id + dot + fileSpan
            activateWindow = (id) => (event) => 
                @loadWindowWithID id
                stopEvent event
            div.addEventListener 'mousedown', activateWindow info.id
            @list.appendChild div

    loadWindowWithID: (id) ->
        @closeList()
        post.toMain 'activateWindow', id
        
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
                    stopEvent event
                    return @loadSelected()
        
        return 'unhandled'
        
module.exports = Titlebar

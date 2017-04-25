
# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000

{ packagePath, resolve, unresolve, stopEvent, clamp, elem, post, path, log, $
}      = require 'kxk'
render = require '../editor/render'
syntax = require '../editor/syntax'
Tabs   = require './tabs'

class Titlebar
    
    constructor: () ->

        log 'Titlebar', window.winID
        post.toMain 'breakpoint', window.winID, resolve('~/s/ko/coffee/win/titlebar.coffee'), 100

        @elem =$ 'titlebar'
        @elem.ondblclick = (event) -> post.toMain 'maximizeWindow', window.winID
        @selected = -1
        
        document.body.addEventListener 'focusout', @closeList
        document.body.addEventListener 'focusin',  @closeList
        
        @info = 
            numWins: 1  
            dirty:   false
            sticky:  false
            focus:   true
            file:    'untitled'
        
        post.on 'numWins',  @onNumWins
        post.on 'winFocus', @onWinFocus
        post.on 'sticky',   @onSticky
        post.on 'dirty',    @onDirty
        post.on 'file',     @onFile
        
        @winid = elem class: 'winid'
        @elem.appendChild @winid
        @winid.addEventListener 'click', @showList
        
        @tabs = new Tabs @elem
        
        @winnum = elem class: 'winnum'
        @elem.appendChild @winnum
        @winnum.addEventListener 'click', @showList

    onNumWins: (numWins) => 
        if @info.numWins != numWins
            @info.numWins = numWins
            @update()
    
    onSticky: (sticky) =>
        if @info.sticky != sticky
            @info.sticky = sticky
            @update()

    onDirty: (dirty) =>
        if @info.dirty != dirty
            @info.dirty = dirty
            @update()
            
    onWinFocus: (focus) =>
        if @info.focus != focus
            @info.focus = focus
            @update()
        
    onFile: (file) =>
        if @info.file != file
            @info.file = file ? 'untitled'
            @update()
    
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: ->
        # log 'titlebar update', @info
        s = @info.sticky and "○" or ''
        @winid.innerHTML = "#{s}#{window.winID}#{s}"
        @elem.classList.toggle 'focus', @info.focus
        @winid.classList.toggle 'focus', @info.focus
        @winnum.innerHTML = @info.numWins > 1 and "#{@info.numWins}" or ''
        @tabs.activeTab()?.update @info
        @tabs.update()

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
        @list = elem class: 'list windows'
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
            div = elem class: "list-item"
            div.winID = info.id
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

        switch combo
            when 'command+shift+t'     then return @tabs.closeOthers()
            when 'command+alt+left', 'command+alt+right' then return @tabs.navigate key
            when 'command+alt+shift+left', 'command+alt+shift+right' then return @tabs.move key

        if @list?
            switch combo
                when 'esc', 'alt+`'    then return @closeList()
                when 'up', 'down'      then return @navigate key
                when 'enter'
                    stopEvent event
                    return @loadSelected()
        
        return 'unhandled'
        
module.exports = Titlebar

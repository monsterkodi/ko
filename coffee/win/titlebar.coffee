###
000000000  000  000000000  000      00000000  0000000     0000000   00000000 
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     000      0000000   0000000    000000000  0000000  
   000     000     000     000      000       000   000  000   000  000   000
   000     000     000     0000000  00000000  0000000    000   000  000   000
###

{ post, stopEvent, elem, $ } = require 'kxk'

class Titlebar
    
    constructor: ->

        @elem =$ 'titlebar'
        @selected = -1
        
        document.body.addEventListener 'focusout', @closeList
        document.body.addEventListener 'focusin',  @closeList
        
        @info = 
            numWins: 1  
            sticky:  false
            focus:   true
        
        post.on 'numWins',  @onNumWins
        post.on 'winFocus', @onWinFocus
        post.on 'winTabs',  @onWinTabs
        post.on 'sticky',   @onSticky
        
    onNumWins: (numWins) => 
        
        if @info.numWins != numWins
            @info.numWins = numWins
    
    onSticky: (sticky) =>
        
        if @info.sticky != sticky
            @info.sticky = sticky

    onWinFocus: (focus) =>
        
        if @info.focus != focus
            @info.focus = focus
            @elem.classList.toggle 'focus', @info.focus
        
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    showList: (event) =>
              
        return if @list?
        winInfos = post.get 'winInfos'
        return if winInfos.length <= 1
        document.activeElement.blur()
        @selected = -1
        @list = elem class: 'winlist'
        @elem.parentNode.insertBefore @list, @elem.nextSibling
        @listWinInfos winInfos
        stopEvent event

    closeList: =>
        
        if @list?
            window.split.focusAnything()
            @selected = -1
            @list?.remove()
            @list = null

    # 000   000  000  000   000  000  000   000  00000000   0000000    0000000  
    # 000 0 000  000  0000  000  000  0000  000  000       000   000  000       
    # 000000000  000  000 0 000  000  000 0 000  000000    000   000  0000000   
    # 000   000  000  000  0000  000  000  0000  000       000   000       000  
    # 00     00  000  000   000  000  000   000  000        0000000   0000000   
    
    listWinInfos: (winInfos) ->
        
        @list.innerHTML = ""        
        
        for info in winInfos
            
            continue if info.id == window.winID
            
            div = elem class: "winlist-item", children: [
                elem 'span', class: 'wintabs', text: ''
            ]
            div.winID = info.id
            
            activateWindow = (id) => (event) => 
                @loadWindowWithID id
                stopEvent event
                
            div.addEventListener 'mousedown', activateWindow info.id
            @list.appendChild div
            
        post.toOtherWins 'sendTabs', window.winID
        @navigate 'down'
        @

    onWinTabs: (winID, tabs) =>

        return if not @list?
        return if winID == window.winID
        for div in @list.children
            if div.winID == winID
                $('.wintabs', div)?.innerHTML = tabs
                width = div.getBoundingClientRect().width
                break

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
            when 'command+alt+left', 'command+alt+right' then return winow.tabs.navigate key
            when 'command+alt+shift+left', 'command+alt+shift+right' then return window.tabs.move key

        if @list?
            switch combo
                when 'esc', 'alt+`'    then return @closeList()
                when 'up', 'down'      then return @navigate key
                when 'enter'
                    return @loadSelected()
        'unhandled'
        
module.exports = Titlebar

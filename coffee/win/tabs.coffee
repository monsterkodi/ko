###
000000000   0000000   0000000     0000000
   000     000   000  000   000  000     
   000     000000000  0000000    0000000 
   000     000   000  000   000       000
   000     000   000  0000000    0000000 
###

{ post, stopEvent, popup, valid, empty, first, slash, elem, last, drag, pos, error, log, $, _ } = require 'kxk'

Tab = require './tab'

class Tabs
    
    constructor: (titlebar) ->
        
        @emptyid = 0
        @tabs = []
        @div = elem class: 'tabs'
        
        titlebar.insertBefore @div, $ ".minimize"
        
        @div.addEventListener 'click',       @onClick
        @div.addEventListener 'contextmenu', @onContextMenu
        
        @drag = new drag
            target: @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop
        
        post.on 'newTabWithFile',   @onNewTabWithFile
        post.on 'newEmptyTab',      @onNewEmptyTab
        
        post.on 'closeTabOrWindow', @onCloseTabOrWindow
        post.on 'closeOtherTabs',   @onCloseOtherTabs
        post.on 'stash',            @stash
        post.on 'dirty',            @onDirty
        post.on 'restore',          @restore
        post.on 'revertFile',       @revertFile
        post.on 'sendTabs',         @onSendTabs
        post.on 'fileLineChanges',  @onFileLineChanges
        post.on 'fileSaved',        @onFileSaved
        
    onSendTabs: (winID) =>
        
        t = ''
        for tab in @tabs
            t += tab.div.innerHTML
        post.toWin winID, 'winTabs', window.winID, t

    onFileLineChanges: (file, lineChanges) =>
        
        tab = @tab file
        if tab? and tab != @activeTab()
            # log 'apply foreignChanges in inactive tab', file, tab.info
            tab.foreignChanges lineChanges
        
    onFileSaved: (file, winID) =>

        if winID == window.winID
            error "fileSaved from this window? #{file} #{winID}" 
            return 
        tab = @tab file
        if tab? and tab != @activeTab()
            log "reverting tab because foreign window saved #{file}", tab.info
            tab.revert()
            
    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) =>
            
        if tab = @tab event.target
            if event.target.classList.contains 'dot'
                @onCloseTabOrWindow tab
            else
                tab.activate()
        true

    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    onDragStart: (d, event) => 
        
        @dragTab = @tab event.target
        
        return 'skip' if empty @dragTab
        return 'skip' if event.button != 1
        
        @dragDiv = @dragTab.div.cloneNode true
        @dragTab.div.style.opacity = '0'
        br = @dragTab.div.getBoundingClientRect()
        @dragDiv.style.position = 'absolute'
        @dragDiv.style.top  = "#{br.top}px"
        @dragDiv.style.left = "#{br.left}px"
        @dragDiv.style.width = "#{br.width}px"
        @dragDiv.style.height = "#{br.height}px"
        @dragDiv.style.flex = 'unset'
        @dragDiv.style.pointerEvents = 'none'
        document.body.appendChild @dragDiv

    onDragMove: (d,e) =>
        
        @dragDiv.style.transform = "translateX(#{d.deltaSum.x}px)"
        if tab = @tabAtX d.pos.x
            if tab.index() != @dragTab.index()
                @swap tab, @dragTab
        
    onDragStop: (d,e) =>
        
        @dragTab.div.style.opacity = ''
        @dragDiv.remove()

    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
    
    tab: (id) ->
        
        log "tabs.tab id:#{id}"
        if _.isNumber  id then return @tabs[id]
        if _.isElement id then return _.find @tabs, (t) -> t.div.contains id
        if _.isString  id then return _.find @tabs, (t) -> t.info.file == id

    activeTab: -> _.find @tabs, (t) -> t.isActive()
    numTabs:   -> @tabs.length
    
    tabAtX: (x) -> 
        
        _.find @tabs, (t) -> 
            br = t.div.getBoundingClientRect()
            br.left <= x <= br.left + br.width
    
    #  0000000  000       0000000    0000000  00000000  
    # 000       000      000   000  000       000       
    # 000       000      000   000  0000000   0000000   
    # 000       000      000   000       000  000       
    #  0000000  0000000   0000000   0000000   00000000  
    
    closeTab: (tab = @activeTab(), opt) ->
        
        if tab.dirty()
            tab.saveChanges()
            
        if not opt?.skipActivate
            tab.nextOrPrev().activate()
            
        tab.close()
        
        _.pull @tabs, tab
        
        if not opt?.skipUpdate
            @update()
        @
          
    onCloseTabOrWindow: (tab) =>
        
        if @numTabs() == 1
            window.win.close()
        else
            @closeTab tab

    onCloseOtherTabs: => 
        
        keep = _.pullAt @tabs, @activeTab().index()
        while @numTabs()
            tab = last @tabs
            if tab.dirty()
                tab.saveChanges()
            @tabs.pop().close() 
        @tabs = keep
        @update()
    
    #  0000000   0000000    0000000          000000000   0000000   0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000000000  000   000  000   000           000     000000000  0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000   000  0000000    0000000             000     000   000  0000000    
    
    addTab: (file) ->

        log 'tabs.addTab', file
        if @tabs.length > 4
            for index in [0...@tabs.length]
                if not @tabs[index].dirty()
                    @closeTab @tabs[index], skipActivate:true, skipUpdate:true
                    break
        
        tab = new Tab @
        tab.update file:file
        @tabs.push tab
        tab.setActive()
        @update()
            
        tab

    onNewEmptyTab: =>
        
        @emptyid += 1
        log "tabs.onNewEmptyTab #{@emptyid}"
        @addTab("untitled-#{@emptyid}").activate()
        
    onNewTabWithFile: (file) =>
        
        log "Tabs.onNewTabWithFile file:#{file}"
        
        [file, line, col] = slash.splitFileLine file
        
        if tab = @tab file
            tab.activate()
        else
            @addTab(file).activate()
            
        if line or col
            
            post.emit 'singleCursorAtPos', [col, line-1]

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigate: (key) ->
        
        index = @activeTab().index()
        index += switch key
            when 'left' then -1
            when 'right' then +1
        index = (@numTabs() + index) % @numTabs()
        @tabs[index].activate()

    swap: (ta, tb) ->
        
        return if not ta? or not tb?
        [ta, tb] = [tb, ta] if ta.index() > tb.index()
        @tabs[ta.index()]   = tb
        @tabs[tb.index()+1] = ta
        @div.insertBefore tb.div, ta.div
        @update()
    
    move: (key) ->
        
        tab = @activeTab()
        switch key
            when 'left'  then @swap tab, tab.prev() 
            when 'right' then @swap tab, tab.next()

    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000  
    # 000   000  000       000          000     000   000  000   000  000       
    # 0000000    0000000   0000000      000     000   000  0000000    0000000   
    # 000   000  000            000     000     000   000  000   000  000       
    # 000   000  00000000  0000000      000      0000000   000   000  00000000  

    stash: => 

        files = ( t.file() for t in @tabs )
        files = files.filter (file) -> not file.startsWith 'untitled'
        
        window.stash.set 'tabs', 
            files:  files
            active: Math.min @activeTab()?.index(), files.length-1
    
    restore: =>
        
        active = window.stash.get 'tabs:active', 0
        files  = window.stash.get 'tabs:files'
        
        return if empty files # happens when first window opens
        
        log 'tabs.restore'
        
        if valid @tabs
            @tabs[0].update file:files.shift(), type:'file'
            
        while files.length
            @addTab files.shift()
        
        @tabs[active]?.activate()
            
        @update()

    revertFile: (file) => @tab(file)?.revert()
        
    # 000   000  00000000   0000000     0000000   000000000  00000000    
    # 000   000  000   000  000   000  000   000     000     000         
    # 000   000  00000000   000   000  000000000     000     0000000     
    # 000   000  000        000   000  000   000     000     000         
    #  0000000   000        0000000    000   000     000     00000000    
    
    update: ->

        # log 'tabs.update'
        
        @stash()

        return if empty @tabs
        
        pkg = @tabs[0].info.pkg
        @tabs[0].showPkg()
        for tab in @tabs.slice 1
            if tab.info.pkg == pkg
                tab.hidePkg()
            else
                pkg = tab.info.pkg
                tab.showPkg()
        @

    onDirty: (dirty) =>
        
        log 'tabs.onDirty', dirty
        @activeTab()?.setDirty dirty
        
    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000       000   000  0000  000     000     000        000 000      000     
    # 000       000   000  000 0 000     000     0000000     00000       000     
    # 000       000   000  000  0000     000     000        000 000      000     
    #  0000000   0000000   000   000     000     00000000  000   000     000     
    
    onContextMenu: (event) => stopEvent event, @showContextMenu pos event
              
    showContextMenu: (absPos) =>
        
        if tab = @tab event.target
            tab.activate()
            
        if not absPos?
            absPos = pos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Close Other Tabs'
            combo:  'ctrl+shift+w' 
        ,
            text:   'New Window'
            combo:  'ctrl+shift+n' 
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt        
        
module.exports = Tabs

###
000000000   0000000   0000000     0000000
   000     000   000  000   000  000
   000     000000000  0000000    0000000
   000     000   000  000   000       000
   000     000   000  0000000    0000000
###

{ $, _, drag, elem, empty, filter, first, kerror, klog, kpos, last, popup, post, prefs, slash, stopEvent } = require 'kxk'

Tab = require './tab'

class Tabs

    @: (titlebar) ->

        @emptyid = 0
        @tabs = []
        @div = elem class: 'tabs'

        titlebar.insertBefore @div, $ ".minimize"

        @div.addEventListener 'click'       @onClick
        @div.addEventListener 'contextmenu' @onContextMenu

        @drag = new drag
            target:  @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop

        post.on 'newTabWithFile'   @onNewTabWithFile
        post.on 'newEmptyTab'      @onNewEmptyTab

        post.on 'closeTabOrWindow' @onCloseTabOrWindow
        post.on 'closeOtherTabs'   @onCloseOtherTabs
        post.on 'stash'            @stash
        post.on 'dirty'            @onDirty
        post.on 'restore'          @restore
        post.on 'revertFile'       @revertFile
        post.on 'sendTabs'         @onSendTabs
        post.on 'fileLineChanges'  @onFileLineChanges
        post.on 'fileSaved'        @onFileSaved

    onSendTabs: (winID) =>

        t = ''
        for tab in @tabs
            t += tab.div.innerHTML
        post.toWin winID, 'winTabs' window.winID, t

    onFileLineChanges: (file, lineChanges) =>

        tab = @tab file
        if tab? and tab != @activeTab()
            tab.foreignChanges lineChanges

    onFileSaved: (file, winID) =>

        if winID == window.winID
            return kerror "fileSaved from this window? #{file} #{winID}"
            
        tab = @tab file
        if tab? and tab != @activeTab()
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

        return 'skip' if event.target.classList.contains 'tab'
        
        if event.target.classList.contains 'tabstate'
            # @dragTab?.togglePinned()
            # delete @dragTab
            return 'skip' 
        
        @dragTab = @tab event.target

        return 'skip' if empty @dragTab
        return 'skip' if event.button != 0

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

        if _.isNumber  id then return @tabs[id]
        if _.isElement id then return _.find @tabs, (t) -> t.div.contains id
        if _.isString  id then return _.find @tabs, (t) -> t.file == id

    activeTab: (create) ->

        if not @tabs.length and create
            tab = @onNewEmptyTab()
            tab.setActive()
            return tab
            
        tab = _.find @tabs, (t) -> t.isActive()
        
        if not tab and create
            tab = first @tabs
            tab.setActive()
            
        tab

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

    closeTab: (tab) ->

        _.pull @tabs, tab.close()
        
        if empty @tabs
            @onNewEmptyTab()
        @

    onCloseTabOrWindow: (tab) =>

        if @numTabs() <= 1
            post.emit 'menuAction' 'close'
        else
            tab ?= @activeTab()
            tab.nextOrPrev().activate()
            @closeTab tab
            @update()

    onCloseOtherTabs: =>

        return if not @activeTab() # should not happen
        # keep = _.pullAt @tabs, @activeTab().index()
        # keep = filter @tabs, (t) => not t.pinned and t != @activeTab()
        keep = filter @tabs, (t) => t.pinned or t == @activeTab()
        clse = filter @tabs, (t) => not t.pinned and t != @activeTab()
        klog 'closeOtherTabs' keep.length, close.length
        # while @numTabs()
            # @tabs.pop().close()
        # @tabs = keep
        for t in clse
            @closeTab t
        @update()

    #  0000000   0000000    0000000          000000000   0000000   0000000
    # 000   000  000   000  000   000           000     000   000  000   000
    # 000000000  000   000  000   000           000     000000000  0000000
    # 000   000  000   000  000   000           000     000   000  000   000
    # 000   000  0000000    0000000             000     000   000  0000000

    addTab: (file) ->

        if @tabs.length >= prefs.get 'maximalNumberOfTabs' 8
            for index in [0...@tabs.length]
                if not @tabs[index].dirty and not @tabs[index].pinned
                    @closeTab @tabs[index]
                    break

        @tabs.push new Tab @, file
        last @tabs

    onNewEmptyTab: =>

        @emptyid += 1
        tab = @addTab("untitled-#{@emptyid}").activate()
        @update()
        tab

    onNewTabWithFile: (file) =>

        log 'onNewTabWithFile' file
        [file, line, col] = slash.splitFileLine file

        if tab = @tab file
            tab.activate()
        else
            @addTab(file).activate()

        @update()

        if line or col

            post.emit 'singleCursorAtPos' [col, line-1]

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

        files  = ( t.file for t in @tabs )
        pinned = ( t.pinned for t in @tabs )
        files  = files.filter (file) -> not file.startsWith 'untitled'

        window.stash.set 'tabs',
            files:  files
            pinned: pinned
            active: Math.min @activeTab()?.index(), files.length-1

    restore: =>

        active = window.stash.get 'tabs|active' 0
        files  = window.stash.get 'tabs|files'
        pinned = window.stash.get 'tabs|pinned'
        pinned ?= []

        return if empty files # happens when first window opens

        @tabs = []

        while files.length
            @addTab files.shift()

        @tabs[active]?.activate()
        
        for pi in 0...pinned.length
            if pinned[pi]
                @tabs[pi].togglePinned()

        @update()

    revertFile: (file) => @tab(file)?.revert()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: ->

        @stash()

        return if empty @tabs

        pkg = @tabs[0].pkg
        @tabs[0].showPkg()
        for tab in @tabs.slice 1
            if tab.pkg == pkg
                tab.hidePkg()
            else
                pkg = tab.pkg
                tab.showPkg()
        @

    onDirty: (dirty) =>

        @activeTab()?.setDirty dirty

    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000
    # 000       000   000  0000  000     000     000        000 000      000
    # 000       000   000  000 0 000     000     0000000     00000       000
    # 000       000   000  000  0000     000     000        000 000      000
    #  0000000   0000000   000   000     000     00000000  000   000     000

    onContextMenu: (event) => stopEvent event, @showContextMenu kpos event

    showContextMenu: (absPos) =>

        if tab = @tab event.target
            tab.activate()

        if not absPos?
            absPos = kpos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top

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

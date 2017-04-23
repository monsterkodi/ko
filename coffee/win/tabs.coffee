# 000000000   0000000   0000000     0000000
#    000     000   000  000   000  000     
#    000     000000000  0000000    0000000 
#    000     000   000  000   000       000
#    000     000   000  0000000    0000000 

{ post, elem, error, log, _
} = require 'kxk'

Tab = require './tab'

class Tabs
    
    constructor: (view) ->
        
        @tabs = []
        @div = elem class: 'tabs'
        view.appendChild @div
        
        @div.addEventListener 'click', @onClick
        
        @tabs.push new Tab @
        @tabs[0].setActive()
        
        post.on 'newTabWithFile',   @onNewTabWithFile
        post.on 'closeTabOrWindow', @onCloseTabOrWindow
        post.on 'stash',            @stash
        post.on 'restore',          @restore
        post.on 'revertFile',       @revertFile

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) =>
            
        if tab = @tab event.target
            if event.target.classList.contains 'dot'
                if @numTabs() == 1
                    @tabs[0].update file: null
                    @tabs[0].activate()
                else
                    @closeTab tab
            else
                tab.activate()
        true

    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
    
    tab: (id) ->
        if _.isElement id
            _.find @tabs, (t) -> t.div.contains id
        else if _.isNumber id
            @tabs[id]
        else if _.isString id
            _.find @tabs, (t) -> t.info.file == id

    activeTab: -> _.find @tabs, (t) -> t.isActive()
    numTabs:   -> @tabs.length
        
    #  0000000  000       0000000    0000000  00000000  
    # 000       000      000   000  000       000       
    # 000       000      000   000  0000000   0000000   
    # 000       000      000   000       000  000       
    #  0000000  0000000   0000000   0000000   00000000  
    
    closeTab: (tab = @activeTab()) ->
        tab.nextOrPrev().activate()
        tab.close()
        _.pull @tabs, tab
        @update()
        @
  
    onCloseTabOrWindow: =>
        if @numTabs() == 1
            window.win.close()
        else
            @closeTab()

    closeOthers: -> 
        
        keep = _.pullAt @tabs, @activeTab().index()
        while @numTabs()
            @tabs.pop().close()
        @tabs = keep
        @update()
    
    #  0000000   0000000    0000000          000000000   0000000   0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000000000  000   000  000   000           000     000000000  0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000   000  0000000    0000000             000     000   000  0000000    
    
    addTab: (file) ->
        tab = new Tab @
        tab.update file:file
        @tabs.push tab
        @update()
        tab

    onNewTabWithFile: (file) => @addTab(file).activate()

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

    stash: => window.stash.set 'tabs', 
        files:  ( t.file() for t in @tabs )
        active: @activeTab().index()
    
    restore: =>
        
        files =  window.stash.get 'tabs:files'
        return if _.isEmpty files # happens when first window opens
        
        @tabs[0].update file: files.shift()
        while files.length
            @addTab files.shift()
            
        if active = window.stash.get 'tabs:active', 0
            @tabs[active].activate()
        else
            @tabs[0].activate()
            
        @update()

    revertFile: (file) => @tab(file)?.revert()
        
    # 000   000  00000000   0000000     0000000   000000000  00000000    
    # 000   000  000   000  000   000  000   000     000     000         
    # 000   000  00000000   000   000  000000000     000     0000000     
    # 000   000  000        000   000  000   000     000     000         
    #  0000000   000        0000000    000   000     000     00000000    
    
    update: ->
        
        @div.style.webkitAppRegion = @tabs.length <= 1 and 'drag' or 'no-drag'
        @stash()

        pkg = @tabs[0].info.pkg
        @tabs[0].showPkg()
        for tab in @tabs.slice 1
            if tab.info.pkg == pkg
                tab.hidePkg()
            else
                pkg = tab.info.pkg
                tab.showPkg()
        @
        
module.exports = Tabs

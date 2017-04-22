# 000000000   0000000   0000000     0000000
#    000     000   000  000   000  000     
#    000     000000000  0000000    0000000 
#    000     000   000  000   000       000
#    000     000   000  0000000    0000000 

{ post, elem, log, _
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
        @updateSingle()
    
    # 000   000  00000000  000   000      000000000   0000000   0000000    
    # 0000  000  000       000 0 000         000     000   000  000   000  
    # 000 0 000  0000000   000000000         000     000000000  0000000    
    # 000  0000  000       000   000         000     000   000  000   000  
    # 000   000  00000000  00     00         000     000   000  0000000    
    
    newTab: -> 
        @tabs.push new Tab @
        _.last(@tabs).activate()
        @updateSingle()
    
    onNewTabWithFile: (file) =>
        tab = new Tab @
        tab.update file:file
        @tabs.push tab
        tab.activate()
        @updateSingle()

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
        true
        
    updateSingle: ->
        @div.style.webkitAppRegion = @tabs.length <= 1 and 'drag' or 'no-drag'
        @
        
module.exports = Tabs

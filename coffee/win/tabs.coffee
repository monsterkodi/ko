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
        
        post.on 'newTabWithFile', @onNewTabWithFile


    onClick: (event) =>
        
        if tab = @tab event.target
            tab.activate()

    tab: (id) ->
        if _.isElement id
            _.find @tabs, (t) -> t.div.contains id
        else if _.isNumber id
            @tabs[id]

    activeTab: -> _.find @tabs, (t) -> t.isActive()
    numTabs: -> @tabs.length
        
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

    navigate: (key) -> 
        
        index = @activeTab().index()
        index += switch key
            when 'left' then -1
            when 'right' then +1
        index = (@numTabs() + index) % @numTabs()
        @tabs[index].activate()
        
    closeOthers: -> 
        
        keep = _.pullAt @tabs, @activeTab().index()
        while @numTabs()
            @tabs.pop().close()
        @tabs = keep
        @updateSingle()
        
    updateSingle: ->
        
        # @div.classList.toggle 'single', @tabs.length <= 1 
        @div.style.webkitAppRegion = @tabs.length <= 1 and 'drag' or 'no-drag'
        
module.exports = Tabs

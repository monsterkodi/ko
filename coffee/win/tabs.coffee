# 000000000   0000000   0000000     0000000
#    000     000   000  000   000  000     
#    000     000000000  0000000    0000000 
#    000     000   000  000   000       000
#    000     000   000  0000000    0000000 

{ elem, log, _
} = require 'kxk'

Tab = require './tab'

class Tabs
    
    constructor: (view) ->
        
        @tabs = []
        @div = elem class: 'tabs'
        view.appendChild @div
        
        @div.addEventListener 'click', @onClick
        
        @newTab()
        @tabs[0].setActive()
        log 'tab is active', @tabs[0].isActive()
        log 'get it', @activeTab()?

    onClick: (event) =>
        if tab = @tab event.target
            tab.setActive()
        else
            log 'click on tabs'

    tab: (id) ->
        if _.isElement id
            _.find @tabs, (t) -> t.div.contains id
        else if _.isNumber id
            tabs[id]

    activeTab: -> _.find @tabs, (t) -> t.isActive()
    numTabs: -> @tabs.length
        
    newTab: -> @tabs.push new Tab @

    navigate: (key) -> 
        
        index = @activeTab().index()
        index += switch key
            when 'left' then -1
            when 'right' then +1
        index = (@numTabs() + index) % @numTabs()
        @tabs[index].setActive()
        
    closeOthers: -> 
        
        keep = _.pullAt @tabs, @activeTab().index()
        while @numTabs()
            @tabs.pop().close()
        
        
module.exports = Tabs

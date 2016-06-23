#  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
# 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
{
fileList,
$}        = require '../tools/tools'
ViewBase  = require '../editor/viewbase'
log       = require '../tools/log'
split     = require '../split'
path      = require 'path'

class Commandline extends ViewBase
    
    constructor: (viewElem) ->
            
        @fontSizeDefault = 24

        super viewElem
        
        @hideNumbers()
        @size.lineHeight = @scroll.viewHeight
        @scroll?.setLineHeight @size.lineHeight
        @setText ""
                
        @cmmd = $('.commandline-command')
        
        @commands = {}
        @command = null

        @loadCommands()
        
        window.split.on 'paneHeight', @onPaneHeight
        
        @view.onblur = () => @command?.onBlur()

    setName: (name) -> @cmmd.innerHTML = name
                
    setLines: (l) ->
        @scroll.reset()
        super l
    
    setAndSelectText: (t) ->
        @setLines [t]
        @selectAll()

    changed: (changeInfo) ->
        super changeInfo
        if changeInfo.changed.length
            @command?.changed @lines[0]
        
    loadCommands: ->
        files = fileList "#{__dirname}/../commands"
        for file in files
            commandClass = require file
            command = new commandClass @
            command.setPrefsID commandClass.name.toLowerCase()
            @commands[command.prefsID] = command
            
    onPaneHeight: (e) => if e.paneIndex == 0 then @command?.onPosY? e.newHeight
          
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    startCommand: (name, combo) ->
        @command?.cancel()
        window.split.showCommandline()
        @command = @commands[name]
        activeClass = "."+document.activeElement.className
        @command.setFocus activeClass if activeClass != '.commandline'
        log "commandline.startCommand #{name} focus #{@command.focus}"
        @view.focus()
        @setName name
        @results @command.start combo # <-- command start
        # @setAndSelectText 
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: -> @results @command?.execute @lines[0]
        
    results: (r) ->
        @setText r.text if r?.text?
        @setName r.name if r?.name?
        if r?.select then @selectAll()
        else @selectNone() 
        # log "commandline.results #{@command?} #{@command?.name}", r
        window.split.focus  r.focus  if r?.focus?
        window.split.reveal r.reveal if r?.reveal?
        
    cancel: -> @results @command?.cancel()
                                
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    globalModKeyComboEvent: (mod, key, combo, event) ->
        for n,c of @commands            
            if combo == 'esc'
                if document.activeElement == @view
                    return @cancel()
            for sc in c.shortcuts
                if sc == combo then return @startCommand n, combo                
        return 'unhandled'            

    handleModKeyComboEvent: (mod, key, combo, event) ->
        split = window.split
        switch combo
            when 'enter'            then return @execute()
            when 'up'               then return @setAndSelectText @command?.prev()
            when 'down'             then return @setAndSelectText @command?.next()
            when 'esc'              then return @cancel()
            when 'command+k'        then return @selectAll() + @deleteSelection()
            when 'tab', 'shift+tab' then return
            when 'home', 'command+up'    then return split.do 'maximize editor'
            when 'end', 'command+down'   then return split.do 'maximize terminal'
            when 'page up', 'alt+up'     then return split.do 'enlarge editor'
            when 'ctrl+up'               then return split.do 'enlarge editor by 20'
            when 'page down', 'alt+down' then return split.do 'enlarge terminal'
            when 'ctrl+down'             then return split.do 'enlarge terminal by 20'
        
        return 'unhandled'
    
module.exports = Commandline


#  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
# 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000

{
$,fileList
}         = require '../tools/tools'
ViewBase  = require '../editor/viewbase'
log       = require '../tools/log'
path      = require 'path'

class Commandline extends ViewBase
    
    constructor: (viewElem) ->
            
        @fontSizeDefault = 24
        @fontSizeKey     = 'commandlineFontSize'
        
        super viewElem
        
        # @view.onblur =  => @command?.cancel()
        
        @cmmd = $('.commandline-command')
        
        @commands = {}
        @command = null
        
        @loadCommands()
        
    changed: (changeInfo) ->
        super changeInfo
        if changeInfo.changed.length
            @command?.changed @lines[0]
        
    loadCommands: ->
        
        files = fileList "#{__dirname}/../commands"
        
        for file in files
            commandClass = require file
            @commands[commandClass.name.toLowerCase()] = new commandClass @
                
    startCommand: (name, combo) ->
        @command?.cancel()
        window.split.showCommandline()
        @view.focus()
        @setName name

        @command = @commands[name]
        @setText @command.start combo # <-- command start
        @selectAll()
        
    setName: (name) -> 
        log "commandline.setName", name, @cmmd?
        @cmmd.innerHTML = name
        
    execute: ->
        r = @command?.execute @lines[0]
        @setText r.text if r?.text?
        window.split.focusEditor() if r?.focus == 'editor'
        
    cancel: ->
        @command?.cancel()
        window.split.focusOnEditorOrHistory()
                                
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    globalModKeyComboEvent: (mod, key, combo, event) ->
        for n,c of @commands
            if combo == 'esc' then return @cancel()
            if combo in c.shortcuts then return  @startCommand n, combo
        return 'unhandled'            

    handleModKeyComboEvent: (mod, key, combo, event) ->

        switch combo
            when 'enter' then return @execute()
            when 'up'    then return @setText @command?.prev()
            when 'down'  then return @setText @command?.next()
            when 'esc'   then return @cancel()
            when 'tab', 'shift+tab' then return
        
        return 'unhandled'
    
module.exports = Commandline

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
split     = require '../split'
path      = require 'path'

class Commandline extends ViewBase
    
    constructor: (viewElem) ->
            
        @fontSizeDefault = 24
        @fontSizeKey     = 'commandlineFontSize'
        
        super viewElem
        
        @commandMap = {}
        @command = null
        
        @loadCommands()
        
    loadCommands: ->
        
        files = fileList "#{__dirname}/../commands"
        
        for file in files
            commandClass = require file
            @commandMap[commandClass.name.toLowerCase()] = new commandClass()
        
        # log 'loadCommands', @commandMap
        
    startCommand: (name) ->
        
        split.showCommandline()
        $('.commandline-editor').focus()

        @command = @commandMap[name]
        
        # log 'startCommand', name, @command
                
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) =>

        switch combo
            when 'enter'
                @command?.execute @lines[0]
                return
            when 'up'   then return @setText @command?.prev()
            when 'down' then return @setText @command?.next()
            when 'esc'  then return split.focusOnEditorOrHistory()
            when 'tab', 'shift+tab' then return
        
        # log "commandline key:", key, "mod:", mod, "combo:", combo        
        return 'unhandled'
    
module.exports = Commandline
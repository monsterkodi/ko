
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
        
        @commands = {}
        @command = null
        
        @loadCommands()
        
    loadCommands: ->
        
        files = fileList "#{__dirname}/../commands"
        
        for file in files
            commandClass = require file
            @commands[commandClass.name.toLowerCase()] = new commandClass()
                
    startCommand: (name) ->
        
        split.showCommandline()
        $('.commandline-editor').focus()

        @command = @commands[name]
        @setText @command.last()
        @selectAll()
        @command.start()
        
    execute: ->
        r = @command?.execute @lines[0]
        switch r 
            when 'clear' then @setText ''
            when 'editor' then split.focusOnEditor()
        
                        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    globalModKeyComboEvent: (mod, key, combo, event) ->
        for n,c of @commands
            if combo == c.shortcut
                @startCommand n
                return
        return 'unhandled'            
        

    handleModKeyComboEvent: (mod, key, combo, event) ->

        switch combo
            when 'enter' then return @execute()
            when 'up'    then return @setText @command?.prev()
            when 'down'  then return @setText @command?.next()
            when 'esc'   then return split.focusOnEditorOrHistory()
            when 'tab', 'shift+tab' then return
        
        return 'unhandled'
    
module.exports = Commandline
# 0000000    000   000  000  000      0000000  
# 000   000  000   000  000  000      000   000
# 0000000    000   000  000  000      000   000
# 000   000  000   000  000  000      000   000
# 0000000     0000000   000  0000000  0000000  

log      = require '../tools/log'
Command  = require '../commandline/command'

class Build extends Command
    
    constructor: (@commandline) ->
        @cmdID      = 0
        @commands   = Object.create null
        @shortcuts  = ['command+b', 'command+shift+b']
        @names      = ["build", 'Build']
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (combo) ->
        super combo
        text:   @last()
        select: true
        do:     'reveal area'
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        @cmdID += 1
        command = command.trim()
        @commands[@cmdID] = command
        @hideList()
        do: (@name == 'Build' and 'maximize' or 'reveal') + ' area'
        
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: ->
        @area?.clear?()
        text: ''
                    
module.exports = Build

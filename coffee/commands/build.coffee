
# 0000000    000   000  000  000      0000000  
# 000   000  000   000  000  000      000   000
# 0000000    000   000  000  000      000   000
# 000   000  000   000  000  000      000   000
# 0000000     0000000   000  0000000  0000000  

{ slash, log, $, _ } = require 'kxk'

Command  = require '../commandline/command'

class Build extends Command
    
    constructor: (commandline) ->
        
        super commandline
        
        @cmdID      = 0
        @commands   = Object.create null
        @names      = ["build", 'Build']
        window.area.on 'resized', @onAreaResized

    restoreState: (state) -> 
        
        super state
        window.split.swap $('terminal'), $('area')
        @execute state.text
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (name) ->
        super name
        text:   @last()
        select: true
        do:     'show area'
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        @cmdID += 1
        command = command.trim()
        return if not command.length
        if @instance?.name == command and @instance.reset?
            @instance.reset()
        else
            if slash.dirExists "#{__dirname}/../stage/#{command}"
                if slash.fileExists "#{__dirname}/../stage/#{command}/main.js"
                    file = "#{__dirname}/../stage/#{command}/main.js"
                else if slash.fileExists "#{__dirname}/../stage/#{command}/#{command}.js"
                    file = "#{__dirname}/../stage/#{command}/#{command}.js"
            else if slash.fileExists "#{__dirname}/../#{command}/#{command}.js"
                file = "#{__dirname}/../#{command}/#{command}.js"
            else if slash.dirExists command
                if slash.fileExists "#{slash.resolve command}/main.js"
                    file = "#{slash.resolve command}/main.js"
                
            if file?
                mod = require file
                @instance?.stop?()
                view = window.area.view
                view.removeChild view.firstChild while view.firstChild
                @instance = new mod view
                @instance.name = command
                @instance.start()
                command = super command
            
        @hideList()
        
        do: (@name == 'Build' and 'maximize' or 'show') + ' area'
      
    onAreaResized: (w, h) =>
        @instance?.resized? w,h
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: ->
        @instance?.clear?()
        text: ''
                    
module.exports = Build

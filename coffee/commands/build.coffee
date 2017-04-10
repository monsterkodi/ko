# 0000000    000   000  000  000      0000000  
# 000   000  000   000  000  000      000   000
# 0000000    000   000  000  000      000   000
# 000   000  000   000  000  000      000   000
# 0000000     0000000   000  0000000  0000000  
{
fileExists,
dirExists,
resolve,
log
}        = require 'kxk'
Command  = require '../commandline/command'

class Build extends Command
    
    constructor: (@commandline) ->
        @area       = window.area
        @cmdID      = 0
        @commands   = Object.create null
        @shortcuts  = ['command+b', 'command+shift+b']
        @names      = ["build", 'Build']
        @area.on 'resized', @onAreaResized
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
            @instance.reset?()
        else
            if dirExists "#{__dirname}/../area/#{command}"
                if fileExists "#{__dirname}/../area/#{command}/main.js"
                    file = "#{__dirname}/../area/#{command}/main.js"
                else if fileExists "#{__dirname}/../area/#{command}/#{command}.js"
                    file = "#{__dirname}/../area/#{command}/#{command}.js"
            else if fileExists "#{__dirname}/../#{command}/#{command}.js"
                file = "#{__dirname}/../#{command}/#{command}.js"
            else if dirExists resolve command
                if fileExists "#{resolve command}/main.js"
                    file = "#{resolve command}/main.js"
                
            if file?
                mod = require file
                @instance?.stop?()
                @area.view.removeChild @area.view.firstChild while @area.view.firstChild
                @instance = new mod @area.view
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

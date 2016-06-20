# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
walker  = require '../tools/walker'
matchr  = require '../tools/matchr'
Command = require '../commandline/command'
path    = require 'path'
fs      = require 'fs'
stream  = require 'stream'

class Find extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+f", "command+alt+f", "command+shift+f"]
        @caseSensitive = false
        @searchFiles = false
        super
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        @caseSensitive = combo == @shortcuts[1]
        @searchInFiles = combo == @shortcuts[2]
        @setName "Find" if @caseSensitive
        @setName "Search" if @searchInFiles
        super combo
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        super command
        editor = window.editor
        if @searchInFiles
            @startSearchInFiles command, editor.currentFile
            focus: 'terminal'
        else
            editor.highlightText command, 
                caseSensitive: @caseSensitive
            if editor.highlights.length
                focus: 'editor' 
      
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000
    
    startSearchInFiles: (text, file) ->
        log "find.startSearchInFiles #{text} #{file}"
        @walker = new walker
            root:        walker.packagePath path.dirname file
            includeDirs: false
            file:        (f,stat) => @searchInFile text, f
        @walker.cfg.ignore.push 'js'
        @walker.start()
        
    searchInFile: (text, file) ->
        # log "find.searchInFile #{text} #{file}"
        stream = fs.createReadStream file, encoding: 'utf8'
        stream.pipe new FileSearcher text, file

#  0000000  00000000   0000000   00000000    0000000  000   000  00000000  00000000 
# 000       000       000   000  000   000  000       000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000  0000000   0000000  
#      000  000       000   000  000   000  000       000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000  00000000  000   000

class FileSearcher extends stream.Writable
    
    constructor: (@text, @file) ->
        @line = 0
        @patterns = matchr.config "(#{@text})": "found"
        @found = []
        super
    
    write: (chunk, encoding, cb) ->        
        lines = chunk.split '\n'
        # log "FileSearcher.write #{lines.length} lines from #{@file}"
        for l in lines
            @line += 1            
            rngs = matchr.ranges @patterns, l
            if rngs.length
                # log "#{@line}: #{l}"
                # log "rngs #{rngs.length}", rngs
                @found.push [@line, l, rngs]
        true
    
    end: (chunk, encoding, cb) ->
        if @found.length
            log "#{@file}:"
            for f in @found
                dss = matchr.dissect f[2]
                log "#{_.padStart f[0], 4} #{f[1]}" #, dss
                
module.exports = Find
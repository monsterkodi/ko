#  0000000  00000000   0000000   00000000    0000000  000   000
# 000       000       000   000  000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000
#      000  000       000   000  000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000

log     = require '../tools/log'
walker  = require '../tools/walker'
matchr  = require '../tools/matchr'
syntax  = require '../editor/syntax'
Command = require '../commandline/command'
path    = require 'path'
fs      = require 'fs'
stream  = require 'stream'

class Search extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+shift+f", "ctrl+shift+f", "alt+shift+f"]
        @caseSensitive = false
        @regexpSearch = false
        super
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        @caseSensitive = combo == @shortcuts[1]
        @regexpSearch = combo == @shortcuts[2]
        @setName "Search" if @caseSensitive
        @setName "/search/" if @regexpSearch
        super combo
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        super command
        editor = window.editor
        @startSearchInFiles command, editor.currentFile
        focus: '.terminal'
        reveal: 'terminal'
      
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000
    
    startSearchInFiles: (text, file) ->
        window.terminal.appendText ''
        window.terminal.appendDiss syntax.dissForTextAndSyntax "▶ Search for '#{text}':", 'ko'       
        window.terminal.appendText ''
        @walker = new walker
            root:        walker.packagePath path.dirname file
            includeDirs: false
            file:        (f,stat) => @searchInFile text, f
        @walker.cfg.ignore.push 'js'
        @walker.start()
        
    searchInFile: (text, file) ->
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
        @patterns = matchr.config "#{@text}": "found"
        @found = []
        super
    
    write: (chunk, encoding, cb) ->        
        lines = chunk.split '\n'
        for l in lines
            @line += 1            
            rngs = matchr.ranges @patterns, l
            if rngs.length
                @found.push [@line, l, rngs]
        true
    
    end: (chunk, encoding, cb) ->
        if @found.length
            window.terminal.appendText ''
            window.terminal.appendDiss syntax.dissForTextAndSyntax "● #{@file}:", 'ko'
            window.terminal.appendText ''
            for f in @found
                ranges = f[2].concat syntax.rangesForTextAndSyntax f[1], 'coffee'
                dss = matchr.dissect ranges, join:true
                window.terminal.appendLineDiss f[1], dss                
                
module.exports = Search
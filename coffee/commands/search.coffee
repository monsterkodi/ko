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
_       = require 'lodash'
stream  = require 'stream'
path    = require 'path'
fs      = require 'fs'

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
        return if not command.length
        super command
        @startSearchInFiles 
            text: command
            regx: @regexpSearch and command or _.escapeRegExp command
            file: window.editor.currentFile
            case: @caseSensitive # doesnt work yet
        focus: '.terminal'
        reveal: 'terminal'
      
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000
    
    startSearchInFiles: (opt) ->
        terminal = window.terminal
        terminal.appendText ''
        terminal.appendDiss syntax.dissForTextAndSyntax "▸ Search for '#{opt.text}':", 'ko'
        terminal.appendText ''
        terminal.singleCursorAtPos [0, terminal.lines.length-1]
        @walker = new walker
            root:        walker.packagePath path.dirname opt.file
            includeDirs: false
            file:        (f,stat) => @searchInFile opt, f
        @walker.cfg.ignore.push 'js'
        @walker.start()
        
    searchInFile: (opt, file) ->
        stream = fs.createReadStream file, encoding: 'utf8'
        stream.pipe new FileSearcher opt, file

#  0000000  00000000   0000000   00000000    0000000  000   000  00000000  00000000 
# 000       000       000   000  000   000  000       000   000  000       000   000
# 0000000   0000000   000000000  0000000    000       000000000  0000000   0000000  
#      000  000       000   000  000   000  000       000   000  000       000   000
# 0000000   00000000  000   000  000   000   0000000  000   000  00000000  000   000

class FileSearcher extends stream.Writable
    
    constructor: (@opt, @file) ->
        @line = 0
        @patterns = matchr.config "#{@opt.regx}": "found"
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
            terminal = window.terminal
            meta = 
                diss: syntax.dissForTextAndSyntax "● #{@file}:", 'ko'
                href: @file
            terminal.appendMeta meta
            terminal.appendMeta clss: 'spacer'
            
            for f in @found
                rgs = f[2].concat syntax.rangesForTextAndSyntax f[1], syntax.nameForFile @file
                matchr.sortRanges rgs
                dss = matchr.dissect rgs, join:true
                meta =
                    diss: dss
                    href: "#{@file}:#{f[0]}"
                    clss: 'searchResult'
                terminal.appendMeta meta
                
            terminal.appendMeta clss: 'spacer'
            terminal.scrollCursorToTop 3
                
module.exports = Search
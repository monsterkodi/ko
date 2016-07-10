# 000  000   000  0000000    00000000  000   000  00000000  00000000 
# 000  0000  000  000   000  000        000 000   000       000   000
# 000  000 0 000  000   000  0000000     00000    0000000   0000000  
# 000  000  0000  000   000  000        000 000   000       000   000
# 000  000   000  0000000    00000000  000   000  00000000  000   000

log = require './tools/log'
_   = require 'lodash'
fs  = require 'fs'

class Indexer
    
    constructor: () ->
        
        @files   = {}
        @classes = {}
        @words   = {}
        
        @splitRegExp = new RegExp "[^\\w\\d#\\_]+", 'g'        
        
    indexFile: (file) ->
        fs.readFile file, 'utf8', (err, data) =>
            
            lines = data.split /\r?\n/
            _.set @files, "#{file}.lines", lines.length
            
            currentClass = null
            for li in [0...lines.length]
                line = lines[li]
                
                if currentClass? and line.trim().length                    
                    indent = line.search /\S/
                    if indent < 4
                        currentClass = null
                    else if indent == 4
                        m = line.match /^\s+(\w+)\s*\:\s*(\([\w\s\,]*\))?\s*[=-]\>/
                        if m?[1]?
                            _.set @classes, "#{currentClass}.methods.#{m[1]}", 
                                line: li                
                
                words = line.split @splitRegExp
                for word in words
                    _.update @words, "#{word}.count", (n) -> (n ? 0) + 1 
                    
                    switch word
                        when 'class'
                            m = line.match /^\s*class\s+(\w+)(\s+extends\s\w+)?/
                            if m?[1]?
                                currentClass = m[1]
                                _.set @classes, "#{m[1]}", 
                                    file: file
                                    line: li
                        when 'require'
                            m = line.match /^\s*(\w+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
                            if m?[1]? and m[2]?
                                _.update @files, "#{file}.require", (r) => 
                                    if r? then r.push [m[1], m[2]]
                                    else r = [[m[1], m[2]]]
                                    r                    
                    
            log "indexer.indexFile #{file} classes:", @classes, "\nfiles:", @files
            
module.exports = Indexer
# 000  000   000  0000000    00000000  000   000  00000000  00000000 
# 000  0000  000  000   000  000        000 000   000       000   000
# 000  000 0 000  000   000  0000000     00000    0000000   0000000  
# 000  000  0000  000   000  000        000 000   000       000   000
# 000  000   000  0000000    00000000  000   000  00000000  000   000
{
fileExists,
resolve
}    = require './tools/tools'
log  = require './tools/log'
_    = require 'lodash'
fs   = require 'fs'
path = require 'path'

class Indexer
    
    constructor: () ->
        
        @files   = {}
        @classes = {}
        @words   = {}
        @queue   = [] 
        
        @splitRegExp = new RegExp "[^\\w\\d#\\_]+", 'g'        
      
    # 000  000   000  0000000    00000000  000   000  00000000  000  000      00000000
    # 000  0000  000  000   000  000        000 000   000       000  000      000     
    # 000  000 0 000  000   000  0000000     00000    000000    000  000      0000000 
    # 000  000  0000  000   000  000        000 000   000       000  000      000     
    # 000  000   000  0000000    00000000  000   000  000       000  0000000  00000000
    
    indexFile: (file) ->
        
        return if @files[file]?
        
        fs.readFile file, 'utf8', (err, data) =>
            return if err?
            lines = data.split /\r?\n/
            fileInfo = 
                lines: lines.length
            
            currentClass = null
            for li in [0...lines.length]
                line = lines[li]
                
                if currentClass? and line.trim().length                    
                    indent = line.search /\S/
                    if indent < 4
                        currentClass = null
                    else if indent == 4
                        m = line.match /^\s+([\@]?\w+)\s*\:\s*(\([\w\s\,]*\))?\s*[=-]\>/
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
                            m = line.match /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
                            if m?[1]? and m[2]?
                                r = fileInfo.require ? []
                                r.push [m[1], m[2]]
                                fileInfo.require = r
                                
                                abspath = resolve path.join path.dirname(file), m[2] 
                                abspath += '.coffee'
                                if (m[2][0] == '.') and (not @files[abspath]?) and (@queue.indexOf(abspath) < 0)
                                    if fileExists abspath 
                                        @queue.push abspath
                                    
            @files[file] = fileInfo
                    
            if @queue.length
                file = @queue.shift()
                @indexFile file
                        
module.exports = Indexer

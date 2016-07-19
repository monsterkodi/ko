# 000  000   000  0000000    00000000  000   000  00000000  00000000 
# 000  0000  000  000   000  000        000 000   000       000   000
# 000  000 0 000  000   000  0000000     00000    0000000   0000000  
# 000  000  0000  000   000  000        000 000   000       000   000
# 000  000   000  0000000    00000000  000   000  00000000  000   000
{
fileExists,
resolve,
last
}        = require './tools/tools'
log      = require './tools/log'
Walker   = require './tools/walker'
_        = require 'lodash'
fs       = require 'fs'
path     = require 'path'
electron = require 'electron'

BrowserWindow = electron.BrowserWindow

class Indexer
    
    @requireRegExp = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
    @classRegExp   = /^\s*class\s+(\w+)(\s+extends\s\w+)?/
    @includeRegExp = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/
    @methodRegExp  = /^\s+([\@]?\w+)\s*\:\s*(\([^\)]*\))?\s*[=-]\>/
    @funcRegExp    = /^\s*([\w\.]+)\s*[\:\=]\s*(\([^\)]*\))?\s*[=-]\>/
    @splitRegExp   = new RegExp "[^\\w\\d#\\_]+", 'g'        
    
    constructor: () ->
        @collectBins()
        @dirs    = Object.create null
        @files   = Object.create null
        @classes = Object.create null
        @funcs   = Object.create null
        @words   = Object.create null
        @walker  = null
        @queue   = [] 
    
    collectBins: ->
        @bins = []
        for dir in ['/bin', '/usr/bin', '/usr/local/bin']
            @walker = new Walker 
                root:        dir
                includeDirs: false
                includeExt:  [''] # report files without extension
                file:        (p) => @bins.push path.basename p            
            @walker.start()        
    
    # 000  000   000  0000000    00000000  000   000        0000000    000  00000000 
    # 000  0000  000  000   000  000        000 000         000   000  000  000   000
    # 000  000 0 000  000   000  0000000     00000          000   000  000  0000000  
    # 000  000  0000  000   000  000        000 000         000   000  000  000   000
    # 000  000   000  0000000    00000000  000   000        0000000    000  000   000
    
    indexDir: (dir) ->
        
        return if not dir? or @dirs[dir]?
        @dirs[dir] = 
            name: path.basename dir
            
        wopt = 
            root:        dir
            includeDir:  dir
            includeDirs: true
            dir:         @onWalkerDir
            file:        @onWalkerFile
            done:        @shiftQueue
        
        @walker = new Walker wopt
        @walker.cfg.ignore.push 'js'
        @walker.start()        
    
    onWalkerDir: (p, stat) =>
        if not @dirs[p]?
            @dirs[p] = 
                name: path.basename p
        
    onWalkerFile: (p, stat) =>
        if not @files[p]? and @queue.indexOf(p) < 0
            @queue.push p
            
    # 000  000   000  0000000    00000000  000   000        00000000  000  000      00000000
    # 000  0000  000  000   000  000        000 000         000       000  000      000     
    # 000  000 0 000  000   000  0000000     00000          000000    000  000      0000000 
    # 000  000  0000  000   000  000        000 000         000       000  000      000     
    # 000  000   000  0000000    00000000  000   000        000       000  0000000  00000000
    
    indexFile: (file) ->
        
        return @shiftQueue() if @files[file]?
        
        fs.readFile file, 'utf8', (err, data) =>
            return if err?
            lines = data.split /\r?\n/
            fileInfo = 
                lines: lines.length
                funcs: []
            funcAdded = false
            funcStack = []
            currentClass = null
            for li in [0...lines.length]
                line = lines[li]
                
                if line.trim().length # ignoring empty lines
                    indent = line.search /\S/
                    
                    while funcStack.length and indent <= last(funcStack)[0]
                        last(funcStack)[1].last = li - 1
                        funcInfo = funcStack.pop()
                        fileInfo.funcs.push [funcInfo[1].line, funcInfo[1].last, funcInfo[2], funcInfo[1].class ? path.basename file, path.extname file]
            
                    if currentClass? and indent == 4   
                        
                        # 00     00  00000000  000000000  000   000   0000000   0000000     0000000
                        # 000   000  000          000     000   000  000   000  000   000  000     
                        # 000000000  0000000      000     000000000  000   000  000   000  0000000 
                        # 000 0 000  000          000     000   000  000   000  000   000       000
                        # 000   000  00000000     000     000   000   0000000   0000000    0000000 
                        
                        m = line.match Indexer.methodRegExp
                        if m?[1]?
                            _.set @classes, "#{currentClass}.methods.#{m[1]}", 
                                line: li
                                
                            funcInfo = 
                                line:  li
                                file:  file
                                class: currentClass
                            
                            funcName = m[1]
                            if funcName.startsWith '@'
                                funcName = funcName.slice 1 
                                funcInfo.static = true
                                
                            funcInfos = @funcs[funcName] ? []
                            funcInfos.push funcInfo
                            @funcs[funcName] = funcInfos
                                                        
                            funcStack.push [indent, funcInfo, funcName]
                            
                            funcAdded = true
                    else
                        
                        # 00000000  000   000  000   000   0000000  000000000  000   0000000   000   000   0000000
                        # 000       000   000  0000  000  000          000     000  000   000  0000  000  000     
                        # 000000    000   000  000 0 000  000          000     000  000   000  000 0 000  0000000 
                        # 000       000   000  000  0000  000          000     000  000   000  000  0000       000
                        # 000        0000000   000   000   0000000     000     000   0000000   000   000  0000000 
                        
                        currentClass = null if indent < 4
                        m = line.match Indexer.funcRegExp
                        if m?[1]?
                            
                            funcInfo = 
                                line: li
                                file: file
                                
                            funcInfos = @funcs[m[1]] ? []
                            funcInfos.push funcInfo
                            @funcs[m[1]] = funcInfos
                                                        
                            funcStack.push [indent, funcInfo, m[1]]
                            funcAdded = true

                words = line.split Indexer.splitRegExp
                for word in words
                    
                    switch 
                        when word.length < 2 then
                        when word[0] in ['-', "#", '_'] and word.length < 3 then
                        when /^[0\_\-\@\#]+$/.test word then
                        when /^[\-]?[\d]+$/.test word then
                        else
                            _.update @words, "#{word}.count", (n) -> (n ? 0) + 1 
                    
                    switch word
                        
                        #  0000000  000       0000000    0000000   0000000
                        # 000       000      000   000  000       000     
                        # 000       000      000000000  0000000   0000000 
                        # 000       000      000   000       000       000
                        #  0000000  0000000  000   000  0000000   0000000 
                        when 'class'
                            m = line.match Indexer.classRegExp
                            if m?[1]?
                                currentClass = m[1]
                                _.set @classes, "#{m[1]}", 
                                    file: file
                                    line: li
                                    
                        # 00000000   00000000   0000000   000   000  000  00000000   00000000
                        # 000   000  000       000   000  000   000  000  000   000  000     
                        # 0000000    0000000   000 00 00  000   000  000  0000000    0000000 
                        # 000   000  000       000 0000   000   000  000  000   000  000     
                        # 000   000  00000000   00000 00   0000000   000  000   000  00000000
                        when 'require'
                            m = line.match Indexer.requireRegExp
                            if m?[1]? and m[2]?
                                r = fileInfo.require ? []
                                r.push [m[1], m[2]]
                                fileInfo.require = r
                                abspath = resolve path.join path.dirname(file), m[2] 
                                abspath += '.coffee'
                                if (m[2][0] == '.') and (not @files[abspath]?) and (@queue.indexOf(abspath) < 0)
                                    if fileExists abspath 
                                        @queue.push abspath
                                        
                        #  00  00   000  000   000   0000000  000      000   000  0000000    00000000
                        # 00000000  000  0000  000  000       000      000   000  000   000  000     
                        #  00  00   000  000 0 000  000       000      000   000  000   000  0000000 
                        # 00000000  000  000  0000  000       000      000   000  000   000  000     
                        #  00  00   000  000   000   0000000  0000000   0000000   0000000    00000000
                        when "#include"
                            m = line.match Indexer.includeRegExp
                            if m?[1]?
                                r = fileInfo.require ? []
                                r.push [null, m[1]]
                                fileInfo.require = r
                                abspath = resolve path.join path.dirname(file), m[1] 
                                abspath += '.coffee' if not path.extname m[1]
                                if not @files[abspath]? and @queue.indexOf(abspath) < 0
                                    if fileExists abspath 
                                        @queue.push abspath
            if funcAdded
                
                while funcStack.length
                    last(funcStack)[1].last = li - 1
                    funcInfo = funcStack.pop()    
                    fileInfo.funcs.push [funcInfo[1].line, funcInfo[1].last, funcInfo[2], funcInfo[1].class ? path.basename file, path.extname file]
                
                for win in BrowserWindow.getAllWindows()
                    win.webContents.send 'classesCount', _.size @classes
                    win.webContents.send 'funcsCount',   _.size @funcs
                    
            @files[file] = fileInfo

            for win in BrowserWindow.getAllWindows()
                win.webContents.send 'filesCount', _.size @files
            
            @indexDir path.dirname file
            @indexDir Walker.packagePath file
            
            @shiftQueue()
            
    shiftQueue: =>
        if @queue.length
            file = @queue.shift()
            @indexFile file
                        
module.exports = Indexer

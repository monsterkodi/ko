###
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
###

{ empty, post, slash, fs, os, log, _ } = require 'kxk'

Walker   = require '../tools/walker'
electron = require 'electron'

BrowserWindow = electron.BrowserWindow

class Indexer

    @requireRegExp   = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
    @classRegExp     = /^\s*(class|struct)(\s+\w+_API)?\s+(\w+)(\s+extends\s\w+.*|\s*:\s*[\w\,\s\<\>]+)?\s*$/
    @includeRegExp   = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/
    @methodRegExp    = /^\s+([\@]?\w+)\s*\:\s*(\(.*\))?\s*[=-]\>/
    @cppMethodRegExp = /^\s+(\w+\s+)*(\w+)\s*(\(.*\))/
    @funcRegExp      = /^\s*([\w\.]+)\s*[\:\=]\s*(\(.*\))?\s*[=-]\>/
    @testRegExp      = /^\s*(describe|it)\s+[\'\"](.+)[\'\"]\s*[\,]\s*(\([^\)]*\))?\s*[=-]\>/
    @splitRegExp     = new RegExp "[^\\w\\d\\_]+", 'g'

    @classNameInLine: (line) ->
                    
        m = line.match Indexer.classRegExp
        m?[3]

    @cppMethodNameInLine: (line) ->
        
        m = line.match Indexer.cppMethodRegExp
        m?[2]

    @methodNameInLine: (line) ->
        
        m = line.match Indexer.methodRegExp
        m?[1]
        
    @funcNameInLine: (line) ->

        m = line.match Indexer.funcRegExp
        m?[1]
    
    # 000000000  00000000   0000000  000000000  000   000   0000000   00000000   0000000    
    #    000     000       000          000     000 0 000  000   000  000   000  000   000  
    #    000     0000000   0000000      000     000000000  000   000  0000000    000   000  
    #    000     000            000     000     000   000  000   000  000   000  000   000  
    #    000     00000000  0000000      000     00     00   0000000   000   000  0000000    
    
    @testWord: (word) ->
        
        switch
            when word.length < 3 then false # exclude when too short
            when word[0] in ['-', "#"] then false
            when word[word.length-1] == '-' then false 
            when word[0] == '_' and word.length < 4 then false # exclude when starts with underscore and is short
            when /^[0\_\-\@\#]+$/.test word then false # exclude when consist of special characters only
            when /\d/.test word then false # exclude when word contains number
            else true
        
    #  0000000   0000000   000   000   0000000  000000000  00000000   000   000   0000000  000000000   0000000   00000000   
    # 000       000   000  0000  000  000          000     000   000  000   000  000          000     000   000  000   000  
    # 000       000   000  000 0 000  0000000      000     0000000    000   000  000          000     000   000  0000000    
    # 000       000   000  000  0000       000     000     000   000  000   000  000          000     000   000  000   000  
    #  0000000   0000000   000   000  0000000      000     000   000   0000000    0000000     000      0000000   000   000  
    
    constructor: () ->
        
        post.onGet 'indexer', @onGet
        @collectBins()
        @collectProjects()
    
        @imageExtensions = ['png', 'jpg', 'gif', 'tiff', 'pxm', 'icns']        

        @dirs    = Object.create null
        @files   = Object.create null
        @classes = Object.create null
        @funcs   = Object.create null
        @words   = Object.create null
        @walker  = null
        @queue   = []

    #  0000000   000   000   0000000   00000000  000000000  
    # 000   000  0000  000  000        000          000     
    # 000   000  000 0 000  000  0000  0000000      000     
    # 000   000  000  0000  000   000  000          000     
    #  0000000   000   000   0000000   00000000     000     
    
    onGet: (key, filter...) =>

        value = @[key]
        if not empty filter
            
            names = _.filter filter, (c) -> not empty c
            
            if not empty names
                
                names = names.map (c) -> c?.toLowerCase()
                
                value = _.pickBy value, (value, key) ->
                    for cn in names
                        lc = key.toLowerCase()
                        if cn.length>1 and lc.indexOf(cn)>=0 or lc.startsWith(cn)
                            return true
        value
        
    #  0000000   0000000   000      000      00000000   0000000  000000000  
    # 000       000   000  000      000      000       000          000     
    # 000       000   000  000      000      0000000   000          000     
    # 000       000   000  000      000      000       000          000     
    #  0000000   0000000   0000000  0000000  00000000   0000000     000     
    
    collectBins: ->
        
        @bins = []
        return if os.platform() == 'win32'
        for dir in ['/bin', '/usr/bin', '/usr/local/bin']
            w = new Walker
                maxFiles:    1000
                root:        dir
                includeDirs: false
                includeExt:  [''] # report files without extension
                file:        (p) => @bins.push slash.basename p
            w.start()

    collectProjects: ->

        @projects = {}
        w = new Walker
            maxFiles:    5000
            maxDepth:    3
            root:        slash.resolve '~'
            include:     ['.git']
            ignore:      ['node_modules', 'img', 'bin', 'js', 'Library']
            skipDir:     (p) -> slash.basename(p) == '.git'
            filter:      (p) -> slash.ext(p) not in ['noon', 'json', 'git', '']
            dir:         (p) => if slash.file(p) == '.git'    then @projects[slash.basename slash.dirname p] = dir: slash.tilde slash.dirname p
            file:        (p) => if slash.base(p) == 'package' then @projects[slash.basename slash.dirname p] = dir: slash.tilde slash.dirname p
        w.start()

    # 000  000   000  0000000    00000000  000   000        0000000    000  00000000
    # 000  0000  000  000   000  000        000 000         000   000  000  000   000
    # 000  000 0 000  000   000  0000000     00000          000   000  000  0000000
    # 000  000  0000  000   000  000        000 000         000   000  000  000   000
    # 000  000   000  0000000    00000000  000   000        0000000    000  000   000

    indexDir: (dir) ->

        return if not dir? or @dirs[dir]?
        @dirs[dir] =
            name: slash.basename dir

        wopt =
            root:        dir
            includeDir:  dir
            includeDirs: true
            dir:         @onWalkerDir
            file:        @onWalkerFile
            done:        @shiftQueue

        @walker = new Walker wopt
        @walker.cfg.ignore.push 'js'
        @walker.cfg.includeExt = @walker.cfg.includeExt.concat @imageExtensions
        @walker.start()

    onWalkerDir: (p, stat) =>
        
        if not @dirs[p]?
            @dirs[p] =
                name: slash.basename p

    onWalkerFile: (p, stat) =>
        
        if not @files[p]? and @queue.indexOf(p) < 0
            if stat.size < 654321 # obviously some arbitrary number :)
                @queue.push p
            else
                log "warning! file #{p} too large? #{stat.size}. skipping indexing!"

    #  0000000   0000000    0000000        00000000  000   000  000   000   0000000  
    # 000   000  000   000  000   000      000       000   000  0000  000  000       
    # 000000000  000   000  000   000      000000    000   000  000 0 000  000       
    # 000   000  000   000  000   000      000       000   000  000  0000  000       
    # 000   000  0000000    0000000        000        0000000   000   000   0000000  

    addFuncInfo: (funcName, funcInfo) ->
        
        if funcName.startsWith '@'
            funcName = funcName.slice 1
            funcInfo.static = true
            
        funcInfo.name = funcName
        
        funcInfos = @funcs[funcName] ? []
        funcInfos.push funcInfo
        @funcs[funcName] = funcInfos
        
        funcInfo

    addMethod: (className, funcName, file, li) ->

        funcInfo = @addFuncInfo funcName,
            line:  li+1
            file:  file
            class: className

        _.set @classes, "#{className}.methods.#{funcInfo.name}", funcInfo

        funcInfo

    # 00000000   00000000  00     00   0000000   000   000  00000000        00000000  000  000      00000000
    # 000   000  000       000   000  000   000  000   000  000             000       000  000      000
    # 0000000    0000000   000000000  000   000   000 000   0000000         000000    000  000      0000000
    # 000   000  000       000 0 000  000   000     000     000             000       000  000      000
    # 000   000  00000000  000   000   0000000       0      00000000        000       000  0000000  00000000

    removeFile: (file) ->
        
        return if not @files[file]?
        
        for name,infos of @funcs
            _.remove infos, (v) -> v.file == file
            delete @funcs[name] if not infos.length
                    
        @classes = _.omitBy @classes, (v) -> v.file == file
        
        delete @files[file]

    # 000  000   000  0000000    00000000  000   000        00000000  000  000      00000000
    # 000  0000  000  000   000  000        000 000         000       000  000      000
    # 000  000 0 000  000   000  0000000     00000          000000    000  000      0000000
    # 000  000  0000  000   000  000        000 000         000       000  000      000
    # 000  000   000  0000000    00000000  000   000        000       000  0000000  00000000

    indexFile: (file, opt) ->
        
        @removeFile file if opt?.refresh

        if @files[file]?
            return @shiftQueue() 

        fileExt = slash.ext file 

        if fileExt in @imageExtensions
            @files[file] = {}
            return @shiftQueue()
            
        # log 'indexFile', file

        isCpp = fileExt in ['cpp', 'cc']
        isHpp = fileExt in ['hpp', 'h' ]

        fs.readFile file, 'utf8', (err, data) =>
            
            return log "can't index #{file}", err if err?
            
            lines = data.split /\r?\n/
            
            fileInfo =
                lines: lines.length
                funcs: []
                classes: []
                
            funcAdded = false
            funcStack = []
            currentClass = null
            
            # log 'indexing', file
            
            for li in [0...lines.length]
                
                line = lines[li]

                if line.trim().length # ignoring empty lines
                    
                    indent = line.search /\S/

                    while funcStack.length and indent <= _.last(funcStack)[0]
                        _.last(funcStack)[1].last = li - 1
                        funcInfo = funcStack.pop()[1]
                        funcInfo.class ?= slash.base file
                        fileInfo.funcs.push funcInfo 

                    if currentClass? and indent >= 4

                        # 00     00  00000000  000000000  000   000   0000000   0000000     0000000
                        # 000   000  000          000     000   000  000   000  000   000  000
                        # 000000000  0000000      000     000000000  000   000  000   000  0000000
                        # 000 0 000  000          000     000   000  000   000  000   000       000
                        # 000   000  00000000     000     000   000   0000000   0000000    0000000

                        if isCpp or isHpp
                            log 'isCpp or isHpp', file, currentClass
                            if methodName = Indexer.cppMethodNameInLine line
                                funcInfo = @addMethod currentClass, methodName, file, li
                                funcStack.push [indent, funcInfo]
                                funcAdded = true                            
                        else
                            if methodName = Indexer.methodNameInLine line
                                funcInfo = @addMethod currentClass, methodName, file, li
                                funcStack.push [indent, funcInfo]
                                funcAdded = true
                    else

                        if isCpp or isHpp
                            methodRegExp = /(\w+)(\<[^\>]+\>)?\:\:(\w+)\s*(\([^\)]*\))\s*(const)?$/
                            m = line.match methodRegExp
                            if m?[1]? and m?[3]?
                                className = m[1]
                                funcName  = m[3]
                                funcInfo = @addMethod className, funcName, file, li
                                funcStack.push [indent, funcInfo]
                                funcAdded = true
                                continue

                        # 00000000  000   000  000   000   0000000  000000000  000   0000000   000   000   0000000
                        # 000       000   000  0000  000  000          000     000  000   000  0000  000  000
                        # 000000    000   000  000 0 000  000          000     000  000   000  000 0 000  0000000
                        # 000       000   000  000  0000  000          000     000  000   000  000  0000       000
                        # 000        0000000   000   000   0000000     000     000   0000000   000   000  0000000

                        currentClass = null if indent < 4

                        if funcName = Indexer.funcNameInLine line
                            funcInfo = @addFuncInfo funcName,
                                line: li+1
                                file: file

                            funcStack.push [indent, funcInfo]
                            funcAdded = true
                            
                        m = line.match Indexer.testRegExp
                        if m?[2]?
                            funcInfo = @addFuncInfo m[2],
                                line: li+1
                                file: file
                                test: m[1]

                            funcStack.push [indent, funcInfo]
                            funcAdded = true

                words = line.split Indexer.splitRegExp
                
                for word in words
                    
                    if Indexer.testWord word
                        _.update @words, "#{word}.count", (n) -> (n ? 0) + 1

                    switch word

                        #  0000000  000       0000000    0000000   0000000
                        # 000       000      000   000  000       000
                        # 000       000      000000000  0000000   0000000
                        # 000       000      000   000       000       000
                        #  0000000  0000000  000   000  0000000   0000000
                        
                        when 'class', 'struct'
                            
                            if className = Indexer.classNameInLine line
                                currentClass = className
                                _.set @classes, "#{className}.file", file
                                _.set @classes, "#{className}.line", li+1
                                
                                fileInfo.classes.push 
                                    name: className
                                    line: li+1

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
                                abspath = slash.resolve slash.join slash.dir(file), m[2]
                                abspath += '.coffee'
                                if (m[2][0] == '.') and (not @files[abspath]?) and (@queue.indexOf(abspath) < 0)
                                    if slash.isFile abspath
                                        @queue.push abspath

                        #  00  00   000  000   000   0000000  000      000   000  0000000    00000000
                        # 00000000  000  0000  000  000       000      000   000  000   000  000
                        #  00  00   000  000 0 000  000       000      000   000  000   000  0000000
                        # 00000000  000  000  0000  000       000      000   000  000   000  000
                        #  00  00   000  000   000   0000000  0000000   0000000   0000000    00000000
                        
                        when '#include'
                            
                            m = line.match Indexer.includeRegExp
                            if m?[1]?
                                r = fileInfo.require ? []
                                r.push [null, m[1]]
                                fileInfo.require = r
                                abspath = slash.resolve slash.join slash.dir(file), m[1]
                                abspath += '.coffee' if not slash.ext m[1]
                                if not @files[abspath]? and @queue.indexOf(abspath) < 0
                                    if slash.fileExists abspath
                                        @queue.push abspath
            if funcAdded

                while funcStack.length
                    _.last(funcStack)[1].last = li - 1
                    funcInfo = funcStack.pop()[1]
                    funcInfo.class ?= slash.base funcInfo.file
                    funcInfo.class ?= slash.base file
                    fileInfo.funcs.push funcInfo

                post.toWins 'classesCount', _.size @classes
                post.toWins 'funcsCount',   _.size @funcs
                post.toWins 'fileIndexed',  file

            @files[file] = fileInfo
            
            post.toWins 'filesCount', _.size @files

            @indexDir slash.dir file
            @indexDir slash.pkg file

            @shiftQueue()
        @

    shiftQueue: =>
        
        if @queue.length
            file = @queue.shift()
            @indexFile file

module.exports = Indexer

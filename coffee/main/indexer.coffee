###
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
###

{ post, valid, empty, slash, fs, os, str, error, log, _ } = require 'kxk'

Walker   = require '../tools/walker'
matchr   = require '../tools/matchr'
forkfunc = require '../tools/forkfunc'
IndexHpp = require './indexhpp'

class Indexer

    @requireRegExp   = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/
    @includeRegExp   = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/
    @methodRegExp    = /^\s+([\@]?\w+)\s*\:\s*(\(.*\))?\s*[=-]\>/
    @funcRegExp      = /^\s*([\w\.]+)\s*[\:\=]\s*(\(.*\))?\s*[=-]\>/
    @postRegExp      = /^\s*post\.on\s+[\'\"](\w+)[\'\"]\s*\,\s*(\(.*\))?\s*[=-]\>/
    @testRegExp      = /^\s*(describe|it)\s+[\'\"](.+)[\'\"]\s*[\,]\s*(\([^\)]*\))?\s*[=-]\>/
    @splitRegExp     = new RegExp "[^\\w\\d\\_]+", 'g'
    @classRegExp     = /^class\s+(\w+)/

    @classNameInLine: (line) ->
                    
        m = line.match Indexer.classRegExp
        m?[1]
        
    @methodNameInLine: (line) ->
        
        m = line.match Indexer.methodRegExp
        if m?
            rgs = matchr.ranges Indexer.methodRegExp, line
            if rgs[0].start > 11
                return null
        m?[1]
        
    @funcNameInLine: (line) ->

        if m = line.match Indexer.funcRegExp
            rgs = matchr.ranges Indexer.funcRegExp, line
            if rgs[0].start > 7
                return null
            
        m?[1]

    @postNameInLine: (line) ->        
        
        if m = line.match Indexer.postRegExp
            rgs = matchr.ranges Indexer.postRegExp, line
        
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
        
    # 000  000   000  0000000    00000000  000   000  00000000  00000000   
    # 000  0000  000  000   000  000        000 000   000       000   000  
    # 000  000 0 000  000   000  0000000     00000    0000000   0000000    
    # 000  000  0000  000   000  000        000 000   000       000   000  
    # 000  000   000  0000000    00000000  000   000  00000000  000   000  
    
    constructor: () ->
        
        post.onGet 'indexer', @onGet
        post.on 'sourceInfoForFile', @onSourceInfoForFile
        
        post.on 'fileSaved',    (file, winID) => @indexFile file, refresh: true
        post.on 'dirLoaded',    (dir)         => @indexProject dir
        post.on 'fileLoaded',   (file, winID) => 
            @indexFile file
            @indexProject file
        
        @collectBins()
    
        @imageExtensions = ['png', 'jpg', 'gif', 'tiff', 'pxm', 'icns']        

        @dirs    = Object.create null
        @files   = Object.create null
        @classes = Object.create null
        @funcs   = Object.create null
        @words   = Object.create null
        @walker  = null
        @queue   = []
        
        @indexedProjects = []

    #  0000000   000   000   0000000   00000000  000000000  
    # 000   000  0000  000  000        000          000     
    # 000   000  000 0 000  000  0000  0000000      000     
    # 000   000  000  0000  000   000  000          000     
    #  0000000   000   000   0000000   00000000     000     
    
    onGet: (key, filter...) =>
        
        switch key
            when 'counts'
                return 
                    classes: @classes.length ? 0
                    files:   @files.length ? 0
                    funcs:   @funcs.length ? 0
                    words:   @words.length ? 0
                    dirs:    @dirs.length ? 0
            when 'file'
                return @files[filter[0]]
            when 'project'
                return @projectInfo filter[0]
        
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
        
    onSourceInfoForFile: (opt) =>
        
        file = opt.item.file
        if @files[file]?
            post.toWin opt.winID, 'sourceInfoForFile', @files[file], opt
        
    #  0000000   0000000   000      000      00000000   0000000  000000000  
    # 000       000   000  000      000      000       000          000     
    # 000       000   000  000      000      0000000   000          000     
    # 000       000   000  000      000      000       000          000     
    #  0000000   0000000   0000000  0000000  00000000   0000000     000     
    
    collectBins: ->
        
        @bins = []
        return if slash.win()
        
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
            skipDir:     (p) -> slash.base(p) == '.git'
            filter:      (p) -> slash.ext(p) not in ['noon', 'json', 'git', '']
            dir:         (p) => if slash.file(p) == '.git'    then @projects[slash.base slash.dir p] = dir: slash.tilde slash.dir p
            file:        (p) => if slash.base(p) == 'package' then @projects[slash.base slash.dir p] = dir: slash.tilde slash.dir p
            done:        => log 'collectProjects done', @projects
        w.start()

    # 00000000   00000000    0000000         000  00000000   0000000  000000000  
    # 000   000  000   000  000   000        000  000       000          000     
    # 00000000   0000000    000   000        000  0000000   000          000     
    # 000        000   000  000   000  000   000  000       000          000     
    # 000        000   000   0000000    0000000   00000000   0000000     000     
    
    projectInfo: (path) ->
        
        for project in @indexedProjects
            if slash.samePath(project.dir, path) or path.startsWith project.dir + '/'
                return project
        {}
    
    indexProject: (file) ->
        
        if @currentlyIndexing
            @indexQueue ?= []
            @indexQueue.push file
            return
        
        file = slash.resolve file 
        
        return if valid @projectInfo file
              
        @currentlyIndexing = file
        
        forkfunc './indexprj', file, (err, info) =>
            
            return error 'indexing failed', err if valid err

            delete @currentlyIndexing
            
            if info
                @indexedProjects.push info 
                post.toWins 'projectIndexed', info
            
            doShift = empty @queue
            
            if valid info.files
                @queue = @queue.concat info.files
                
            if valid @indexQueue
                @indexProject @indexQueue.shift()
                
            @shiftQueue() if doShift
                
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
            maxDepth:    12
            maxFiles:    100000
            done:        (w) => 
                @shiftQueue

        @walker = new Walker wopt
        @walker.cfg.ignore.push 'js'
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
            
        isCpp = fileExt in ['cpp', 'cc']
        isHpp = fileExt in ['hpp', 'h' ]

        fs.readFile file, 'utf8', (err, data) =>
            
            return error "can't index #{file}", err if not empty err
            
            lines = data.split /\r?\n/
            
            fileInfo =
                lines: lines.length
                funcs: []
                classes: []
                
            funcAdded = false
            funcStack = []
            currentClass = null
            
            if isHpp or isCpp
                
                indexHpp = new IndexHpp
                parsed = indexHpp.parse data
                funcAdded = not empty(parsed.classes) or not empty(parsed.funcs)
                
                for clss in parsed.classes
                    
                    _.set @classes, "#{clss.name}.file", file
                    _.set @classes, "#{clss.name}.line", clss.line+1
                    
                    fileInfo.classes.push 
                        name: clss.name
                        line: clss.line+1
                        
                for func in parsed.funcs
                    funcInfo = @addMethod func.class, func.method, file, func.line
                    fileInfo.funcs.push funcInfo
                    
            else
                for li in [0...lines.length]
                    
                    line = lines[li]
    
                    if line.trim().length # ignoring empty lines
                        
                        indent = line.search /\S/
    
                        while funcStack.length and indent <= _.last(funcStack)[0]
                            _.last(funcStack)[1].last = li - 1
                            funcInfo = funcStack.pop()[1]
                            funcInfo.class ?= slash.base file
                            fileInfo.funcs.push funcInfo 
    
                        if currentClass? # and indent >= 4
    
                            # 00     00  00000000  000000000  000   000   0000000   0000000     0000000
                            # 000   000  000          000     000   000  000   000  000   000  000
                            # 000000000  0000000      000     000000000  000   000  000   000  0000000
                            # 000 0 000  000          000     000   000  000   000  000   000       000
                            # 000   000  00000000     000     000   000   0000000   0000000    0000000
    
                            if methodName = Indexer.methodNameInLine line
                                funcInfo = @addMethod currentClass, methodName, file, li
                                funcStack.push [indent, funcInfo]
                                funcAdded = true
                        else
        
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

                            else if funcName = Indexer.postNameInLine line
                                funcInfo = @addFuncInfo funcName,
                                    line: li+1
                                    file: file
                                    post: true
    
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
                            
                            when 'class' #, 'struct'
                                
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
                                            
            if funcAdded

                while funcStack.length
                    _.last(funcStack)[1].last = li - 1
                    funcInfo = funcStack.pop()[1]
                    funcInfo.class ?= slash.base funcInfo.file
                    funcInfo.class ?= slash.base file
                    fileInfo.funcs.push funcInfo

                if opt?.post != false
                    post.toWins 'classesCount', _.size @classes
                    post.toWins 'funcsCount',   _.size @funcs
                    post.toWins 'fileIndexed',  file, fileInfo

            @files[file] = fileInfo
            
            if opt?.post != false
                post.toWins 'filesCount', _.size @files

            @shiftQueue()
        @

    #  0000000  000   000  000  00000000  000000000  
    # 000       000   000  000  000          000     
    # 0000000   000000000  000  000000       000     
    #      000  000   000  000  000          000     
    # 0000000   000   000  000  000          000     
    
    shiftQueue: =>
        
        if @queue.length
            file = @queue.shift()
            @indexFile file

module.exports = Indexer

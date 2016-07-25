#  0000000   00000000   00000000  000   000
# 000   000  000   000  000       0000  000
# 000   000  00000000   0000000   000 0 000
# 000   000  000        000       000  0000
#  0000000   000        00000000  000   000
{
fileExists,
dirExists,
relative,
resolve,
clamp,
last,
$}      = require '../tools/tools'
log     = require '../tools/log'
prefs   = require '../tools/prefs'
profile = require '../tools/profile'
Walker  = require '../tools/walker'
Command = require '../commandline/command'
render  = require '../editor/render'
syntax  = require '../editor/syntax'
path    = require 'path'
fuzzy   = require 'fuzzy'
fs      = require 'fs'
_       = require 'lodash'

fileTypes = [
    'coffee', 'js', 
    'styl', 'css'
    'pug', 'jade', 'html', 
    'md', 'txt',
    'noon', 'json', 
    'cpp', 'h',
    'sh', 'py'
    ]
fileExtensions = (".#{e}" for e in fileTypes)    
    
class Open extends Command

    constructor: (@commandline) ->
        
        @shortcuts  = ['command+p', 'command+shift+p']
        @names      = ["open", "new window"]
        @files      = null
        @file       = null
        @dir        = null
        @pkg        = null
        @combo      = null
        @selected   = 0
        @navigating = false
        
        super @commandline
        
        @maxHistory = 10
                    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
            
        command  = command.trim()
        return if command in ['.', '/', '~']
        
        if command.length
            fileNames = (f[0] for f in @files)
            fuzzied   = fuzzy.filter command, fileNames
            filtered  = (f.string for f in fuzzied)
            
            matchWeight = (f) =>
                f = f.slice 0, f.length-2 if f.endsWith ' >'
                bonus = switch path.extname(f)         
                    when '.coffee'               then 1000
                    when '.md', '.styl', '.pug'  then 500
                    when '.noon'                 then 250
                    when '.js', '.json', '.html' then -100
                    else 0
    
                bonus += (10-f.split(/[\/\.]/).length)
                        
                if f == command
                    bonus += 99999999
                if f.startsWith command
                    bonus += 100000 - f.length                        
                if path.basename(f).startsWith command
                    bonus += 10000 - path.basename(f).length
                 
                bonus

            if not filtered.length  
                log "nothing to sort? #{command}"
                @hideList()
                return
            else 
                filtered.sort (a,b) -> matchWeight(b) - matchWeight(a)
                items = @listItems()
                sorted = []
                for f in filtered
                    f = f.slice 0, f.length-2 if f.endsWith ' >'
                    sorted.push _.find items, (i) -> i.text == f
                if sorted.length
                    @showItems sorted                
                    if sorted[0].startsWith command
                        log 'select 0'
                        @select 0
                    else 
                        log 'select -1'
                        @select -1
                else 
                    @select -1
        else
            @showItems @listItems()
            @select 0
        @positionList()

    
    # 000   000  00000000  000   0000000   000   000  000000000
    # 000 0 000  000       000  000        000   000     000   
    # 000000000  0000000   000  000  0000  000000000     000   
    # 000   000  000       000  000   000  000   000     000   
    # 00     00  00000000  000   0000000   000   000     000   
    
    weightedFiles: ->
        weight = (fs) =>
            [f, s] = fs
            
            extensionBonus = switch path.extname(f)
                when '.coffee'               then 100
                when '.md', '.styl', '.pug'  then 50
                when '.noon'                 then 25
                when '.js', '.json', '.html' then -1000000
                else 0 

            directoryBonus = 0
            if s.isDirectory()
                directoryBonus = 65535-path.basename(f).charCodeAt(0)
                            
            lengthPenalty = path.dirname(f).length
            
            localBonus = 0
            localBonus += 10000 if f.startsWith @dir
            localBonus -= relative(f, @dir).split('/').length * 200
            
            localBonus + directoryBonus + extensionBonus - lengthPenalty
        
        @files.sort (a,b) -> weight(b) - weight(a)
        log "weightedFiles:", (f[0] for f in @files)
        @files
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    listItems: () ->
        items = []
        
        @lastFileIndex = 0

        if not @navigating
            if @history.length
                for f in @history
                    if f.length and (f != @file) and fileExists f
                        item = Object.create null
                        item.text = relative f, @dir
                        items.push item
                        @lastFileIndex = items.length-1
                    else
                        _.pullAll @history, f
        else
            item = Object.create null
            item.line = '▸'
            item.clss = 'directory'
            item.text = '..'
            items.push item
                
        for file in @weightedFiles()
            item = Object.create null
            if file[1].isDirectory()
                item.line = '▸'
                item.clss = 'directory'
            item.text = relative file[0], @dir
            items.push item
                        
        items
                
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: (combo) ->
        if combo == @shortcuts[0]
            if not @navigating and @commandList? and @lastFileIndex == @selected
                return @execute()
        super combo
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) -> 
        opt = {}
        if window.editor.currentFile?
            opt.file = window.editor.currentFile 
        else 
            opt.dir = @dir ? path.dirname last prefs.get 'recentFiles', ['~']
        
        @loadDir opt
        super @combo
        text: ''
                
    # 000       0000000    0000000   0000000          0000000    000  00000000 
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 000      000   000  000000000  000   000        000   000  000  0000000  
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 0000000   0000000   000   000  0000000          0000000    000  000   000
        
    loadDir: (opt) ->        
        opt.dir     = path.dirname opt.file if not opt.dir?
        opt.dir     = path.basename opt.dir if not dirExists opt.dir
        @dir        = opt.dir ? @dir
        @pkg        = Walker.packagePath(@dir) ? @dir
        @file       = opt.file
        @files      = []
        @selected   = 0
        @navigating = opt.navigating ? false
        wopt = 
            root:        @pkg
            includeDirs: true
            includeDir:  @dir
            done:        @walkerDone
        if @navigating
            fopt = _.clone wopt
            fopt.root     = @dir
            fopt.maxDepth = 1
            fopt.maxFiles = 300
            @fastWalker = new Walker fopt
            @fastWalker.start()
        @walker = new Walker wopt
        @walker.start()        
        
    # 000   000   0000000   000      000   000  00000000  00000000 
    # 000 0 000  000   000  000      000  000   000       000   000
    # 000000000  000000000  000      0000000    0000000   0000000  
    # 000   000  000   000  000      000  000   000       000   000
    # 00     00  000   000  0000000  000   000  00000000  000   000
            
    walkerDone: (fileList, statList) =>
        @files = []
        for i in [0...fileList.length]
            @files.push [fileList[i], statList[i]]
            
        @showList()
        @showItems @listItems()
        @grabFocus()
        @select @lastFileIndex
        text = @navigating and @dir or @commandList.lines[@selected]
        @commandline.setAndSelectText text
                    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        listValue = @commandList?.lines[@selected] if @selected >= 0

        if command in ['.', '..', '/', '~']
            @dir = @resolvedPath command
            @loadDir
                navigating: @dir
                dir:        @dir
            return text: @dir, select: true
        else
            if @selected >= 0 and listValue? 
                if dirExists @resolvedPath listValue
                    resolved = @resolvedPath listValue
            else if dirExists @resolvedPath command
                resolved = @resolvedPath command
            if resolved? and @dir != resolved
                @loadDir
                    navigating: resolved
                    dir:        resolved
                return text: @dir, select: true

        @hideList()

        if listValue
            files = [@resolvedPath listValue]
        else
            files = _.words command, new RegExp "[^, ]+", 'g'
                    
            for i in [0...files.length]
                file = files[i]
                file = @resolvedPath file
                if not fileExists file
                    if '' == path.extname file
                        if fileExists file + '.coffee'
                            file += '.coffee'
                files.splice i, 1, file
            
        options = newWindow: @name == "new window"
        
        opened = window.openFiles files, options
        if opened?.length
            if opened.length == 1
                super opened[0]
            else
                super selected
                
            text:  (path.basename(f) for f in opened).join ' '
            focus: '.editor'
            reveal: 'editor'
            status: 'ok'
        else
            status: 'failed'

    # 00000000   00000000   0000000   0000000   000      000   000  00000000  0000000  
    # 000   000  000       000       000   000  000      000   000  000       000   000
    # 0000000    0000000   0000000   000   000  000       000 000   0000000   000   000
    # 000   000  000            000  000   000  000         000     000       000   000
    # 000   000  00000000  0000000    0000000   0000000      0      00000000  0000000  
    
    resolvedPath: (p, parent=@dir) ->
        return parent if not p?
        if p[0] in ['~', '/']
            resolve p
        else
            resolve path.join parent, p
                
module.exports = Open

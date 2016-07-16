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
walker  = require '../tools/walker'
Command = require '../commandline/command'
render  = require '../editor/render'
syntax  = require '../editor/syntax'
path    = require 'path'
walkdir = require 'walkdir'
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
        if not @list? 
            @start @shortcuts[0]
        command  = command.trim()
        return if command in ['.', '..', '/', '~']
        if command.length
            fuzzied  = fuzzy.filter command, @files       
            filtered = (f.string for f in fuzzied)
            
            matchWeight = (f) =>
                f = f.slice 0, f.length-2 if f.endsWith ' >'
                bonus = switch path.extname(f)         
                    when '.coffee' then 1000
                    when '.md', '.styl', '.pug' then 500
                    when '.noon' then 250
                    when '.js', '.json', '.html' then -100
                    else 
                        0 

                bonus += (10-f.split(/[\/\.]/).length)
                        
                if f == command
                    bonus += 99999999
                if f.startsWith command
                    bonus += 100000 - f.length                        
                if path.basename(f).startsWith command
                    bonus += 10000 - path.basename(f).length
                 
                bonus
    
            filtered.sort (a,b) -> matchWeight(b) - matchWeight(a)
            @listFiles filtered
        else
            @listFiles @files
        
        @select 0

    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    showList: ->
        if not @list?
            @list = document.createElement 'div' 
            @list.className = 'list open'
            @positionList()
            window.split.elem.appendChild @list 
        @listFiles @files
            
    listFiles: (files) ->
        @list.innerHTML = ""        
        if files.length == 0
            @list.style.display = 'none'
        else
            @list.style.display = 'unset'
            index = 0
            for fileOrDir in files
                file = fileOrDir
                div = document.createElement 'div'
                div.className = 'list-item'
                if file.endsWith ' >'
                    file = file.slice 0, file.length-2
                    div.classList.add 'directory'
                div.innerHTML = render.line file, syntax.dissForTextAndSyntax(file, 'ko', join: true), charWidth:0
                div.setAttribute "onmousedown", "window.openFileAtIndex(#{index});"
                div.value = file
                @list.appendChild div
                index += 1

    onBot: (bot) => 
        cl = window.split.commandlineHeight + window.split.handleHeight
        if bot < cl
            @list?.style.opacity = "#{clamp 0, 1, bot/cl}"
        else
            @list?.style.opacity = "1"
        @positionList()
    
    positionList: ->
        return if not @list?
        split = window.split
        listTop = split.splitPosY 1
        listHeight = @list.getBoundingClientRect().height
        if (split.elemHeight() - listTop) < listHeight
            listTop = split.splitPosY(0) - listHeight
        @list?.style.top = "#{listTop}px"
                
    # 00000000   00000000   00000000  000   000
    # 000   000  000   000  000       000   000
    # 00000000   0000000    0000000    000 000 
    # 000        000   000  000          000   
    # 000        000   000  00000000      0    
            
    prev: -> 
        if @index == @history.length-1 and @selected > 0
            @select clamp 0, @list.children.length, @selected-1
            @list.children[@selected]?.value ? @history[@index]
        else if @navigating
            @select(-1)
            super
        
    # 000   000  00000000  000   000  000000000
    # 0000  000  000        000 000      000   
    # 000 0 000  0000000     00000       000   
    # 000  0000  000        000 000      000   
    # 000   000  00000000  000   000     000   
    
    next: -> 
        if @list? and @index == @history.length-1
            @select clamp 0, @list.children.length, @selected+1
            @list.children[@selected]?.value ? @history[@index]
        else
            @select(-1)
            super
        
    #  0000000  00000000  000      00000000   0000000  000000000
    # 000       000       000      000       000          000   
    # 0000000   0000000   000      0000000   000          000   
    #      000  000       000      000       000          000   
    # 0000000   00000000  0000000  00000000   0000000     000   
        
    select: (i) ->
        @list?.children[@selected]?.classList.remove 'selected'
        @selected = clamp -1, @list?.children.length-1, i
        if @selected >= 0
            @list?.children[@selected]?.classList.add 'selected'
            @list?.children[@selected]?.scrollIntoViewIfNeeded()
        
    #  0000000   00000000   00000000  000   000          00000000  000  000      00000000
    # 000   000  000   000  000       0000  000          000       000  000      000     
    # 000   000  00000000   0000000   000 0 000          000000    000  000      0000000 
    # 000   000  000        000       000  0000          000       000  000      000     
    #  0000000   000        00000000  000   000          000       000  0000000  00000000
        
    openFileAtIndex: (i) =>
        @select i
        @setText @list.children[i].value
        @commandline.execute()
        @skipBlur = true
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) -> 
        window.openFileAtIndex = @openFileAtIndex
        opt = {}
        if window.editor.currentFile?
            opt.file = window.editor.currentFile 
        else 
            opt.dir = @dir ? path.dirname last prefs.get 'recentFiles', ['~']
        
        @loadDir opt
        @setName @names[@shortcuts.indexOf @combo]
                
    # 000       0000000    0000000   0000000          0000000    000  00000000 
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 000      000   000  000000000  000   000        000   000  000  0000000  
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 0000000   0000000   000   000  0000000          0000000    000  000   000
        
    loadDir: (opt) ->        
        opt.dir     = path.dirname opt.file if not opt.dir?
        opt.dir     = path.basename opt.dir if not dirExists opt.dir
        @dir        = opt.dir ? @dir
        @pkg        = walker.packagePath(@dir) ? @dir
        @file       = opt.file
        @files      = []
        @paths      = []
        @stats      = []
        @selected   = 0
        @navigating = opt.navigating
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
            # log "open.loadDir fastWalker", fopt
            @fastWalker = new walker fopt
            @fastWalker.start()
            # return
        @Walker = new walker wopt
        @Walker.start()        
        
    # 000   000   0000000   000      000   000  00000000  00000000 
    # 000 0 000  000   000  000      000  000   000       000   000
    # 000000000  000000000  000      0000000    0000000   0000000  
    # 000   000  000   000  000      000  000   000       000   000
    # 00     00  000   000  0000000  000   000  00000000  000   000
            
    walkerDone: (fileList, statList) =>
        # profile 'walker done'
        @paths = @paths.concat fileList
        @stats = @stats.concat statList
        @files = _.clone @paths
        for i in [0...@files.length]
            if @stats[i].isDirectory()
                @files[i] += " >"
            
        # log "walkerDone @dir #{@dir} @paths", @paths
        
        # 000   000  00000000  000   0000000   000   000  000000000
        # 000 0 000  000       000  000        000   000     000   
        # 000000000  0000000   000  000  0000  000000000     000   
        # 000   000  000       000  000   000  000   000     000   
        # 00     00  00000000  000   0000000   000   000     000   
        
        absWeight = (f) =>
            
            if not @navigating
                bonus = switch path.extname(f)         
                    when '.coffee' then 100
                    when '.md', '.styl', '.pug' then 50
                    when '.noon' then 25
                    when '.js', '.json', '.html' then -1000000
                    else 0 
            else
                bonus = 0                
                
            penalty = path.dirname(f).length            
                            
            if f.startsWith @dir
                return 10000-penalty+bonus
            if f.startsWith path.dirname @dir
                return 5000-penalty+bonus
            else
                return 1000-penalty+bonus
        
        relWeight = (f) =>
            
            if @navigating
                bonus = switch path.extname(f)         
                    when '.coffee' then 100
                    when '.md', '.styl', '.pug' then 50
                    when '.noon' then 25
                    when '.js', '.json', '.html' then -10
                    else 0
            else
                bonus = 0

            bonus = 1000000 if f == '..'
            return bonus + 1000*(1000-f.split(/[\/\.]/).length)
                
        @files.push '..' if '..' not in @files            
        @files.sort (a,b) -> absWeight(b) - absWeight(a)
                
        @files = (relative(f, @dir) for f in @files)
        
        @files = @files.filter (f) -> f.length 
        @files.sort (a,b) -> relWeight(b) - relWeight(a)

        if @history.length and not @navigating
            h = (relative(f, @dir) for f in @history when f.length and (f != @file))
            @lastFileIndex = h.length - 1
            @files = _.concat h, @files
        else if @navigating
            @lastFileIndex = 0

        @files = _.uniq @files

        @showList()
        @grabFocus()
        @select @lastFileIndex
        text = @navigating ? @dir #@list?.children[@selected]?.value
        @commandline.setAndSelectText text
                    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        listValue = @list?.children[@selected]?.value if @selected >= 0

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
            if resolved?
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
        
    # 000   000  000  0000000    00000000
    # 000   000  000  000   000  000     
    # 000000000  000  000   000  0000000 
    # 000   000  000  000   000  000     
    # 000   000  000  0000000    00000000
         
    onBlur: => 
        if not @skipBlur
            @hideList()
        else
            @skipBlur = null
            
    hideList: ->
        @list?.remove()
        @list = null
                
    cancel: ->
        @hideList()
        super

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) ->
        switch combo
            when 'page up', 'page down'
                if @index == @history.length-1
                    return @select clamp 0, @list.children.length, @selected+20*(combo=='page up' and -1 or 1)
                    
        super mod, key, combo, event
        
module.exports = Open

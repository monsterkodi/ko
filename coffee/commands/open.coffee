#  0000000   00000000   00000000  000   000
# 000   000  000   000  000       0000  000
# 000   000  00000000   0000000   000 0 000
# 000   000  000        000       000  0000
#  0000000   000        00000000  000   000

{
fileExists,
fileList,
relative,
resolve,
clamp,
$
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
render  = require '../editor/render'
split   = require '../split'
path    = require 'path'
walkdir = require 'walkdir'
fuzzy   = require 'fuzzy'
fs      = require 'fs'
_       = require 'lodash'

class Open extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        @files    = null
        @file     = null
        @dir      = null
        @pkg      = null
        @selected = 0
        
        super
        
    packagePath: (p) ->
        while p.length and p not in ['.', '/']            
            if fs.existsSync path.join p, 'package.noon'
                return resolve p
            if fs.existsSync path.join p, 'package.json'
                return resolve p
            p = path.dirname p
        null
        
    sortFiles: ->
        base = @dir
        weight = (f) =>
            if f.startsWith @dir
                return 10000-path.dirname(f).length
            if f.startsWith path.dirname @dir
                return 5000-path.dirname(f).length
            else
                return 1000-path.dirname(f).length
        @files.sort (a,b) -> weight(b) - weight(a) 
        
    showList: ->
        cmdline = window.commandline
        list = document.createElement 'div'
        list.className = 'list'
        list.style.top = split.botHandle.style.top
        list.style.left = "5px"
        for file in @files
            div = document.createElement 'div'
            div.className = 'list-file'
            div.innerHTML = render.line relative(file, @dir), 'ko'
            list.appendChild div
        split.elem.appendChild list 
        @list = list
        
    hideList: ->
        log 'hideList'
        @list?.remove()
        @list = null
        
    changed: (command) ->
        return if not @list?
        @list.innerHTML = ""
        command  = command.trim()
        relativ  = (relative(f, @dir) for f in @files)
        fuzzied  = fuzzy.filter command, relativ       
        filtered = (f.string for f in fuzzied)
        for file in filtered
            div = document.createElement 'div'
            div.className = 'list-file'
            div.innerHTML = render.line file, 'ko'
            @list.appendChild div
            div.value = file
        @select 0
    
    prev: -> 
        if @index == @history.length-1 and @selected > 0
            @select clamp 0, @list.children.length, @selected-1
            @list.children[@selected]?.value ? @history[@index]
        else
            super
        
    next: -> 
        if @index == @history.length-1
            @select clamp 0, @list.children.length, @selected+1
            @list.children[@selected]?.value ? @history[@index]
        else
            super
        
    select: (i) ->
        @list.children[@selected].className = 'list-file'
        @selected = i
        @list.children[@selected].className = 'list-file selected'
        
    start: -> 
        @files = []
        @selected = 0
        if window.editor.currentFile?
            @file  = window.editor.currentFile 
            @dir   = path.dirname @file
            @pkg   = @packagePath @dir
        else
            @file = null
            @dir  = @pkg = resolve '~'
        that = @
        try
            walkdir.sync @pkg, max_depth: 3, (p) ->
                name = path.basename p
                extn = path.extname p
                if name in ['node_modules', 'app', 'img', 'dist', 'build', 'Library', 'Applications']
                    @ignore p 
                else if name in ['.konrad.noon', '.gitignore', '.npmignore']
                    that.files.push p
                else if (p == that.file) or (name.startsWith '.') or extn in ['.app']
                    @ignore p 
                else if extn in ['.coffee', '.styl', '.js', '.html', '.md', '.noon', '.json', '.sh', '.py', '.css']
                    that.files.push p
                if that.files.length > 500
                    @end()
        catch err
            log err
            
        @sortFiles()
        @showList()
        
    cancel: ->
        @hideList()
        super
        
    execute: (command) ->

        selected = @list.children[@selected]?.value ? command

        super selected
        
        @hideList()
        log 'command', selected
        
        files = _.words selected, new RegExp "[^, ]+", 'g'
        
        log 'files', files
        
        for i in [0...files.length]
            file = files[i]
            file = path.join @dir, file
            if not fileExists file
                if '' == path.extname file
                    if fileExists file + '.coffee'
                        file += '.coffee'
            files.splice i, 1, file
        
        # log 'files after', files    
        opened = window.openFiles files
        if opened?.length
            return 'editor'
        
module.exports = Open
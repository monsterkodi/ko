#  0000000   00000000   00000000  000   000
# 000   000  000   000  000       0000  000
# 000   000  00000000   0000000   000 0 000
# 000   000  000        000       000  0000
#  0000000   000        00000000  000   000

{
fileExists,
fileList,
resolve
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
path    = require 'path'
walkdir = require 'walkdir'
fs      = require 'fs'
_       = require 'lodash'

class Open extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        @files    = null
        @file     = null
        @dir      = null
        @pkg      = null
        
        super
        
    packagePath: (p) ->
        while path.dirname(p).length and path.dirname(p) not in ['.', '/']
            p = path.dirname p
            if fs.existsSync path.join p, 'package.noon'
                return resolve p
            if fs.existsSync path.join p, 'package.json'
                return resolve p
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
        log @files
        
    showList: ->
        cmdline = window.commandline
        list = document.createElement 'div'
        list.className = 'list'
        for file in @files
            div = document.createElement 'div'
            div.className = 'list-file'
            div.innerHTML = file
            list.appendChild div
        cmdline.view.appendChild list 
        
    start: -> 
        @file  = window.editor.currentFile
        @dir   = path.dirname @file
        @pkg   = @packagePath @dir
        @files = []
        that   = @
        try
            walkdir.sync @pkg, max_depth: 4, (p) ->
                if path.basename(p) in ['node_modules', '.git', 'app', 'img', 'dist', 'build', '.DS_Store']
                    @ignore p 
                else if p == that.file
                    @ignore p 
                else
                    that.files.push p
        catch err
            log err
            
        @sortFiles()
        @showList()
        
    execute: (command) ->

        super command
        
        # log 'command', command
        
        files = _.words command, new RegExp "[^, ]+", 'g'
        
        # log 'files', files
        
        for i in [0...files.length]
            file = files[i]
            file = path.join path.dirname(window.editor.currentFile), file
            if not fileExists file
                if '' == path.extname file
                    if fileExists file + '.coffee'
                        file += '.coffee'
            files.splice i, 1, file
        
        log 'files after', files    
        opened = window.openFiles files
        if opened?.length
            return 'editor'
        
module.exports = Open
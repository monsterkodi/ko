###
000   000   0000000   000      000   000  00000000  00000000 
000 0 000  000   000  000      000  000   000       000   000
000000000  000000000  000      0000000    0000000   0000000  
000   000  000   000  000      000  000   000       000   000
00     00  000   000  0000000  000   000  00000000  000   000
###

{ walkdir, slash, kerror } = require 'kxk'

File = require './file'

class Walker

    @: (@cfg) ->

        @cfg.files       = []
        @cfg.stats       = []
        @cfg.maxDepth    ?= 3
        @cfg.dotFiles    ?= false
        @cfg.includeDirs ?= true
        @cfg.maxFiles    ?= 500
        @cfg.ignore      ?= ['node_modules' 'build' 'Build' 'Library' 'Applications'] #, 'resources' 'ThirdParty' 'Binaries' 'Intermediate' 'Saved' 'Programs' 'Shaders' 'DerivedDataCache' 'Content' 'Samples']
        @cfg.include     ?= ['.konrad.noon' '.gitignore' '.npmignore']
        @cfg.ignoreExt   ?= ['app' 'asar']
        @cfg.includeExt  ?= File.sourceFileExtensions
      
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: ->           
        try
            @running = true
            dir = @cfg.root
            @walker = walkdir.walk dir, max_depth: @cfg.maxDepth
            onWalkerPath = (cfg) -> (p,stat) ->
                sp   = slash.path p
                name = slash.basename p
                extn = slash.ext p

                if cfg.filter?(p)
                    return @ignore p
                else if name in ['.DS_Store' 'Icon\r'] or extn in ['pyc']
                    return @ignore p
                else if name.endsWith '-x64'
                    return @ignore p
                else if cfg.includeDir? and slash.dir(p) == cfg.includeDir
                    cfg.files.push sp
                    cfg.stats.push stat
                    @ignore p if name in cfg.ignore
                    @ignore p if name.startsWith('.') and not cfg.dotFiles
                else if name in cfg.ignore
                    return @ignore p
                else if name in cfg.include
                    cfg.files.push sp
                    cfg.stats.push stat
                else if name.startsWith '.'
                    if cfg.dotFiles
                        cfg.files.push sp
                        cfg.stats.push stat
                    else
                        return @ignore p 
                else if extn in cfg.ignoreExt
                    return @ignore p
                else if extn in cfg.includeExt or cfg.includeExt.indexOf('') >= 0
                    cfg.files.push sp
                    cfg.stats.push stat
                else if stat.isDirectory()
                    if p != cfg.root and cfg.includeDirs
                        cfg.files.push sp 
                        cfg.stats.push stat
                        
                cfg.path? sp, stat
                if stat.isDirectory()
                    if cfg.includeDirs
                        cfg.dir? sp, stat
                    if cfg.skipDir? sp
                        @ignore p
                else
                    if slash.ext(sp) in cfg.includeExt or slash.basename(sp) in cfg.include or cfg.includeExt.indexOf('') >= 0
                        cfg.file? sp, stat
                                                
                if cfg.files.length > cfg.maxFiles
                    @end()

                else if cfg.slowdown and (cfg.files.length % 400) == 399
                    @pause()
                    setTimeout @resume, 10
                    
            @walker.on 'path', onWalkerPath @cfg
            @walker.on 'end', => 
                @running = false
                @cfg.done? @
                
        catch err
            @running = false
            kerror "Walker.start -- #{err} dir: #{dir} stack:", err.stack

    stop: ->
        
        @walker?.pause()
        @walker?.end()
        @walker = null
    
module.exports = Walker

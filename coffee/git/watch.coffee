###
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000  
###

{ post, slash, valid, watch } = require 'kxk'

class GitWatch
    
    @: (@gitDir, cb) ->
        
        return if not @gitDir?
        
        @gitFile = slash.join @gitDir, '.git' 'HEAD'
        
        if slash.fileExists @gitFile
            
            refPath = slash.readText @gitFile
            if refPath.startsWith 'ref: '
                @gitFile = slash.join @gitDir, '.git' refPath.slice(5).trim()
                @ref = slash.readText @gitFile
            else
                @ref = refPath
                
            @watcher = watch.file @gitFile
            @watcher.on 'change' (info) =>
                ref = slash.readText @gitFile
                if valid(ref) and @ref != ref
                    @ref = ref
                    cb @gitDir
                    post.emit 'gitRefChanged' @gitDir

    unwatch: ->
        
        @watcher?.close()
        delete @watcher
                
module.exports = GitWatch

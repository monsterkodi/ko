###
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000  
###

{ post, slash, watch, valid, fs, log } = require 'kxk'

class GitWatch
    
    constructor: (@gitDir, cb) ->
        
        return if not @gitDir?
        
        @gitFile = slash.join @gitDir, '.git', 'HEAD'
        
        if slash.fileExists @gitFile
            
            refPath = fs.readFileSync @gitFile, 'utf8'
            if refPath.startsWith 'ref: '
                @gitFile = slash.join @gitDir, '.git', refPath.slice(5).trim()
                @ref = fs.readFileSync @gitFile, 'utf8'
            else
                @ref = refPath
                
            @watcher = watch.file @gitFile
            @watcher.on 'change', (info) =>
                ref = fs.readFileSync @gitFile, 'utf8'
                if valid(ref) and @ref != ref
                    log "git change #{info.change} #{info.dir} #{info.path}"
                    @ref = ref
                    cb @gitDir
                    post.emit 'gitRefChanged', @gitDir
                else
                    log "invalid or same #{ref} #{@ref}"

    unwatch: ->
        
        @watcher?.close()
        delete @watcher
                
module.exports = GitWatch

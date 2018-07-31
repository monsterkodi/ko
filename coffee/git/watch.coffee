###
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000  
###

{ post, slash, fs, log } = require 'kxk'

class GitWatch
    
    constructor: (@gitDir, cb) ->
        
        return if not @gitDir?
        
        gitFile = slash.join @gitDir, '.git', 'HEAD'
        
        if slash.fileExists gitFile
            
            refPath = fs.readFileSync gitFile, 'utf8'
            if refPath.startsWith 'ref: '
                gitFile = slash.join @gitDir, '.git', refPath.slice(5).trim()

            @watcher = fs.watch gitFile
            @watcher.on 'change', (changeType, path) => 
                if changeType == 'change'
                    cb @gitDir
                    post.emit 'gitRefChanged', @gitDir

    unwatch: ->
        
        @watcher?.close()
        delete @watcher
                
module.exports = GitWatch

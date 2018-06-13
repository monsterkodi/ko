###
000   000   0000000   000000000   0000000  000   000  
000 0 000  000   000     000     000       000   000  
000000000  000000000     000     000       000000000  
000   000  000   000     000     000       000   000  
00     00  000   000     000      0000000  000   000  
###

{ post, slash, fs, log } = require 'kxk'

chokidar = require 'chokidar'
root     = require './root'

class GitWatch
    
    constructor: ->
        
        @watcher = null
    
    watch: (file) ->
        
        @unwatch()        

        return if not file?
        
        root file, (gitDir) =>
            
            return if not gitDir?
            
            gitFile = slash.join gitDir, '.git', 'HEAD'
            
            if slash.fileExists gitFile
                
                refPath = fs.readFileSync gitFile, 'utf8'
                if refPath.startsWith 'ref: '
                    gitFile = slash.join gitDir, '.git', refPath.slice(5).trim()

                @watcher = chokidar.watch gitFile
                @watcher.on 'change', (path) -> 
                    post.emit 'gitRefChanged', file, gitDir

    unwatch: ->
        
        @watcher?.close()
        delete @watcher
                
module.exports = new GitWatch()


#  0000000   000  000000000  000   000   0000000   000000000   0000000  000   000  
# 000        000     000     000 0 000  000   000     000     000       000   000  
# 000  0000  000     000     000000000  000000000     000     000       000000000  
# 000   000  000     000     000   000  000   000     000     000       000   000  
#  0000000   000     000     00     00  000   000     000      0000000  000   000  

{ fileExists, post, path, fs, log } = require 'kxk'

chokidar = require 'chokidar'
gitRoot  = require './gitroot'

class GitWatch
    
    constructor: ->
        
        @watcher = null
    
    watch: (file) ->
        
        @unwatch()        

        return if not file?
        
        gitRoot file, (gitDir) =>
            
            return if not gitDir?
            
            gitFile = path.join gitDir, '.git', 'HEAD'
            
            if fileExists gitFile
                
                refPath = fs.readFileSync gitFile, 'utf8'
                if refPath.startsWith 'ref: '
                    gitFile = path.join gitDir, '.git', refPath.slice(5).trim()

                @watcher = chokidar.watch gitFile
                @watcher.on 'change', (path) -> 
                    post.emit 'gitRefChanged', file, gitDir

    unwatch: ->
        
        @watcher?.close()
        delete @watcher
                
module.exports = new GitWatch()

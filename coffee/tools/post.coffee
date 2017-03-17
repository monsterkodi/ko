
#   00000000    0000000    0000000  000000000
#   000   000  000   000  000          000   
#   00000000   000   000  0000000      000   
#   000        000   000       000     000   
#   000         0000000   0000000      000   

events = require 'events'

class Post extends events
    
    @singleton = null
    
    constructor: () -> Post.singleton = @
    @instance:   () -> Post.singleton or new Post()
    stop:        () -> @removeAllListeners()
        
module.exports = Post.instance()

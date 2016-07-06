# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

_     = require 'lodash'
nconf = require 'nconf'
noon  = require 'noon'
log   = require './log'
fs    = require 'fs'

class Prefs
    
    @timeout = 5000

    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    @init: (path, defs={}) ->
        
        if window?
            @ipc = require('electron').ipcRenderer
        else
            @path = path
            @timer = null
            nconf.use 'user',
                type: 'file'
                format: 
                    parse: noon.parse
                    stringify: (o,n,i) -> 
                        # if typeof(o) == 'object' and o.constructor.name == 'Array'
                            # log 'array'
                            # ("|#{v}|" for v in o).join '\n'
                        # else
                            # log "no array", o
                        noon.stringify o, {indent: i, maxalign: 8}
                file: path
            nconf.defaults defs
    
    #  0000000   00000000  000000000          0000000  00000000  000000000
    # 000        000          000      000   000       000          000   
    # 000  0000  0000000      000    0000000 0000000   0000000      000   
    # 000   000  000          000      000        000  000          000   
    #  0000000   00000000     000            0000000   00000000     000   
        
    @get: (key, value) ->
        if @ipc?
            @ipc.sendSync 'prefGet', key, value
        else
            nconf.get(key) ? value
            
    @set: (key, value) ->
        if @ipc?
            @ipc.send 'prefSet', key, value
        else
            clearTimeout @timer if @timer
            @timer = setTimeout @save, @timeout

            if value?
                nconf.set key, value    
            else
                nconf.clear key
        
    @del: (key, value) -> @set key

    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000

    @save: (cb) =>
        clearTimeout @timer if @timer
        @timer = null
        nconf.save (err) => 
            log "nconf save error:", err if err?
            cb? !err?
        
module.exports = Prefs

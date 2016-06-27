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

    @path = null
    @changes = []
    @timer = null
    @timeout = 1000

    @init: (path, defs={}) ->
        Prefs.path = path 
        nconf.use 'user',
            type: 'file'
            format: 
                parse: noon.parse
                stringify: (o,n,i) -> noon.stringify o, indent: i, maxalign: 8
            file: path
        nconf.defaults defs

    @get: (key, value) -> nconf.get(key) ? value
    @set: (key, value, skipSave) ->
        log "prefs.set #{key}: #{value} s:#{skipSave}"
        @s(key, value) if not skipSave
        if value?
            nconf.set key, value    
        else
            nconf.clear key
        
    @del: (key, value) -> @set key

    #  0000000
    # 000     
    # 0000000 
    #      000
    # 0000000 
    
    @s: (key, value) ->
        @changes.push [key, value]
        if @timer then clearTimeout @timer
        @timer = setTimeout @save, @timeout

    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000

    @save: =>
        @timer = null
        log "prefs.save"
        nconf.load (err) =>
            if not err?
                log "nconf loaded"
                for c in @changes
                    @set c[0], c[1], true
                nconf.save (err) => 
                    log "nconf save error:", err if err?
                    log "nconf saved", nconf.get 'windows' if not err?
                @changes = []
            else log "nconf load error:", err

module.exports = Prefs

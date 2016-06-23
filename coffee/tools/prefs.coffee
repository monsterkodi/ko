# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

_   = require 'lodash'
log = require './log'
fs  = require 'fs'

class Prefs

    @path = null
    @defs = null    
    @debug = true
    @cache = {}
    @changes = []
    @timer = null
    @timeout = 2000

    @init: (path, defs={}) ->
        Prefs.path = path 
        Prefs.defs = defs
        Prefs.load()

    @get: (key, value) -> @cache[key] ? value
    @set: (key, value) -> @s(key, value) and @cache[key] = value
        
    @setPath: (path, value, skip) ->
        @s path, value if not skip
        c = @cache
        s = path.split '.'
        # log "@setPath #{path}"
        while s.length
            k = s.shift()
            if s.length
                if not c[k]? 
                    c[k] = {}
                c = c[k]
            else
                c[k] = value        

    @getPath: (path, value) ->
        s = path.split '.'
        c = @cache
        while s.length
            k = s.shift()
            c = c[k]
            if not c?
                return value
        c
                
    @del: (key, value) -> @s(key, null) and _.pull @cache[key], value

    @load: () ->
        # log "prefs.load"
        @cache = {}
        try
            @cache = JSON.parse fs.readFileSync(Prefs.path, encoding:'utf8')
        catch 
            1       
            # console.log 'can\'t load prefs file', Prefs.path
        for key in Object.keys Prefs.defs
            if not @cache[key]?
                @cache[key] = Prefs.defs[key]
        @cache

    @s: (keypath, value) ->
        @changes.push [keypath, value]
        if @timer then clearTimeout @timer
        @timer = setTimeout @save, @timeout

    @save: =>
        @load()
        for c in @changes
            @setPath c[0], c[1], true        
        json = JSON.stringify(@cache, null, "    ")      
        # console.log 'prefs.save', Prefs.path, json if Prefs.debug
        fs.writeFileSync Prefs.path, json, encoding:'utf8'
        # log "prefs.save"

module.exports = Prefs

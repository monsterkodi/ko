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

    @init: (path, defs={}) ->
        Prefs.path = path 
        Prefs.defs = defs
        Prefs.load()

    @get: (key, value) -> Prefs.load()[key] ? value
    @set: (key, value) -> 
        values = Prefs.load()
        values[key] = value
        Prefs.save values
        
    @setPath: (path, value) ->
        p = Prefs.load()
        c = p
        s = path.split '.'
        while s.length
            k = s.shift()
            if s.length
                if not c[k]? 
                    c[k] = {}
                c = c[k]
            else
                c[k] = value
        Prefs.save p

    @getPath: (path, value) ->
        p = Prefs.load()
        s = path.split '.'
        c = p
        while s.length
            k = s.shift()
            c = c[k]
            if not c?
                return value 
        c
                
    @add: (key, value) ->
        values = Prefs.load()
        values[key].push value
        Prefs.save values
        
    @one: (key, value) ->
        values = Prefs.load()
        _.pull values[key], value
        values[key].push value 
        Prefs.save values

    @del: (key, value) ->
        values = Prefs.load()
        _.pull values[key], value
        Prefs.save values

    @load: () ->
        # log "prefs.load"
        values = {}
        try
            values = JSON.parse fs.readFileSync(Prefs.path, encoding:'utf8')
        catch 
            1       
            # console.log 'can\'t load prefs file', Prefs.path
        for key in Object.keys Prefs.defs
            if not values[key]?
                values[key] = Prefs.defs[key]
        values

    @save: (values) ->
        json = JSON.stringify(values, null, "    ")
        console.log 'prefs.save', Prefs.path, json if Prefs.debug
        fs.writeFileSync Prefs.path, json, encoding:'utf8'

module.exports = Prefs

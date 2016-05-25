#00000000  000   000  00000000   0000000  000   000  000000000  00000000
#000        000 000   000       000       000   000     000     000     
#0000000     00000    0000000   000       000   000     000     0000000 
#000        000 000   000       000       000   000     000     000     
#00000000  000   000  00000000   0000000   0000000      000     00000000

noon     = require 'noon'
colors   = require 'colors'
coffee   = require 'coffee-script'
electron = require 'electron'
log      = require './tools/log'

class Execute
        
    @init: (cfg={}) => 
        # log 'Execute constructor', cfg

    @execute: (code) =>
        try
            return coffee.eval code
        catch e
            console.error colors.red.bold '[ERROR]', colors.red e

module.exports = Execute


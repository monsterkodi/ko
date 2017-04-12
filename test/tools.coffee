# 000000000   0000000    0000000   000       0000000  
#    000     000   000  000   000  000      000       
#    000     000   000  000   000  000      0000000   
#    000     000   000  000   000  000           000  
#    000      0000000    0000000   0000000  0000000   

{log, path, _} = require 'kxk'
{expect}       = require 'chai'
assert         = require 'assert'
noon           = require 'noon'
{Map,List}     = require 'immutable'

dirList = require '../coffee/tools/dirlist'

describe 'dirList', ->
    
    it 'lists this dir', (done) ->
        
        dirList __dirname, (err, list) ->
            if err then return done err
            expect(list.length) .to.be.above 1
            expect(list) .to.include 
                type:       'file'
                textFile:   true
                name:       path.basename __filename
                abs:        __filename
            done()
        

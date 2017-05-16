
#  0000000  000   000  000   000  000000000   0000000   000   000  
# 000        000 000   0000  000     000     000   000   000 000   
# 0000000     00000    000 0 000     000     000000000    00000    
#      000     000     000  0000     000     000   000   000 000   
# 0000000      000     000   000     000     000   000  000   000  

{ post, reversed, fs, log 
} = require 'kxk'
{ expect
} = require 'chai'

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b

syntax = require '../editor/syntax'
    

describe 'syntax', ->
    
    it 'coffee', ->
        
        dss = syntax.dissForTextAndSyntax 'log """txt"""', 'coffee'
        test dss[1].clss, 'string marker triple'
        test dss[2].clss, 'text'
        test dss[3].clss, 'string marker triple'

        dss = syntax.dissForTextAndSyntax 'log "txt"', 'coffee'
        test dss[1].clss, 'string marker double'
        test dss[2].clss, 'text value string double'
        test dss[3].clss, 'string marker double'

        dss = syntax.dissForTextAndSyntax "log 'txt'", 'coffee'
        test dss[1].clss, 'string marker single'
        test dss[2].clss, 'text value string single'
        test dss[3].clss, 'string marker single'
        
    return
    
    it 'text', ->
        
        dss = syntax.dissForTextAndSyntax "hello world", 'txt'
        test dss[0].start, 0
        test dss[0].clss,  'text'
        test dss[0].match, 'hello'
        test dss[1].start, 6
        test dss[1].clss,  'text'
        test dss[1].match, 'world'

    it 'strings', ->
        
        dss = syntax.dissForTextAndSyntax "what's it's meaning?", 'txt'
        expect(dss[0].cls).not.to.include 'string'
        for i in [1..4]
            expect(dss[i].cls).to.include 'string'
        
    it 'numbers', ->
        
        dss = syntax.dissForTextAndSyntax "hel10 w0r1d 10 20.0 a66 66a a.66 66.a", 'txt'
        expect(dss[2].cls).to.include 'number'
        expect(dss[2].cls).to.include 'int'
        expect(dss[3].cls).to.include 'number'
        expect(dss[3].cls).to.include 'float'
        
        expect(dss[0].cls).not.to.include 'number'
        expect(dss[1].cls).not.to.include 'number'
        for i in [4..11]
            expect(dss[i].cls).not.to.include 'number'
        
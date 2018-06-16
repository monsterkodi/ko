###
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000      000   000  0000  000  000       000       000   000  
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000    
000   000  000   000  000      000   000  000  0000  000       000       000   000  
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000  
###

{ log, str, post, reversed, fs } = require 'kxk'
{ expect } = require 'chai'

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b
   
Syntax = require '../editor/syntax'

text = []
getLine = (lineIndex) -> text[lineIndex]

syntax = new Syntax 'coffee', getLine
syntax.setFileType 'coffee'

diss = (li, di, clss, match) ->
    
    syntax.clear()
    dss = syntax.getDiss li
    return dss if not di?
    cls = dss[di].clss.split /\s+/
    for c in clss.split /\s+/
        if c.startsWith '!'
            expect(cls).not.include c.slice 1
        else
            expect(cls).to.include c
    if match?
        test dss[di].match, match

describe 'balancer', ->
        
    it 'string', ->

        text = ['"h e l l o  world"']
        diss 0, 0, 'string double marker'
        diss 0, 1, 'string double'
        diss 0, 2, 'string double'
        diss 0, 3, 'string double marker'

        text = ["'h e l l o'"]
        diss 0, 0, 'string single marker'
        diss 0, 1, 'string single'
        diss 0, 2, 'string single marker'

        text = ['"""h e l l o"""']
        diss 0, 0, 'string triple marker'
        diss 0, 1, 'string triple'
        diss 0, 2, 'string triple marker'
        
        text = ['"  hello  "']
        diss 0, 0, 'string double marker'
        diss 0, 1, 'string double'
        diss 0, 2, 'string double marker'
        
            
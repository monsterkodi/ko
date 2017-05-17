
#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000
# 0000000     00000    000 0 000     000     000000000    00000
#      000     000     000  0000     000     000   000   000 000
# 0000000      000     000   000     000     000   000  000   000

{ log, str, post, reversed, fs
} = require 'kxk'
{ expect
} = require 'chai'

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b

syntax = require '../editor/syntax'

describe 'syntax', ->

    it 'single strings', ->

        dss = syntax.dissForTextAndSyntax "'\"'", 'coffee'
        test dss[0].clss, 'syntax string marker single'
        test dss[1].clss, 'text string single'
        test dss[2].clss, 'syntax string marker single'
        
        dss = syntax.dissForTextAndSyntax "'\"\"'", 'coffee'
        test dss[0].clss, 'syntax string marker single'
        test dss[1].clss, 'text string single'
        test dss[2].clss, 'syntax string marker single'

        dss = syntax.dissForTextAndSyntax "'\"\"\"'", 'coffee'
        test dss[0].clss, 'syntax string marker single'
        test dss[1].clss, 'text string single'
        test dss[2].clss, 'syntax string marker single'

    it 'escape', ->

        dss = syntax.dissForTextAndSyntax "'\\'\\\"\\''", 'coffee'
        test dss[0].clss, 'syntax string marker single'
        test dss[1].clss, 'text string single'
        test dss[2].clss, 'syntax string marker single'

        dss = syntax.dissForTextAndSyntax '"\\"\\\'\\""', 'coffee'
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'text string double'
        test dss[2].clss, 'syntax string marker double'

        dss = syntax.dissForTextAndSyntax '"""\\"\\\'\\""""', 'coffee'
        test dss[0].clss, 'syntax string marker triple'
        test dss[1].clss, 'text string triple'
        test dss[2].clss, 'syntax string marker triple'
            
    it 'unbalanced', ->

        dss = syntax.dissForTextAndSyntax "'\\'", 'coffee'
        test dss[0].clss, 'syntax string marker single'
        test dss[1].clss, 'text string single'
        test dss.length, 2
        
        dss = syntax.dissForTextAndSyntax '"\\"', 'coffee'
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'text string double'
        test dss.length, 2
    
    it 'interpolation', ->
        
        dss = syntax.dissForTextAndSyntax '"#{1}"', 'coffee'
        log dss
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'syntax string interpolation open'
        expect(dss[2].cls).to.include 'number'
        expect(dss[2].cls).to.include 'int'
        test dss[3].clss, 'syntax string interpolation close'
        test dss[4].clss, 'syntax string marker double'
        
    it 'double strings', ->

        dss = syntax.dissForTextAndSyntax "\"'\"", 'coffee'
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'text string double'
        test dss[2].clss, 'syntax string marker double'

        dss = syntax.dissForTextAndSyntax "\"''\"", 'coffee'
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'text string double'
        test dss[2].clss, 'syntax string marker double'

    it 'triple string', ->

        dss = syntax.dissForTextAndSyntax 'log """txt"""', 'coffee'
        test dss[1].clss, 'syntax string marker triple'
        test dss[2].clss, 'text string triple'
        test dss[3].clss, 'syntax string marker triple'

        dss = syntax.dissForTextAndSyntax 'log """t\'t"""', 'coffee'
        test dss[1].clss, 'syntax string marker triple'
        test dss[2].clss, 'text string triple'
        test dss[3].clss, 'syntax string marker triple'

        dss = syntax.dissForTextAndSyntax 'log """t"\'\'"t"""', 'coffee'
        test dss[1].clss, 'syntax string marker triple'
        test dss[2].clss, 'text string triple'
        test dss[3].clss, 'syntax string marker triple'
        
    it 'brackets', ->

        dss = syntax.dissForTextAndSyntax "{ }", 'coffee'
        test dss[0].clss, 'syntax bracket open'
        test dss[1].clss, 'syntax bracket close'
        test dss.length, 2

        dss = syntax.dissForTextAndSyntax "{}", 'coffee'
        test dss[0].clss, 'syntax bracket open'
        test dss[1].clss, 'syntax bracket close'
        test dss.length, 2

    it 'simple strings', ->

        dss = syntax.dissForTextAndSyntax 'log "txt"', 'coffee'
        test dss[1].clss, 'syntax string marker double'
        test dss[2].clss, 'text string double'
        test dss[3].clss, 'syntax string marker double'

        dss = syntax.dissForTextAndSyntax "log 'txt'", 'coffee'
        test dss[1].clss, 'syntax string marker single'
        test dss[2].clss, 'text string single'
        test dss[3].clss, 'syntax string marker single'

        dss = syntax.dissForTextAndSyntax '"txt"', 'coffee'
        test dss[0].clss, 'syntax string marker double'
        test dss[1].clss, 'text string double'
        test dss[2].clss, 'syntax string marker double'

    it 'numbers', ->

        dss = syntax.dissForTextAndSyntax "hel10 w0r1d 10 20.0 a66 66a a.66 66.a", 'coffee'
        expect(dss[2].cls).to.include 'number'
        expect(dss[2].cls).to.include 'int'
        expect(dss[3].cls).to.include 'number'
        expect(dss[3].cls).to.include 'float'
        expect(dss[4].cls).to.include 'float'
        expect(dss[5].cls).to.include 'float'

        expect(dss[0].cls).not.to.include 'number'
        expect(dss[1].cls).not.to.include 'number'
        for i in [6..13]
            expect(dss[i].cls).not.to.include 'number'

    it 'text', ->

        dss = syntax.dissForTextAndSyntax "hello world", 'txt'
        test dss[0].start, 0
        test dss[0].clss,  'text'
        test dss[0].match, 'hello'
        test dss[1].start, 6
        test dss[1].clss,  'text'
        test dss[1].match, 'world'



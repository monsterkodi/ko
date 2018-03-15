
#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000
# 0000000     00000    000 0 000     000     000000000    00000
#      000     000     000  0000     000     000   000   000 000
# 0000000      000     000   000     000     000   000  000   000

{ log, str, post, reversed, fs } = require 'kxk'
{ expect } = require 'chai'

Editor = require '../editor/editor'
editor = new Editor 'test_syntax'
after -> editor.del()

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b

text = (txt, typ='coffee') ->
    
    editor.setFileType typ
    editor.setText txt
    
diss = (li, di, clss, match) ->
    
    dss = editor.syntax.getDiss li
    return dss if not di?
    cls = dss[di].clss.split /\s+/
    for c in clss.split /\s+/
        if c.startsWith '!'
            expect(cls).not.include c.slice 1
        else
            expect(cls).to.include c
    if match?
        test dss[di].match, match
    
describe 'syntax', ->

    describe 'comments', ->
        
        it 'simple', ->
            
            text "hello # comment"
            diss 0, 0, 'text'
            diss 0, 1, 'comment marker'
            diss 0, 2, 'comment'

        it 'solo', -> 
            text "# a comment"
            diss 0, 0, 'comment marker'
            diss 0, 1, 'comment'
            
    describe 'strings', ->
        
        it 'simple', ->
    
            text 'log "txt"'
            diss 0, 1, 'string marker double'
            diss 0, 2, 'string double'
            diss 0, 3, 'string marker double'
    
            text "log 'txt'"
            diss 0, 1, 'string marker single'
            diss 0, 2, 'string single'
            diss 0, 3, 'string marker single'
    
            text '"txt"'
            diss 0, 0, 'string marker double'
            diss 0, 1, 'string double'
            diss 0, 2, 'string marker double'
            
        it 'single', ->
    
            text "'\"'"
            diss 0, 0, 'string marker single'
            diss 0, 1, 'string single'
            diss 0, 2, 'string marker single'
            
            text "'\"\"'"
            diss 0, 0, 'string marker single'
            diss 0, 1, 'string single'
            diss 0, 2, 'string marker single'
    
            text "'\"\"\"'"
            diss 0, 0, 'string marker single'
            diss 0, 1, 'string single'
            diss 0, 2, 'string marker single'

        it 'double', ->
    
            text "\"'\""
            diss 0, 0, 'string marker double'
            diss 0, 1, 'string double'
            diss 0, 2, 'string marker double'
    
            text "\"''\""
            diss 0, 0, 'string marker double'
            diss 0, 1, 'string double'
            diss 0, 2, 'string marker double'
    
        it 'triple', ->
    
            text 'log """txt"""'
            diss 0, 1, 'string marker triple'
            diss 0, 2, 'string triple'
            diss 0, 3, 'string marker triple'
    
            text 'log """t\'t"""'
            diss 0, 1, 'string marker triple'
            diss 0, 2, 'string triple'
            diss 0, 3, 'string marker triple'
    
            text 'log """t"\'\'"t"""'
            diss 0, 1, 'string marker triple'
            diss 0, 2, 'string triple'
            diss 0, 3, 'string marker triple'
                
        it 'escape', ->
    
            text "'\\'\\\"\\''"
            diss 0, 0, 'string marker single'
            diss 0, 1, 'string single'
            diss 0, 2, 'string marker single'
    
            text '"\\"\\\'\\""'
            diss 0, 0, 'string marker double'
            diss 0, 1, 'string double'
            diss 0, 2, 'string marker double'
    
            text '"""\\"\\\'\\""""'
            diss 0, 0, 'string marker triple'
            diss 0, 1, 'string triple'
            diss 0, 2, 'string marker triple'
                
        it 'unbalanced', ->
    
            text "'\\'"
            diss 0, 0, 'string marker single'
            diss 0, 1, 'syntax'
            test diss(0).length, 2
            
            text '"\\"'
            diss 0, 0, 'string marker double'
            diss 0, 1, 'syntax'
            test diss(0).length, 2
        
        it 'interpolation', ->
            
            text '"#{1}"'
            diss 0, 0, 'string marker double'
            diss 0, 1, 'interpolation marker'
            diss 0, 2, 'number int'
            diss 0, 3, 'interpolation marker'
            diss 0, 4, 'string marker double'
    
        it 'fake interpolation', ->
            
            text '\'"#{1}"\''
            diss 0, 0, 'string marker single'
            diss 0, 1, 'string single'
            diss 0, 2, 'string marker single'
            
        it 'dict', ->
            
            text "'{a:100}'"
            diss 0, 1, 'string single'
            
            text "\"{a:100}\""
            diss 0, 1, 'string double'
            
    it 'brackets', ->
        
        text "{ }"
        diss 0, 0, 'bracket open'
        diss 0, 1, 'bracket close'
        test diss(0).length, 2

        text "{}"
        diss 0, 0, 'bracket open'
        diss 0, 1, 'bracket close'
        test diss(0).length, 2

    it 'numbers', ->
        
        text "hel10 w0r1d 10 20.0 a66 66a a.66 66.a"
        diss 0, 0, '!number'
        diss 0, 1, '!number'
        diss 0, 2, 'number int'
        diss 0, 3, 'number float'
        diss 0, 4, 'number float'
        diss 0, 5, 'number float'

        for i in [6..13]
            diss 0, i, '!number'

    it 'text', ->

        text "hello world", 'txt'
        diss 0, 0, 'text', 'hello'
        diss 0, 1, 'text', 'world'

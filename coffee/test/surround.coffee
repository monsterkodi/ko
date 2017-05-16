
#  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000      
# 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000    
# 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000    
#      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000    
# 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000      

{log}           = require 'kxk'
{expect,should} = require 'chai'
assert          = require 'assert'
_               = require 'lodash'
should()

Editor = require '../editor/editor'
editor = new Editor 'test_surround'
after -> editor.del()

textIs = (t) -> expect(editor.text()).to.eql t
mainIs = (m) -> expect(editor.mainCursor()).to.eql m
cursIs = (c) -> expect(editor.cursors()).to.eql c
selsIs = (c) -> expect(editor.selections()).to.eql c
hlgtIs = (h) -> expect(editor.highlights()).to.eql h

describe 'surround', ->

    describe 'cursor pos', ->
        
        beforeEach -> editor.setText ''
        
        it 'brackets', ->
            editor.insertCharacter '{'
            mainIs [1,0]
            editor.insertCharacter '['
            mainIs [2,0]
            editor.insertCharacter '('
            mainIs [3,0]
            editor.insertCharacter ')'
            mainIs [4,0]
            editor.insertCharacter ']'
            mainIs [5,0]
            editor.insertCharacter '}'
            mainIs [6,0]
            
        it 'quotes', ->
            editor.insertCharacter '"'
            mainIs [1,0]
            editor.insertCharacter "'"
            mainIs [2,0]
            editor.insertCharacter '"'
            mainIs [3,0]
            editor.insertCharacter "'"
            mainIs [4,0]
            editor.insertCharacter '"'
            mainIs [5,0]
            editor.insertCharacter "'"
            mainIs [6,0]
            editor.insertCharacter '"'
            mainIs [7,0]
            editor.insertCharacter "'"
            mainIs [8,0]
            
        it 'interpolation', ->
            editor.insertCharacter '"'
            editor.insertSurroundCharacter "#"
            textIs '"#{}"'
            mainIs [3,0]
    
    describe 'insert surround character', ->
        beforeEach -> editor.setText ''
        
        it 'single quotes', ->
            editor.insertCharacter "'"
            textIs "''"
        
        it 'double quotes', ->
            editor.insertCharacter '"'
            textIs '""'
    
        it 'square brackets', ->
            editor.insertCharacter '['
            textIs '[]'
    
        it 'square brackets closing', ->
            editor.insertCharacter ']'
            textIs '[]'
    
        it 'round brackets', ->
            editor.insertCharacter '('
            textIs '()'
    
        it 'round brackets closing', ->
            editor.insertCharacter ')'
            textIs '()'
    
        it 'curly brackets', ->
            editor.insertCharacter '{'
            textIs '{}'
    
        it 'curly brackets closing', ->
            editor.insertCharacter '}'
            textIs '{}'
            
    describe 'string interpolation', ->
    
        it 'convert single quote', ->
            editor.setText "a = ''"
            editor.singleCursorAtPos [5,0]
            editor.insertSurroundCharacter "#"
            textIs 'a = "#{}"'
    
    describe 'stacking', ->
        
        it 'push & pop', ->
            editor.setText '' 
            editor.insertCharacter '['
            editor.insertCharacter '('
            textIs '[()]'
            editor.insertCharacter '{'    
            textIs '[({})]'
            editor.insertCharacter '"'    
            textIs '[({""})]'
            editor.insertCharacter "'"    
            textIs '[({"\'\'"})]'
            
            editor.insertCharacter "'" 
            textIs '[({"\'\'"})]'
            editor.insertCharacter '"'
            textIs '[({"\'\'"})]'
            editor.insertCharacter '}'
            textIs '[({"\'\'"})]'
            editor.insertCharacter ')'
            textIs '[({"\'\'"})]'
            editor.insertCharacter ']'
            textIs '[({"\'\'"})]'

    describe 'backward', ->
        
        it 'with stack', ->
            
            editor.setText ''
            editor.insertCharacter '['
            editor.insertCharacter '('
            editor.insertCharacter '{'    
            editor.insertCharacter '"'    
            textIs '[({""})]'
            editor.deleteBackward()
            textIs '[({})]'
            editor.deleteBackward()
            textIs '[()]'
            editor.deleteBackward()
            textIs '[]'
            editor.deleteBackward()
            textIs ''
            
        it 'without stack', ->
            
            editor.setText '[({""})]'
            editor.singleCursorAtPos [4,0]
            editor.deleteBackward()
            textIs '[({})]'
            editor.deleteBackward()
            textIs '[()]'
            editor.deleteBackward()
            textIs '[]'
            editor.deleteBackward()
            textIs ''
            
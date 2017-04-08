#  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000      
# 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000    
# 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000    
#      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000    
# 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000      

{log}           = require 'kxk'
{expect,should} = require 'chai'
{Map,List}      = require 'immutable'
assert          = require 'assert'
_               = require 'lodash'
should()

Editor = require '../coffee/editor/editor'
editor = new Editor

textIs = (t) -> expect(editor.text()).to.eql t
mainIs = (m) -> expect(editor.mainCursor()).to.eql m
cursIs = (c) -> expect(editor.cursors()).to.eql c
selsIs = (c) -> expect(editor.selections()).to.eql c
hlgtIs = (h) -> expect(editor.highlights()).to.eql h

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
        
describe 'stacking', ->
    beforeEach -> editor.setText '' 
    "'"
    it 'push pop', ->
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
        
describe 'string interpolation', ->
    it 'convert single quote', ->
        editor.setText "a = ''"
        editor.singleCursorAtPos [5,0]
        editor.insertSurroundCharacter "#"
        textIs 'a = "#{}"'

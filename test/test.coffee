# 000000000  00000000   0000000  000000000  
#    000     000       000          000     
#    000     0000000   0000000      000     
#    000     000            000     000     
#    000     00000000  0000000      000     
{
last,
log}   = require 'kxk'
_      = require 'lodash'
assert = require 'assert'
chai   = require 'chai'
expect = chai.expect
chai.should()

Editor = require '../coffee/editor/editor'
Undo   = require '../coffee/editor/undo'

editor = null
undo   = null

describe 'editor', ->
    
    it "should exist", -> _.isObject Editor
    it "should instantiate", -> _.isObject editor = new Editor
    it "should accept text", -> 
        editor.setText "hello\nworld"
        expect editor.lines 
        .to.eql ['hello', 'world']
        expect editor.text()
        .to.eql 'hello\nworld'

describe 'undo', ->

    it "should exist", -> _.isObject undo = editor.do
    
    for name in ['start', 'change', 'insert', 'delete', 'end', 'undo', 'redo']
        it "should implement #{name}", ->
            _.isFunction(undo[name]).should.be.true

    it 'should noop', -> 
        t = 'bla\nblub'
        editor.setText t
        undo.start()
        undo.end()
        expect editor.lines
        .to.eql t.split '\n'

# 0000000     0000000    0000000  000   0000000  
# 000   000  000   000  000       000  000       
# 0000000    000000000  0000000   000  000       
# 000   000  000   000       000  000  000       
# 0000000    000   000  0000000   000   0000000  

describe 'basic', ->
    describe 'edit', ->

        beforeEach -> undo.start()
    
        it 'should change a line', ->
            undo.change 0, 'hello world'
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'blub']
       
        it 'should insert a line', ->
            undo.insert 1, 'inserted'
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
       
        it 'should delete a line', ->
            undo.delete 1
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'blub']
            
    describe 'undo', ->
        beforeEach -> undo.undo()
        
        it 'should undo the delete', ->
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
    
        it 'should undo the insert', ->
            expect editor.lines 
            .to.eql ['hello world', 'blub']
    
        it 'should undo the change', ->
            expect editor.lines 
            .to.eql ['bla', 'blub']

    describe 'redo', ->
        beforeEach -> undo.redo()

        it 'should redo the change', ->
            expect editor.lines 
            .to.eql ['hello world', 'blub']

        it 'should redo the insert', ->
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
        
        it 'should redo the delete', ->
            expect editor.lines 
            .to.eql ['hello world', 'blub']
    
# 00     00  00000000  0000000    000  000   000  00     00  
# 000   000  000       000   000  000  000   000  000   000  
# 000000000  0000000   000   000  000  000   000  000000000  
# 000 0 000  000       000   000  000  000   000  000 0 000  
# 000   000  00000000  0000000    000   0000000   000   000  

describe 'medium', -> 
    describe 'edit', ->
        
        before -> 
            editor.setText 'hello\nworld'
            undo.reset()
        
        it "should accept a single cursor", ->
            editor.singleCursorAtPos [2,1]
            expect editor.mainCursor
            .to.eql [2,1]
            expect editor.cursors
            .to.eql [[2,1]]
            expect editor.selections
            .to.eql []
            
        it "should select text", ->
            editor.singleCursorAtPos [3,0], true
            expect editor.mainCursor
            .to.eql [3,0]
            expect editor.cursors
            .to.eql [[3,0]]
            expect editor.selections
            .to.eql [[0, [3,5]], [1, [0,2]]]
            
        it "should provide a clipboard text", ->
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'
        
        it "should replace the selection on input", ->
            editor.insertUserCharacter '-'
            expect editor.text()
            .to.eql 'hel-rld'

    describe 'undo', ->
        beforeEach -> undo.undo()
        
        it "should undo the input", ->
            expect editor.text()
            .to.eql 'hello\nworld'
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'            

        it "should undo the selection", ->
            expect editor.selections
            .to.eql []
            
    describe 'redo', ->
        beforeEach -> undo.redo()
        
        it "should redo the selection", ->
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'            

        it "should redo the input", ->
            expect editor.text()
            .to.eql 'hel-rld'
        
#  0000000   0000000   00     00  00000000   000      00000000  000   000  
# 000       000   000  000   000  000   000  000      000        000 000   
# 000       000   000  000000000  00000000   000      0000000     00000    
# 000       000   000  000 0 000  000        000      000        000 000   
#  0000000   0000000   000   000  000        0000000  00000000  000   000  

undoRedo = ->
    before = editor.text()
    undo.undo()
    undo.redo()
    after = editor.text()
    expect(before) .to.eql after

describe 'complex', -> 
    describe 'column break', ->
        
        text = '0000\n1111\n2222\n3333\n4444\n5555'
        lines = text.split '\n'
        
        before -> 
            editor.setText text
            editor.cursors = [[2,1], [2,2], [2,3], [2,4]]
            editor.mainCursor = last editor.cursors
            undo.reset()
            
        afterEach undoRedo
        
        it "should break lines", ->
            editor.insertUserCharacter '\n'
            expect editor.lines 
            .to.eql [
                '0000', '11', '11', '22', '22', '33', '33', '44', '44', '5555'
            ]

        it "should join lines", ->
            editor.deleteBackward ignoreLineBoundary: true
            expect(editor.lines) .to.eql lines

    describe 'row break', ->
        
        text = '0000\n1111\n2222'
        lines = text.split '\n'
        
        before -> 
            editor.setText text
            editor.cursors = [[1,1], [2,1], [3,1]]
            editor.mainCursor = last editor.cursors
            undo.reset()
            
        afterEach undoRedo
        
        it "should break lines", ->
            editor.insertUserCharacter '\n'
            expect editor.lines 
            .to.eql [
                '0000', '1', '1', '1', '1', '2222'
            ]

        it "should join lines", ->
            editor.deleteBackward ignoreLineBoundary: true
            expect(editor.lines) .to.eql lines

    describe 'row column break', ->
        
        text = '0000\n1111\n2222\n3333\n4444\n5555'
        lines = text.split '\n'
        
        before -> 
            editor.setText text
            editor.cursors = [[1,1], [3,1], [1,2], [3,2], [1,4], [3,4], [1,5], [3,5]]
            editor.mainCursor = last editor.cursors
            undo.reset()
            
        afterEach undoRedo
        
        it "should break lines", ->
            editor.insertUserCharacter '\n'
            expect editor.lines 
            .to.eql [
                '0000', '1', '11', '1', '2', '22', '2', '3333', '4', '44', '4', '5', '55', '5'
            ]

        it "should join lines", ->
            editor.deleteBackward ignoreLineBoundary: true
            expect(editor.lines) .to.eql lines

    describe 'multi selection insert', ->
        
        text = '0000\n1111\n2222\n3333'
        lines = text.split '\n'
        
        before -> 
            editor.setText text
            editor.cursors = [[1,1], [3,1], [1,2]]
            editor.mainCursor = last editor.cursors
            editor.selections = [[1, [1,2]], [1, [3,4]], [2, [1,3]]]
            undo.reset()
            
        afterEach undoRedo
        
        it "should insert", ->
            editor.insertUserCharacter '-'
            expect editor.lines 
            .to.eql [
                '0000', '1-1-', '2-2', '3333'
            ]



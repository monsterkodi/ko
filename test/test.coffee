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
    
    it "exists", -> _.isObject Editor
    it "instantiates", -> _.isObject editor = new Editor
    it "accepts text", -> 
        editor.setText "hello\nworld"
        expect editor.lines 
        .to.eql ['hello', 'world']
        expect editor.text()
        .to.eql 'hello\nworld'

describe 'undo', ->

    it "exists", -> _.isObject undo = editor.do
    
    describe 'implements', ->
        for name in ['start', 'change', 'insert', 'delete', 'end', 'undo', 'redo']
            it "#{name}", ->
                _.isFunction(undo[name]).should.be.true

    it 'noop', -> 
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
    
        it 'change', ->
            undo.change 0, 'hello world'
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'blub']
       
        it 'insert', ->
            undo.insert 1, 'inserted'
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
       
        it 'delete', ->
            undo.delete 1
            undo.end()
            expect editor.lines 
            .to.eql ['hello world', 'blub']
            
    describe 'undo', ->
        beforeEach -> undo.undo()
        
        it 'delete', ->
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
    
        it 'insert', ->
            expect editor.lines 
            .to.eql ['hello world', 'blub']
    
        it 'change', ->
            expect editor.lines 
            .to.eql ['bla', 'blub']

    describe 'redo', ->
        beforeEach -> undo.redo()

        it 'change', ->
            expect editor.lines 
            .to.eql ['hello world', 'blub']

        it 'insert', ->
            expect editor.lines 
            .to.eql ['hello world', 'inserted', 'blub']
        
        it 'delete', ->
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
        
        it "single cursor", ->
            editor.singleCursorAtPos [2,1]
            expect editor.mainCursor
            .to.eql [2,1]
            expect editor.cursors
            .to.eql [[2,1]]
            expect editor.selections
            .to.eql []
            
        it "select text", ->
            editor.singleCursorAtPos [3,0], true
            expect editor.mainCursor
            .to.eql [3,0]
            expect editor.cursors
            .to.eql [[3,0]]
            expect editor.selections
            .to.eql [[0, [3,5]], [1, [0,2]]]
            
        it "text of selection", ->
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'
        
        it "replace selection on input", ->
            editor.insertUserCharacter '-'
            expect editor.text()
            .to.eql 'hel-rld'

    describe 'undo', ->
        beforeEach -> undo.undo()
        
        it "input", ->
            expect editor.text()
            .to.eql 'hello\nworld'
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'            

        it "selection", ->
            expect editor.selections
            .to.eql []
            
    describe 'redo', ->
        beforeEach -> undo.redo()
        
        it "selection", ->
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'            

        it "input", ->
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
    describe 'break', ->
        describe 'column', ->
        
            text = '0000\n1111\n2222\n3333\n4444\n5555'
            lines = text.split '\n'
            
            before -> 
                editor.setText text
                editor.cursors = [[2,1], [2,2], [2,3], [2,4]]
                editor.mainCursor = [2,4]
                undo.reset()
                
            afterEach undoRedo
            
            it "break lines", ->
                editor.insertUserCharacter '\n'
                expect editor.lines 
                .to.eql [
                    '0000', '11', '11', '22', '22', '33', '33', '44', '44', '5555'
                ]
    
            it "join lines", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.lines) .to.eql lines
    
        describe 'row', ->
            
            text = '0000\n1111\n2222'
            lines = text.split '\n'
            
            before -> 
                editor.setText text
                editor.cursors = [[1,1], [2,1], [3,1]]
                editor.mainCursor = [3,1]
                undo.reset()
                
            afterEach undoRedo
            
            it "break lines", ->
                editor.insertUserCharacter '\n'
                expect editor.lines 
                .to.eql [
                    '0000', '1', '1', '1', '1', '2222'
                ]
    
            it "join lines", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.lines) .to.eql lines
    
        describe 'row & column', ->
            
            text = '0000\n1111\n2222\n3333\n4444\n5555'
            lines = text.split '\n'
            
            before -> 
                editor.setText text
                editor.cursors = [[1,1], [3,1], [1,2], [3,2], [1,4], [3,4], [1,5], [3,5]]
                editor.mainCursor = [3,5]
                undo.reset()
                
            afterEach undoRedo
            
            it "break lines", ->
                editor.insertUserCharacter '\n'
                expect editor.lines 
                .to.eql [
                    '0000', '1', '11', '1', '2', '22', '2', '3333', '4', '44', '4', '5', '55', '5'
                ]
    
            it "join lines", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.lines) .to.eql lines

    describe 'selection insert', ->
        
        afterEach undoRedo
        
        it "row", ->
            editor.setText '0123456789'
            editor.cursors = [[1,0], [6,0]]
            editor.mainCursor = [6,0]
            editor.selections = [[0, [1,4]], [0, [6,9]]]
            undo.reset()
            editor.insertUserCharacter '-'
            expect editor.text()
            .to.eql '0-45-9'
        
        it "column", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.cursors = [[1,1], [1,2]]
            editor.mainCursor = [1,2]
            editor.selections = [[1, [1,2]], [2, [1,3]]]
            undo.reset()
            editor.insertUserCharacter '-'
            expect editor.lines 
            .to.eql [
                '0000', '1-11', '2-2', '3333'
            ]
                
        it "row & column", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.cursors = [[1,1], [3,1], [1,2]]
            editor.mainCursor = [1,2]
            editor.selections = [[1, [1,2]], [1, [3,4]], [2, [1,3]]]
            undo.reset()
            
            editor.insertUserCharacter '-'
            expect editor.lines 
            .to.eql [
                '0000', '1-1-', '2-2', '3333'
            ]
    
        it "multirow", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.singleCursorAtPos [2,0]
            editor.singleCursorAtPos [2,3], true
            undo.reset()
            
            editor.insertUserCharacter '-'
            expect editor.text()
            .to.eql '00-33'

        it "multi multirow", ->
            editor.setText '0000\n1111\n2222\n3333\n4444\n5555'
            editor.singleCursorAtPos [2,1]
            editor.moveMainCursor 'down'
            editor.moveMainCursor 'down'
            editor.moveCursors 'down', true
            undo.reset()
            editor.insertUserCharacter '-'
            expect editor.text()
            .to.eql '0000\n11-22\n33-44\n5555'
    
    
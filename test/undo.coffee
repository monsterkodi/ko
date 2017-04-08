# 000000000  00000000   0000000  000000000  
#    000     000       000          000     
#    000     0000000   0000000      000     
#    000     000            000     000     
#    000     00000000  0000000      000     

{log}      = require 'kxk'
{expect}   = require 'chai'
{Map,List} = require 'immutable'
assert     = require 'assert'
_          = require 'lodash'

Editor = require '../coffee/editor/editor'
Do     = require '../coffee/editor/do'

# 000   000  000  00000000  000   000  
# 000   000  000  000       000 0 000  
#  000 000   000  0000000   000000000  
#    000     000  000       000   000  
#     0      000  00000000  00     00  

class FakeView
     
    constructor: (@editor) ->
        @divs = []
        @editor.changed = @changed     
        @editor.on 'linesSet', (lines) => @divs = _.clone lines
         
    changed: (changeInfo) =>
        for change in changeInfo.changes
            [di,li,ch] = [change.doIndex, change.newIndex, change.change]
            switch ch
                when 'changed'  then @divs[di] = @editor.state.line(li)
                when 'deleted'  then @divs.splice di, 1
                when 'inserted' then @divs.splice di, 0, @editor.state.line(li)
     
    text: -> @divs.join '\n'

editor   = null
undo     = null
fakeview = null

describe 'editor', ->
    
    it "exists", -> _.isObject Editor
    it "instantiates", -> _.isObject editor = new Editor
    it "fakeview", -> fakeview = new FakeView editor
    it "accepts text", -> 
        editor.setText "hello\nworld"
        expect editor.lines() 
        .to.eql ['hello', 'world']
        expect editor.text()
        .to.eql 'hello\nworld'
        expect fakeview.text()
        .to.eql 'hello\nworld'

describe 'undo', ->

    it "exists", -> _.isObject undo = editor.do
    
    it "isObject", -> _.isObject editor
    
    describe 'implements', ->
        for name in ['start', 'change', 'insert', 'delete', 'end', 'undo', 'redo']
            it "#{name}", -> _.isFunction(undo[name]).should.be.true

    it 'noop', -> 
        t = 'bla\nblub'
        editor.setText t
        undo.start()
        undo.end()
        expect editor.lines()
        .to.eql t.split '\n'

    describe 'calculate', ->
        
        it 'changes', ->
            oldState = Map lines: List ['a','b']
            changes  = editor.do.calculateChanges oldState, Map lines: List ['a', 'c']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:1, doIndex:1, newIndex:1, change:'changed'
            
            changes  = editor.do.calculateChanges oldState, Map lines: List ['c', 'b']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed'
            
            changes  = editor.do.calculateChanges oldState, Map lines: List ['c', 'd']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed'
            expect(changes.changes).to.include oldIndex:1, doIndex:1, newIndex:1, change:'changed'

        it 'deletions', ->
            oldState = Map lines: List ['a','b']
            changes  = editor.do.calculateChanges oldState, Map lines: List ['a']
            expect(changes.deletes).to.eql 1
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:1, doIndex: 1, change:'deleted'
            
            changes  = editor.do.calculateChanges oldState, Map lines: List ['b']
            expect(changes.deletes).to.eql 1
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:0, doIndex:0, change:'deleted'
    
            changes  = editor.do.calculateChanges oldState, Map lines: List ['c']
            expect(changes.deletes).to.eql 1
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed'
            expect(changes.changes).to.include oldIndex:1, doIndex:1, change:'deleted'

            oldState = Map lines: List ['a', 'b', 'c']
            changes  = editor.do.calculateChanges oldState, Map lines: List ['a']
            expect(changes.deletes).to.eql 2
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:1, doIndex:1, change:'deleted'
            expect(changes.changes).to.include oldIndex:2, doIndex:1, change:'deleted'

            changes  = editor.do.calculateChanges oldState, Map lines: List ['b']
            expect(changes.deletes).to.eql 2
            expect(changes.inserts).to.eql.false
            expect(changes.changes).to.include oldIndex:0, doIndex:0, change:'deleted'
            expect(changes.changes).to.include oldIndex:2, doIndex:1, change:'deleted'

        it 'insertions', ->
            oldState = Map lines: List ['a']
            changes  = editor.do.calculateChanges oldState, Map lines: List ['a', 'c']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql 1
            expect(changes.changes).to.include doIndex:1, newIndex:1, change:'inserted'
            
            changes  = editor.do.calculateChanges oldState, Map lines: List ['c', 'a']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql 1
            expect(changes.changes).to.include doIndex:0, newIndex:0, change:'inserted'

            changes  = editor.do.calculateChanges oldState, Map lines: List ['c', 'a', 'd']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql 2
            expect(changes.changes).to.include doIndex:0, newIndex:0, change:'inserted'
            expect(changes.changes).to.include doIndex:2, newIndex:2, change:'inserted'

            changes  = editor.do.calculateChanges oldState, Map lines: List ['c', 'a', '1', '2', '3']
            expect(changes.deletes).to.eql.false
            expect(changes.inserts).to.eql 4
            expect(changes.changes).to.include doIndex:0, newIndex:0, change:'inserted'
            expect(changes.changes).to.include doIndex:2, newIndex:2, change:'inserted'
            expect(changes.changes).to.include doIndex:3, newIndex:3, change:'inserted'
            expect(changes.changes).to.include doIndex:4, newIndex:4, change:'inserted'

compareFakeView = ->
    expect(fakeview.text()) .to.eql editor.text()

# 0000000     0000000    0000000  000   0000000  
# 000   000  000   000  000       000  000       
# 0000000    000000000  0000000   000  000       
# 000   000  000   000       000  000  000       
# 0000000    000   000  0000000   000   0000000  

describe 'basic', ->
    afterEach -> compareFakeView()
    describe 'edit', ->
        beforeEach -> undo.start()

        it 'change', ->
            undo.change 0, 'hello world'
            undo.end()
            expect editor.lines() 
            .to.eql ['hello world', 'blub']
       
        it 'insert', ->
            undo.insert 1, 'inserted'
            undo.end()
            expect editor.lines() 
            .to.eql ['hello world', 'inserted', 'blub']
       
        it 'delete', ->
            undo.delete 1
            undo.end()
            expect editor.lines() 
            .to.eql ['hello world', 'blub']
            
    describe 'undo', ->
        beforeEach -> undo.undo()
        
        it 'delete', ->
            expect editor.lines() 
            .to.eql ['hello world', 'inserted', 'blub']
    
        it 'insert', ->
            expect editor.lines() 
            .to.eql ['hello world', 'blub']
    
        it 'change', ->
            expect editor.lines() 
            .to.eql ['bla', 'blub']

    describe 'redo', ->
        beforeEach -> undo.redo()

        it 'change', ->
            expect editor.lines() 
            .to.eql ['hello world', 'blub']

        it 'insert', ->
            expect editor.lines() 
            .to.eql ['hello world', 'inserted', 'blub']
        
        it 'delete', ->
            expect editor.lines() 
            .to.eql ['hello world', 'blub']
    
# 00     00  00000000  0000000    000  000   000  00     00  
# 000   000  000       000   000  000  000   000  000   000  
# 000000000  0000000   000   000  000  000   000  000000000  
# 000 0 000  000       000   000  000  000   000  000 0 000  
# 000   000  00000000  0000000    000   0000000   000   000  

describe 'medium', -> 
    afterEach -> compareFakeView()
    describe 'edit', ->
        
        before -> 
            editor.setText 'hello\nworld'
            undo.reset()
        
        it "single cursor", ->
            editor.singleCursorAtPos [2,1]
            expect editor.mainCursor()
            .to.eql [2,1]
            expect editor.cursors()
            .to.eql [[2,1]]
            expect editor.selections()
            .to.eql []
            
        it "select text", ->
            editor.singleCursorAtPos [3,0], extend:true
            expect editor.mainCursor()
            .to.eql [3,0]
            expect editor.cursors()
            .to.eql [[3,0]]
            expect editor.selections()
            .to.eql [[0, [3,5]], [1, [0,2]]]
            expect editor.textOfSelection()
            .to.eql 'lo\nwo'
        
        it "replace selection on input", ->
            editor.insertCharacter '-'
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
            expect editor.state.selections()
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
    afterEach -> compareFakeView()
    
    # 0000000    00000000   00000000   0000000   000   000  
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    0000000    0000000   000000000  0000000    
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    000   000  00000000  000   000  000   000  
    
    describe 'break', ->
        describe 'column', ->
        
            text = '0000\n1111\n2222\n3333\n4444\n5555'
            
            before -> 
                editor.setText text
                editor.setCursors [[2,1], [2,2], [2,3], [2,4]]
                editor.setMain 3
                undo.reset()
                
            afterEach undoRedo
            
            it "break lines", ->
                editor.insertCharacter '\n'
                expect editor.lines() 
                .to.eql [
                    '0000', '11', '11', '22', '22', '33', '33', '44', '44', '5555'
                ]
                expect editor.cursors()
                .to.eql [[0,2], [0,4], [0,6], [0,8]]
    
            it "join lines", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.text()) .to.eql text
    
        describe 'row', ->
            
            text = '0000\n1111\n2222'
            
            before -> 
                editor.setText text
                editor.setCursors [[1,1], [2,1], [3,1]]
                editor.setMain 2
                undo.reset()
                
            afterEach undoRedo
            
            it "break line", ->
                editor.insertCharacter '\n'
                expect editor.lines() 
                .to.eql [
                    '0000', '1', '1', '1', '1', '2222'
                ]
    
            it "join line", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.text()) .to.eql text
    
        describe 'row & column', ->
            
            text = '0000\n1111\n2222\n3333\n4444\n5555'
            
            before -> 
                editor.setText text
                editor.setCursors [[1,1], [3,1], [1,2], [3,2], [1,4], [3,4], [1,5], [3,5]]
                editor.setMain 7
                undo.reset()
                
            afterEach undoRedo
            
            it "break mixed", ->
                editor.insertCharacter '\n'
                expect editor.lines() 
                .to.eql [
                    '0000', '1', '11', '1', '2', '22', '2', '3333', '4', '44', '4', '5', '55', '5'
                ]
    
            it "join mixed", ->
                editor.deleteBackward ignoreLineBoundary: true
                expect(editor.lines()) .to.eql text.split '\n'

    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000   
    
    describe 'selection insert', ->
        afterEach undoRedo
        
        it "row", ->
            editor.setText '0123456789'
            editor.setCursors    [[1,0], [6,0]]
            editor.setMain       1
            editor.setSelections [[0, [1,4]], [0, [6,9]]]
            undo.reset()
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '0-45-9'
        
        it "column", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.setCursors    [[1,1], [1,2]]
            editor.setMain       1
            editor.setSelections [[1, [1,2]], [2, [1,3]]]
            undo.reset()
            editor.insertCharacter '-'
            expect editor.lines() 
            .to.eql [
                '0000', '1-11', '2-2', '3333'
            ]
                
        it "row & column", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.setCursors    [[1,1], [3,1], [1,2]]
            editor.setMain       2
            editor.setSelections [[1, [1,2]], [1, [3,4]], [2, [1,3]]]
            undo.reset()
            
            editor.insertCharacter '-'
            expect editor.lines() 
            .to.eql [
                '0000', '1-1-', '2-2', '3333'
            ]
    
    # 00     00  000   000  000      000000000  000  00000000    0000000   000   000  
    # 000   000  000   000  000         000     000  000   000  000   000  000 0 000  
    # 000000000  000   000  000         000     000  0000000    000   000  000000000  
    # 000 0 000  000   000  000         000     000  000   000  000   000  000   000  
    # 000   000   0000000   0000000     000     000  000   000   0000000   00     00  
    
    describe 'multirow', ->
        
        it "single", ->
            editor.setText '0000\n1111\n2222\n3333'
            editor.singleCursorAtPos [2,0]
            editor.singleCursorAtPos [2,3], extend:true
            undo.reset()
            
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '00-33'
            
        it "single undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000\n1111\n2222\n3333'

        it "single redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '00-33'

        it "double", ->
            editor.setText '0000\n1111\n2222\n3333\n4444\n5555'
            editor.singleCursorAtPos [2,1]
            editor.moveMainCursor 'down', erase:false
            editor.moveMainCursor 'down', erase:true
            editor.moveCursors 'down', extend:true
            undo.reset()
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '0000\n11-22\n33-44\n5555'

        it "double undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000\n1111\n2222\n3333\n4444\n5555'

        it "double redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '0000\n11-22\n33-44\n5555'

        it "triple", ->
            editor.setText '0000\n1111\n2222\n3333\n4444\n5555\n6666\n7777\n8888'
            editor.singleCursorAtPos [2,1]
            editor.moveMainCursor 'down', erase:false
            editor.moveMainCursor 'down', erase:true
            editor.moveMainCursor 'down', erase:true
            editor.moveMainCursor 'down', erase:true
            editor.moveCursors 'down', extend:true
            editor.moveCursors 'down', extend:true
            undo.reset()
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '0000\n11-33\n4444\n55-77\n8888'
            
        it "triple undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000\n1111\n2222\n3333\n4444\n5555\n6666\n7777\n8888'

        it "triple redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '0000\n11-33\n4444\n55-77\n8888'
    
    # 00     00  000   000  000      000000000  000   0000000   0000000   000      
    # 000   000  000   000  000         000     000  000       000   000  000      
    # 000000000  000   000  000         000     000  000       000   000  000      
    # 000 0 000  000   000  000         000     000  000       000   000  000      
    # 000   000   0000000   0000000     000     000   0000000   0000000   0000000  
    
    describe 'multicol', ->
                
        it 'single row', ->
            editor.setText '000011112222333344445555'
            editor.setCursors [[4,0], [8,0], [12,0], [16,0], [20,0]]
            editor.setMain 4
            undo.reset()
            editor.insertCharacter '-'
            expect editor.cursors()
            .to.eql [[5,0], [10,0], [15,0], [20,0], [25,0]]
            editor.insertCharacter '+'
            expect editor.text()
            .to.eql '0000-+1111-+2222-+3333-+4444-+5555'

        it "single row undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000-1111-2222-3333-4444-5555'
            undo.undo()
            expect editor.text()
            .to.eql '000011112222333344445555'

        it "single row redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '0000-1111-2222-3333-4444-5555'
            undo.redo()
            expect editor.text()
            .to.eql '0000-+1111-+2222-+3333-+4444-+5555'
        
        it 'mixed', ->
            editor.setText '0000\n1111\n2222'
            editor.singleCursorAtPos [2,0]
            editor.singleCursorAtPos [2,1], extend:true
            editor.addCursorAtPos [2,2]
            undo.reset()
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '00-11\n22-22'
            
        it "mixed undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000\n1111\n2222'

        it "mixed redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '00-11\n22-22'

        it "delete selection", ->
            editor.setText '0000\n1111'
            editor.singleCursorAtPos [2,0]
            editor.singleCursorAtPos [2,1], extend:true
            editor.addCursorAtPos [3,1]
            undo.reset()
            editor.deleteSelection()
            expect editor.cursors()
            .to.eql [[2,0], [3,0]]

        it "delete multiple selections", ->
            editor.setText '0000\n1111'
            editor.setSelections [[0,[2,4]], [1, [0,2]], [1, [3,4]]]
            editor.setCursors [[2,1], [4,1]]
            editor.setMain 1
            undo.reset()
            editor.deleteSelection()
            expect editor.cursors()
            .to.eql [[2,0], [3,0]]
            expect editor.text()
            .to.eql '001'

        it 'mix', ->
            editor.setText '0000\n1111'
            editor.singleCursorAtPos [2,0]
            editor.singleCursorAtPos [2,1], extend:true
            editor.addCursorAtPos [3,1]
            undo.reset()
            editor.insertCharacter '-'
            expect editor.text()
            .to.eql '00-1-1'
            
        it "mix undo", ->
            undo.undo()
            expect editor.text()
            .to.eql '0000\n1111'

        it "mix redo", ->
            undo.redo()
            expect editor.text()
            .to.eql '00-1-1'
            
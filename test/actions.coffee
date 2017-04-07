#  0000000    0000000  000000000  000   0000000   000   000   0000000  
# 000   000  000          000     000  000   000  0000  000  000       
# 000000000  000          000     000  000   000  000 0 000  0000000   
# 000   000  000          000     000  000   000  000  0000       000  
# 000   000   0000000     000     000   0000000   000   000  0000000   
{
first,
last,
log}   = require 'kxk'
_      = require 'lodash'
assert = require 'assert'
chai   = require 'chai'
{
Map,List
} = require 'immutable'
expect = chai.expect
chai.should()

Editor = require '../coffee/editor/editor'

editor = null

describe 'actions', ->
    
    before -> 
        editor = new Editor
        editor.setText ''
    
    describe 'implements', ->
        for name in [
            'insertCharacter', 'insertNewline', 'insertSalterCharacter', 'insertTab'
            'deleteBackward', 'deleteForward', 'deleteSelection', 'deleteTab'
            'selectMoreLines', 'selectLessLines'
            'moveLines', 'joinLines', 'duplicateLines'
            'indent', 'deIndent'
            'paste'
            'toggleComment'
            'setCursor', 'toggleCursorAtPos', 'addCursorAtPos', 'addCursors'
            'alignCursorsAndText', 'alignCursors', 'setCursorsAtSelectionBoundary'
            'delCursors', 'delCursorAtPos', 'clearCursors', 'clearCursorsAndHighlights'
            'moveAllCursors', 'moveMainCursor', 'moveCursors'
            'moveCursorsToLineBoundary', 'moveCursorsToWordBoundary'
            'selectSingleRange', 'selectNone', 'selectAll', 'selectInverted'
            'startSelection', 'endSelection', 'startStickySelection', 'endStickySelection'
            'addRangeToSelection'
            ]
            it "#{name}", -> _.isFunction(editor[name]).should.be.true
            
textIs = (t) -> expect(editor.text()).to.eql t
mainIs = (m) -> expect(editor.mainCursor()).to.eql m
cursIs = (c) -> expect(editor.cursors()).to.eql c
selsIs = (c) -> expect(editor.selections()).to.eql c

describe 'basic editing', ->
    it 'insertCharacter', ->
        editor.insertCharacter 'a'
        textIs 'a'
        editor.insertCharacter 'b'
        textIs 'ab'
        editor.insertCharacter ' '
        textIs 'ab '
        editor.insertCharacter 'c'
        editor.insertCharacter 'd'
        textIs 'ab cd'        
        
    it 'moveCursors', ->
        editor.moveCursors 'left'
        cursIs [[4,0]]
        editor.moveCursors 'left'
        mainIs [3,0]
        editor.moveCursorsToWordBoundary 'left'
        mainIs [2,0]
        
    it 'insertNewline', ->
        editor.insertNewline()
        textIs 'ab\n cd'
        mainIs [0,1]

    it 'duplicateLines', ->        
        editor.duplicateLines 'down'
        textIs 'ab\n cd\n cd'
        mainIs [0,2]        
        editor.duplicateLines 'up'
        textIs 'ab\n cd\n cd\n cd'
        mainIs [0,2]        

    it 'insertTab', ->                
        editor.insertTab()
        textIs 'ab\n cd\n     cd\n cd'
        editor.moveCursors 'down'
        editor.moveCursorsToLineBoundary 'left'
        mainIs [1,3]        
        editor.moveCursorsToLineBoundary 'left'
        mainIs [0,3]        
        editor.insertTab()
        mainIs [4,3]        
        editor.insertTab()
        mainIs [8,3]        
        textIs 'ab\n cd\n     cd\n         cd'
        
    it 'deleteForward', ->
        editor.deleteForward() 
        textIs 'ab\n cd\n     cd\n        cd '
        editor.moveCursorsToLineBoundary 'left'
        editor.moveCursors 'up'
        editor.deleteForward()
        textIs 'ab\n cd\n    cd\n        cd'
        editor.moveCursors 'up'        
        editor.deleteForward()
        textIs 'ab\ncd\n    cd\n        cd'        

    it 'toggleComment', ->
        editor.toggleComment()
        textIs "ab\n# cd\n    cd\n        cd"
        editor.toggleComment()
        textIs "ab\ncd\n    cd\n        cd"
        
    it 'selectMoreLines', ->
        editor.selectMoreLines()
        selsIs [[1, [0,2]]]
        mainIs [2,1]
        editor.selectMoreLines()
        selsIs [[1, [0,2]], [2, [0,6]]]
        mainIs [6,2]
        editor.selectMoreLines()
        selsIs [[1, [0,2]], [2, [0,6]], [3, [0,10]]]
        mainIs [10,3]
        
        
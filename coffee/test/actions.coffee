
#  0000000    0000000  000000000  000   0000000   000   000   0000000  
# 000   000  000          000     000  000   000  0000  000  000       
# 000000000  000          000     000  000   000  000 0 000  0000000   
# 000   000  000          000     000  000   000  000  0000       000  
# 000   000   0000000     000     000   0000000   000   000  0000000   

{log}           = require 'kxk'
{expect,should} = require 'chai'
assert          = require 'assert'
_               = require 'lodash'
should()

Editor = require '../editor/editor'
editor = new Editor
editor.setText ''

textIs = (t) -> expect(editor.text()).to.eql t
mainIs = (m) -> expect(editor.mainCursor()).to.eql m
cursIs = (c) -> expect(editor.cursors()).to.eql c
selsIs = (c) -> expect(editor.selections()).to.eql c
hlgtIs = (h) -> expect(editor.highlights()).to.eql h

describe 'actions', ->
        
    it 'exists', -> 
        editor .should.not.be.null
        editor['toggleComment'] .should.not.be.null
        
        
    describe 'implements', ->
        for name in [
            'toggleComment'
            'insertCharacter', 
            'indent', 'deIndent'
            'cut', 'copy', 'paste'
            'insertTab', 'deleteTab'
            'newline', 'newlineAtEnd'
            'selectMoreLines', 'selectLessLines'
            'moveLines', 'joinLines', 'duplicateLines'
            'deleteBackward', 'deleteForward', 'deleteSelection', 
            'deleteToEndOfLine', 'deleteToEndOfLineOrWholeLine'
            'setCursor', 'toggleCursorAtPos', 'addCursorAtPos', 'addCursors'
            'alignCursorsAndText', 'alignCursors', 'setCursorsAtSelectionBoundary'
            'delCursors', 'clearCursors', 'clearCursorsAndHighlights'
            'moveAllCursors', 'moveMainCursor', 'moveCursors'
            'moveCursorsToLineBoundary', 'moveCursorsToWordBoundary'
            'selectSingleRange', 'selectNone', 'selectAll', 'selectInverted', 'selectAllWords'
            'startSelection', 'endSelection', 'startStickySelection', 'endStickySelection'
            'selectAllHighlights', 'selectNextHighlight', 'selectPrevHighlight'
            'highlightWordAndAddToSelection', 'removeSelectedHighlight', 'highlightTextOfSelectionOrWordAtCursor'
            'insertSalterCharacter', 'startSalter',
            'insertSurroundCharacter']
            it "#{name}", -> _.isFunction(editor[name]).should.be.true
            
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
            
        it 'newline', ->
            editor.newline indent:false
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
            textIs 'ab\n cd\n     cd\n        cd'
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
            
        it 'selectLessLines', ->
            editor.selectLessLines()
            selsIs [[1, [0,2]], [2, [0,6]]]
            mainIs [6,2]
            
        it 'cut copy paste', ->
            editor.cut()
            textIs "ab\n        cd"
            editor.pasteText "cd\n    cd"
            textIs "ab\ncd\n    cd\n        cd"
            
    describe 'misc editing', ->
        
        it 'indent', ->
            editor.setText '123'
            editor.singleCursorAtPos [2,0]
            editor.indent()
            textIs "    123"
            editor.deIndent()
            textIs "123"
            
        it 'alignCursorsAndText', ->
            editor.setText """
                0123 567
                  234 67
                01 345678 0"""
            editor.singleCursorAtPos [5,0]
            editor.toggleCursorAtPos [6,1]
            editor.toggleCursorAtPos [10,2]
            editor.alignCursorsAndText()
            textIs """
                0123      567
                  234     67
                01 345678 0"""
            editor.setCursors [[0,0], [2,1], [1,2]]
            editor.alignCursorsAndText()
            textIs """
                  0123      567
                  234     67
                0 1 345678 0"""
    
        it 'highlight', ->
            editor.singleCursorAtPos [5,1]
            editor.highlightTextOfSelectionOrWordAtCursor()
            hlgtIs [[0,[6,11]], [1,[5,10]]]
            expect(editor.numHighlights()) .to.eql 2
            selsIs [[1,[5,10]]]
            editor.selectNextHighlight()
            selsIs [[0,[6,11]]]
            editor.selectPrevHighlight()
            selsIs [[1,[5,10]]]        
            editor.highlightWordAndAddToSelection()
            selsIs [[0,[6,11]], [1,[5,10]]]
            editor.deleteSelection()
            textIs """
                  0123 567
                  23467
                0 1 345678 0"""
            editor.singleCursorAtPos [1,2]
            editor.highlightTextOfSelectionOrWordAtCursor()
            editor.selectAllWords()
            editor.deleteSelection()
            textIs """
                0123567
                23467
                013456780"""
            
        it 'deleteToEndOfLine', ->
            editor.setText "x2345a\ny2345b\nz2345c"
            editor.singleCursorAtPos [3,1]
            editor.deleteToEndOfLine()
            textIs "x2345a\ny23\nz2345c"
            cursIs [[3,1]]
            selsIs []
            editor.singleCursorAtPos [0,1]
            editor.deleteToEndOfLine()
            textIs "x2345a\n\nz2345c"
            cursIs [[0,1]]
            selsIs []
            editor.setCursors [[3,0], [0,1], [3,2]]
            editor.deleteToEndOfLine()
            textIs "x23\n\nz23"
            cursIs [[3,0], [0,1], [3,2]]
            selsIs []
    
        it 'deleteToEndOfLineOrWholeLine', ->
            editor.setText "x2345a\ny2345b\nz2345c"
            editor.singleCursorAtPos [3,1]
            editor.deleteToEndOfLineOrWholeLine()
            textIs "x2345a\ny23\nz2345c"
            cursIs [[3,1]]
            mainIs [3,1]
            selsIs []
            editor.deleteToEndOfLineOrWholeLine()
            textIs "x2345a\nz2345c"
            cursIs [[0,1]]
            mainIs [0,1]
            selsIs []
            editor.deleteToEndOfLineOrWholeLine()
            textIs "x2345a\n"
            cursIs [[0,1]]
            mainIs [0,1]
            selsIs []
            editor.deleteToEndOfLineOrWholeLine()
            textIs "x2345a"
            cursIs [[0,0]]
            mainIs [0,0]
            selsIs []
            editor.deleteToEndOfLineOrWholeLine()
            textIs ""
            cursIs [[0,0]]
            mainIs [0,0]
            selsIs []
            editor.deleteToEndOfLineOrWholeLine()
            textIs ""
            cursIs [[0,0]]
            mainIs [0,0]
            selsIs []
            
        it 'newlineAtEnd', ->
            editor.setText "123456\n123456\n123456"
            editor.singleCursorAtPos [3,1]
            editor.newlineAtEnd()
            textIs "123456\n123456\n\n123456"

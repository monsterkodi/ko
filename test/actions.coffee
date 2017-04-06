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
{Map,List} = require 'immutable'
expect = chai.expect
chai.should()

Editor = require '../coffee/editor/editor'

editor = null

describe 'actions', ->
    
    before -> editor = new Editor
    
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
            'addRangeToSelection', 'removeFromSelection'
            ]
            it "#{name}", -> _.isFunction(editor[name]).should.be.true

            
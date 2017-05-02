
#  0000000   0000000   000       0000000   0000000  000   000   0000000   000   000   0000000   00000000   0000000  
# 000       000   000  000      000       000       000   000  000   000  0000  000  000        000       000       
# 000       000000000  000      000       000       000000000  000000000  000 0 000  000  0000  0000000   0000000   
# 000       000   000  000      000       000       000   000  000   000  000  0000  000   000  000            000  
#  0000000  000   000  0000000   0000000   0000000  000   000  000   000  000   000   0000000   00000000  0000000   

{log}      = require 'kxk'
assert     = require 'assert'
_          = require 'lodash'
{ expect, should
}      = require 'chai'
Editor = require '../editor/editor'
State  = require '../editor/state'
should()

editor = new Editor

describe 'calc', ->
    
    it 'changes', ->
        oldState = new State lines: ['a', 'b']
        changes  = editor.do.calculateChanges oldState, new State lines: ['a', 'c']
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:1, doIndex:1, newIndex:1, change:'changed', after: 'c'
        
        changes  = editor.do.calculateChanges oldState, new State lines: ['c', 'b']
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed', after: 'c'
        
        changes  = editor.do.calculateChanges oldState, new State lines: ['c', 'd']
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed', after: 'c'
        expect(changes.changes).to.include oldIndex:1, doIndex:1, newIndex:1, change:'changed', after: 'd'

    it 'deletion 1', ->
        oldState = new State lines: ['a', 'b']
        newState = oldState.deleteLine 1
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql 1
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:1, doIndex: 1, change:'deleted'
        
    it 'deletion 2', ->
        oldState = new State lines: ['a', 'b']
        newState = oldState.deleteLine 0
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql 1
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:0, doIndex:0, change:'deleted'

    it 'deletion 3', ->
        oldState = new State lines: ['a', 'b']
        changes  = editor.do.calculateChanges oldState, new State lines: ['c']
        expect(changes.deletes).to.eql 1
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:0, doIndex:0, newIndex:0, change:'changed', after: 'c'
        expect(changes.changes).to.include oldIndex:1, doIndex:1, change:'deleted'

    it 'deletion 4', ->
        oldState = new State lines: ['a', 'b', 'c']
        newState = oldState.deleteLine 1
        newState = newState.deleteLine 1
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql 2
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:1, doIndex:1, change:'deleted'
        expect(changes.changes).to.include oldIndex:2, doIndex:1, change:'deleted'

    it 'deletion 5', ->
        oldState = new State lines: ['a', '', '', '', 'c', 'd']
        newState = oldState.deleteLine 2
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql 1
        expect(changes.inserts).to.eql.false
        log changes.changes
        expect(changes.changes).to.include oldIndex:3, doIndex:3, change:'deleted'
        
    it 'deletion 5', ->
        oldState = new State lines: ['a', 'b', 'c']
        newState = oldState.deleteLine 0
        newState = newState.deleteLine 1
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql 2
        expect(changes.inserts).to.eql.false
        expect(changes.changes).to.include oldIndex:0, doIndex:0, change:'deleted'
        expect(changes.changes).to.include oldIndex:2, doIndex:1, change:'deleted'

    it 'insertion 1', ->
        oldState = new State lines: ['a']
        newState = oldState.insertLine 1, 'c'
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql 1
        expect(changes.changes).to.include doIndex:1, newIndex:1, change:'inserted', after: 'c'

    it 'insertion 2', ->
        oldState = new State lines: ['a']
        newState = oldState.insertLine 0, 'c'
        newState = newState.insertLine 2, 'd'
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql 2
        expect(changes.changes).to.include doIndex:0, newIndex:0, change:'inserted', after: 'c'
        expect(changes.changes).to.include doIndex:2, newIndex:2, change:'inserted', after: 'd'

    it 'insertion 3', ->
        oldState = new State lines: ['a']
        newState = oldState.insertLine 0, 'c'
        newState = newState.insertLine 2, '1'
        newState = newState.insertLine 3, '2'
        newState = newState.insertLine 4, '3'
        changes  = editor.do.calculateChanges oldState, newState
        expect(changes.deletes).to.eql.false
        expect(changes.inserts).to.eql 4
        expect(changes.changes).to.include doIndex:0, newIndex:0, change:'inserted', after: 'c'
        expect(changes.changes).to.include doIndex:2, newIndex:2, change:'inserted', after: '1'
        expect(changes.changes).to.include doIndex:3, newIndex:3, change:'inserted', after: '2'
        expect(changes.changes).to.include doIndex:4, newIndex:4, change:'inserted', after: '3'
            
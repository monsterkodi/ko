
#  0000000  000000000   0000000   000000000  00000000  
# 000          000     000   000     000     000       
# 0000000      000     000000000     000     0000000   
#      000     000     000   000     000     000       
# 0000000      000     000   000     000     00000000  

{ log, _ } = require 'kxk'
{ expect, should } = require 'chai'
assert = require 'assert'
State  = require '../editor/state'

should()

describe 'state', ->

    it 'text', ->
        state = new State lines: ['abc', 'def', '', '123']
        expect(state.text()).to.eql 'abc\ndef\n\n123'
    
    it 'lines differ', ->
        state = new State lines: ['abc', '', '', '', 'def']
        expect(state.line(1)).to.not.eql state.line(0)
        expect(state.line(0)).to.not.eql state.line(4)
        
    it 'same lines', ->
        state = new State lines: ['abc', '', '', '', 'def']
        expect(state.line(0)).to.eql state.line(0)
        expect(state.line(1)).to.eql state.line(1)
        expect(state.line(4)).to.eql state.line(4)

    it 'similar lines', ->
        state = new State lines: ['abc', '', '', '', 'abc']
        assert state.s.lines[0] != state.s.lines[4] 
        expect state.s.lines[1] != state.s.lines[2]
        
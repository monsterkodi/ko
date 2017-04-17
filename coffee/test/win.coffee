
{expect,should} = require 'chai'
should()

describe 'window', ->
    describe 'basics', ->
        it 'test', ->
            [1,2,3].indexOf(3).should.equal(2)
        it 'fails', ->
            [1,2,3].indexOf(3).should.equal(4)
            
# 00000000    0000000   000   000   0000000   00000000   0000000  
# 000   000  000   000  0000  000  000        000       000       
# 0000000    000000000  000 0 000  000  0000  0000000   0000000   
# 000   000  000   000  000  0000  000   000  000            000  
# 000   000  000   000  000   000   0000000   00000000  0000000   
{
last,
log}   = require 'kxk'
_      = require 'lodash'
assert = require 'assert'
chai   = require 'chai'
expect = chai.expect
chai.should()

Ranges = require '../coffee/tools/ranges'
ranges = null

describe 'ranges', ->
    
    it "exists", -> _.isObject Ranges
    it "instantiates", -> _.isObject ranges = new Ranges

    it 'positionsBetweenPosAndPosInPositions', ->
        positions = [[0,0], [2,0], [3,0], [4,0], [6,0], [4,1], [10,1], [3,2], [3,3]]
        expect ranges.positionsBetweenPosAndPosInPositions [3,0], [5,0], positions
        .to.eql [[3,0], [4,0]]
        expect ranges.positionsBetweenPosAndPosInPositions [5,0], [3,0], positions
        .to.eql [[3,0], [4,0]]
       
    
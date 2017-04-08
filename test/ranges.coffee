# 00000000    0000000   000   000   0000000   00000000   0000000  
# 000   000  000   000  0000  000  000        000       000       
# 0000000    000000000  000 0 000  000  0000  0000000   0000000   
# 000   000  000   000  000  0000  000   000  000            000  
# 000   000  000   000  000   000   0000000   00000000  0000000   

{log}    = require 'kxk'
{expect} = require 'chai'
assert   = require 'assert'
_        = require 'lodash'

Ranges = require '../coffee/tools/ranges'
ranges = null

describe 'ranges', ->
    
    it "exists", -> _.isObject Ranges
    it "instantiates", -> _.isObject ranges = new Ranges

    it 'positionsInLineAfterColInPositions', ->
        pl = [[0,0], [2,0], [3,0], [4,0], [6,0], [4,1], [10,1], [3,2], [3,3]]
        expect ranges.positionsInLineAfterColInPositions 3, 0, pl
        .to.eql [[3,3]]
        expect ranges.positionsInLineAfterColInPositions 2, 0, pl
        .to.eql [[3,2]]
        expect ranges.positionsInLineAfterColInPositions 1, 10, pl
        .to.eql []
        expect ranges.positionsInLineAfterColInPositions 1, 4, pl
        .to.eql [[10,1]]
        expect ranges.positionsInLineAfterColInPositions 1, 3, pl
        .to.eql [[4,1],[10,1]]

    it 'positionsBetweenPosAndPosInPositions', ->
        pl = [[0,0], [2,0], [3,0], [4,0], [6,0], [4,1], [10,1], [3,2], [3,3]]
        expect ranges.positionsBetweenPosAndPosInPositions [3,0], [5,0], pl
        .to.eql [[3,0], [4,0]]
        expect ranges.positionsBetweenPosAndPosInPositions [5,0], [3,0], pl
        .to.eql [[3,0], [4,0]]
       
    it 'lineIndicesInPositions', ->
        pl = [[0,0], [1,0], [10, 4], [11, 1], [13,0]]
        expect ranges.lineIndicesInPositions pl
        .to.eql [0,1,4]
        
    it 'rangesForLineIndicesInRanges', ->
        rl = [[0, [1,2]], [3, [4,5]], [6,[7,8]]]
        expect ranges.rangesForLineIndicesInRanges [0,6,2,0], rl
        .to.eql [[0, [1,2]], [6,[7,8]]]
    
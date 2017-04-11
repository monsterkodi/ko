# 00     00   0000000   000000000   0000000  000   000  00000000  00000000   
# 000   000  000   000     000     000       000   000  000       000   000  
# 000000000  000000000     000     000       000000000  0000000   0000000    
# 000 0 000  000   000     000     000       000   000  000       000   000  
# 000   000  000   000     000      0000000  000   000  00000000  000   000  

{log, _}   = require 'kxk'
{expect}   = require 'chai'
assert     = require 'assert'
noon       = require 'noon'
{Map,List} = require 'immutable'

matchr = require '../coffee/tools/matchr'

describe 'ranges', ->
    rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/
    it 'parses', ->
        ranges = matchr.ranges rgx, '~/path/line:666'
        expect(ranges) .to.eql [
            index: 0
            start: 0
            match: '~/path/line:666'
            value: '?'
        ]
    
describe 'dissect', ->

    ranges = new List [
        new Map 
            start: 0
            match: 'hello'
            value: 'world'
            index: 777
    ,
        new Map
            start: 2
            match: 'll'
            value: 'world'
            index: 666            
    ]

    sameResult = [
            start:  0
            cid:    777
            cls:  ['world']
            match: 'hello'
            clss:  'world'
        ]
            
    describe 'same', ->    

        it 'default', ->
            diss = matchr.dissect ranges.toJS()
            expect(diss) .to.eql sameResult
            
        it 'no join', ->
            diss = matchr.dissect ranges.toJS(), join:false
            expect(diss) .to.eql sameResult
            
        it 'join', ->
            diss = matchr.dissect ranges.toJS(), join:true
            expect(diss) .to.eql sameResult

    describe 'differ', ->    
        
        differ = ranges.setIn [1, 'value'], 'ells'
        
        it 'default', ->
            diss = matchr.dissect differ.toJS()
            expect(diss) .to.eql sameResult
            
        it 'no join', ->
            diss = matchr.dissect differ.toJS(), join:false
            expect(diss) .to.eql sameResult
             
        it 'join', ->
            diss = matchr.dissect differ.toJS(), join:true
            expect(diss) .to.eql [
                start:   0
                cid:     777
                cls:    ['world']
                match:   'he'
                clss:    'world'
            ,
                start:   2
                cid:     666
                cls:     ['world', 'ells']
                match:   'll'
                clss:    'world ells'
            ,
                start:   4
                cid:     777
                cls:     ['world']
                match:   'o'
                clss:    'world'
            ]
                
    describe 'test', ->
        
        it 'simple?', ->
            testRanges = noon.parse """
                .
                    start   0
                    match   abcd
                    value   ?
                    index   0
                .
                    start   4
                    match   efg
                    value   ?
                    index   0
                .
                    start   7
                    match   hij
                    value   ?
                    index   0
            """
            diss = matchr.dissect testRanges
            expect(diss) .to.eql [
                match:   'abcdefghij'
                start: 0
                cid: 0
                clss: '?'
                cls: ['?']
            ]
        
        # it 'fails?', ->
            # testRanges = noon.parse """
                # .
                    # start   0
                    # match   ~/s/ko/coffee/logview.coffee:19
                    # value   ?
                    # index   0
                # .
                    # start   30
                    # match   ~/s/ko/coffee/logview.coffee
                    # value   ?
                    # index   0
                # .
                    # start   58
                    # match   :19
                    # value   ?
                    # index   0
            # """
            # log testRanges
            # diss = matchr.dissect testRanges, log:log
            # log diss
            # expect(diss) .to.eql [
                # match:   '~/s/ko/coffee/logview.coffee:19'
                # start: 0
                # cid: 0
                # clss: '?'
                # cls: ['?']
            # ]
                
                 
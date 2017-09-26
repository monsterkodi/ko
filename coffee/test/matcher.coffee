
# 00     00   0000000   000000000   0000000  000   000  00000000  00000000   
# 000   000  000   000     000     000       000   000  000       000   000  
# 000000000  000000000     000     000       000000000  0000000   0000000    
# 000 0 000  000   000     000     000       000   000  000       000   000  
# 000   000  000   000     000      0000000  000   000  00000000  000   000  

{ _ }      = require 'kxk'
{expect}   = require 'chai'
assert     = require 'assert'
noon       = require 'noon'
Immutable  = require 'seamless-immutable'
matchr     = require '../tools/matchr'

describe 'matchr', ->
    
    # 00000000    0000000   000   000   0000000   00000000   0000000  
    # 000   000  000   000  0000  000  000        000       000       
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000   
    # 000   000  000   000  000  0000  000   000  000            000  
    # 000   000  000   000  000   000   0000000   00000000  0000000   
    
    describe 'ranges', ->
        
        rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/
        
        it 'handles empty matches', -> 
            ranges = matchr.ranges "a*b*", 'some text', 'g'
            expect(ranges) .to.eql []
            ranges = matchr.ranges "a*b*", 'some text', 'gi'
            expect(ranges) .to.eql []
            ranges = matchr.ranges "a*b*", 'some book', 'g'
            expect(ranges) .to.eql [
                index: 0
                start: 5
                match: 'b'
                value: 'found'
            ]
        
        it 'noon', ->
            ranges = matchr.ranges /^\s+([^#\s]+(?:\s\S+)*)/g, '  some key  value'
            expect(ranges) .to.eql [
                index: 0
                start: 2
                match: 'some key'
                value: 'found'
            ]
            
        it 'noon config', ->
            cfg = matchr.config noon.parse("^\\s+([^#\\s]+(?:\\s\\S+)*)  noon"), 'g'
            ranges = matchr.ranges cfg, '  some key  value'
            expect(ranges) .to.eql [
                index: 0
                start: 2
                match: 'some key'
                value: 'noon'
            ]
    
        it 'regexp', ->
            ranges = matchr.ranges rgx, '~/path/line:666'
            expect(ranges) .to.eql [
                index: 0
                start: 0
                match: '~/path/line:666'
                value: 'found'
            ]
    
        it 'string', ->
            ranges = matchr.ranges 'o..', 'module.exports = bla'
            expect(ranges) .to.eql [
                index: 0
                start: 1
                match: 'odu'
                value: 'found'
            ,
                index: 0
                start: 10
                match: 'ort'
                value: 'found'            
            ]
    
        it 'string|string', ->
            ranges = matchr.ranges 'mod|exp', 'module.exports = bla'
            expect(ranges) .to.eql [
                index: 0
                start: 0
                match: 'mod'
                value: 'found'
            ,
                index: 1
                start: 7
                match: 'exp'
                value: 'found'            
            ]
            
        it 'brackets', ->
            config = matchr.config '[^\w\s]+': 'syntax', '[{]': 'bracket.open', '[}]': 'bracket.close'
            ranges = matchr.ranges config, '{}'
            expect(ranges) .to.eql [
                index: 0
                start: 0
                match: '{}'
                value: 'syntax'
            ,
                index: 1
                start: 0
                match: '{'
                value: 'bracket.open'
            ,            
                index: 2
                start: 1
                match: '}'
                value: 'bracket.close'                        
            ]
        
    # 0000000    000   0000000   0000000  00000000   0000000  000000000  
    # 000   000  000  000       000       000       000          000     
    # 000   000  000  0000000   0000000   0000000   000          000     
    # 000   000  000       000       000  000       000          000     
    # 0000000    000  0000000   0000000   00000000   0000000     000     
    
    describe 'dissect', ->
        
        ranges = Immutable [
                start: 0
                match: 'hello'
                value: 'world'
                index: 777
        ,
                start: 2
                match: 'll'
                value: 'world'
                index: 666            
        ]
    
        sameResult = [
                start:  0
                match: 'hello'
                clss:  'world'
            ]
                
        describe 'same', ->    
    
            it 'default', ->
                diss = matchr.dissect ranges.asMutable deep:true
                expect(diss) .to.eql sameResult
                
            it 'no join', ->
                diss = matchr.dissect ranges.asMutable(deep:true), join:false
                expect(diss) .to.eql sameResult
                
            it 'join', ->
                diss = matchr.dissect ranges.asMutable(deep:true), join:true
                expect(diss) .to.eql sameResult
    
        describe 'differ', ->    
            
            differ = ranges.setIn [1, 'value'], 'ells'
            
            it 'join', ->
                diss = matchr.dissect differ.asMutable(deep:true), join:true
                expect(diss) .to.eql [
                    start:   0
                    match:   'he'
                    clss:    'world'
                ,
                    start:   2
                    match:   'll'
                    clss:    'world ells'
                ,
                    start:   4
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
                    clss: '?'
                ]
                
    describe 'brackets', ->
        
        testRanges = [
            index: 0
            start: 0
            match: '{}'
            value: 'syntax'
        ,
            index: 1
            start: 0
            match: '{'
            value: 'bracket.open'
        ,            
            index: 2
            start: 1
            match: '}'
            value: 'bracket.close'
        ]
    
        diss = matchr.dissect testRanges

        expect(diss) .to.eql [
            start: 0
            match:   '{'
            clss: 'syntax bracket open'
        ,
            start: 1
            match:   '}'
            clss: 'syntax bracket close'
        ]
        
            
             
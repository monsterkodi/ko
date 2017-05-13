
# 000      000  000   000  00000000  0000000    000  00000000  00000000    
# 000      000  0000  000  000       000   000  000  000       000         
# 000      000  000 0 000  0000000   000   000  000  000000    000000      
# 000      000  000  0000  000       000   000  000  000       000         
# 0000000  000  000   000  00000000  0000000    000  000       000         

{log}    = require 'kxk'
{expect} = require 'chai'
assert   = require 'assert'
_        = require 'lodash'

lineDiff = require '../tools/linediff'

describe 'linediff', ->
        
    it 'same', ->
    
        expect(lineDiff 'abc def', 'abc def').to.eql []
        expect(lineDiff '', '').to.eql []
        
    it 'insert', ->
        
        expect(lineDiff 'abc def', 'abc xyz def')
        .to.eql [{old: 4, new: 4, length: 4, change: 'insert'}]

        expect(lineDiff 'abc def', 'abdc dcef')
        .to.eql [
            {old: 2, new: 2, length: 1, change: 'insert'},
            {old: 5, new: 6, length: 1, change: 'insert'}]
        
    it 'delete', ->
        
        expect(lineDiff 'abc xyz def', 'abc def')
        .to.eql [{old: 4, new: 4, length: 4, change: 'delete'}]

        expect(lineDiff 'abc xyz def', 'xyz df')
        .to.eql [
            {old: 0, new: 0, length: 4, change: 'delete'},
            {old: 9, new: 5, length: 1, change: 'delete'}]

        expect(lineDiff 'abc xyz def', 'abc z d')
        .to.eql [
            {old: 4, new: 4, length: 2, change: 'delete'},
            {old: 9, new: 7, length: 2, change: 'delete'}]
            
    it 'change', ->
        
        expect(lineDiff 'abc xyz def', 'abc 123 def')
        .to.eql [{old: 4, new: 4, length: 3, change: 'change'}]
        
        expect(lineDiff 'abc zyx def', 'abc xyz def')
        .to.eql [
            {old: 4, new: 4, length: 1, change: 'change'},
            {old: 6, new: 6, length: 1, change: 'change'},]

    it 'empty', ->
        
        expect(lineDiff '', 'abc')
        .to.eql [{old: 0, new: 0, length: 3, change: 'insert'}]
        expect(lineDiff 'abc', '')
        .to.eql [{old: 0, new: 0, length: 3, change: 'delete'}]
        
 describe 'boring', ->
     
    it 'same', ->
         
         expect(lineDiff.isBoring 'abc', 'abc') .to.eql true
         expect(lineDiff.isBoring '', '')       .to.eql true
         expect(lineDiff.isBoring '  ', '  ')   .to.eql true
         
    it 'empty', ->
         
         expect(lineDiff.isBoring '', '  ')   .to.eql true
         expect(lineDiff.isBoring '  ', '')   .to.eql true
         expect(lineDiff.isBoring '  ', '  ') .to.eql true
     
    it 'single', ->
         
         expect(lineDiff.isBoring 'a', ' a ')   .to.eql true
         expect(lineDiff.isBoring '  a', 'a')   .to.eql true
         expect(lineDiff.isBoring 'a  ', '  a') .to.eql true
         
    it 'multi', ->
         
         expect(lineDiff.isBoring 'ab', ' a b ')   .to.eql true
         expect(lineDiff.isBoring '  a  b ', 'ab') .to.eql true
         
    it 'multi3', ->
         expect(lineDiff.isBoring '  a   bbb ', ' a  b  b  b ') .to.eql false
         
     
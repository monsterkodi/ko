
# 000  000   000  0000000    00000000  000   000  00000000  00000000 
# 000  0000  000  000   000  000        000 000   000       000   000
# 000  000 0 000  000   000  0000000     00000    0000000   0000000  
# 000  000  0000  000   000  000        000 000   000       000   000
# 000  000   000  0000000    00000000  000   000  00000000  000   000

{ log, _ } = require 'kxk'

{ expect, should } = require 'chai'

assert  = require 'assert'
Indexer = require '../main/indexer'

should()

describe 'indexer', ->

    it 'classNameInLine', ->
        
        expect(Indexer.classNameInLine('class MyClass')).to.eql 'MyClass'
        expect(Indexer.classNameInLine('class CoffeeSimple')).to.eql 'CoffeeSimple'
        expect(Indexer.classNameInLine('class CoffeeClass extends CoffeeBase')).to.eql 'CoffeeClass'
        expect(Indexer.classNameInLine('class USimple : public UObject')).to.eql 'USimple'
        expect(Indexer.classNameInLine('class SOME_API USomeObject : public UObject')).to.eql 'USomeObject'
        expect(Indexer.classNameInLine('struct SOME_API FSomeStruct : public FSomeBase')).to.eql 'FSomeStruct'
    
    it 'methodNameInLine', -> 
        
        expect(Indexer.methodNameInLine('   coffeeMethod: ->')).to.eql 'coffeeMethod'
        expect(Indexer.methodNameInLine('   coffeeMeth_2: () ->')).to.eql 'coffeeMeth_2'
        expect(Indexer.methodNameInLine('   coffeeMeth_3 : (a,b)  => ')).to.eql 'coffeeMeth_3'
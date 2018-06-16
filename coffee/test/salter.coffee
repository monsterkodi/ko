
#  0000000   0000000   000      000000000  00000000  00000000   
# 000       000   000  000         000     000       000   000  
# 0000000   000000000  000         000     0000000   0000000    
#      000  000   000  000         000     000       000   000  
# 0000000   000   000  0000000     000     00000000  000   000  

{ log, _ } = require 'kxk'
{ expect } = require 'chai'
assert = require 'assert'

Editor = require '../editor/editor'
editor = new Editor 'test_salter'

# !!! DON'T CLEAN THIS FILE !!!

textIs = (t) -> expect(editor.text()).to.eql t

describe 'salter', ->
    
    after -> editor.del()

    describe 'columnsInSalt', ->
        
        it 'i', ->
            slt = ['# 000', '# 000', '# 000', '# 000', '# 000']
            expect editor.columnsInSalt slt
            .to.eql [2,5]
    
        it 'ix', ->
            slt = """
                # 000  000   000
                # 000   000 000 
                # 000    00000  
                # 000   000 000 
                # 000  000   000
                """.split '\n'
            expect editor.columnsInSalt slt
            .to.eql [2,7,16]
            
        it 'empty', ->
            slt = ['#   ', '#   ', '#   ', '#   ', '#   ']
            expect editor.columnsInSalt slt
            .to.eql [1]
        
    it 'salto', ->
        editor.setText ''
        editor.insertSalterCharacter 'o'
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
            """
    it 'saltoix', ->
        editor.singleCursorAtPos [0,4]
        editor.newlineAtEnd()
        editor.startSalter()
        editor.insertCharacter 'I'
        editor.insertCharacter 'X'
        editor.endSalter()
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
             // 000  000   000    
             // 000   000 000     
             // 000    00000      
             // 000   000 000     
             // 000  000   000    
             
            """
            
    it 'del x', ->
        editor.startSalter()
        editor.deleteBackward()
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
             // 000    
             // 000    
             // 000    
             // 000    
             // 000    
             
            """
    it 'del i', ->
        editor.deleteBackward()
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
             //   
             //   
             //   
             //   
             //   
             
            """
            
    it "del #", ->
        editor.deleteBackward()
        editor.endSalter()
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
             //   
             //   
             //   
             //   
             //   
             
            """
    
    it 'cut lines', ->
        editor.joinLines()
        editor.selectMoreLines()
        editor.deleteSelection()
        textIs """
             0000000   
            000   000  
            000   000  
            000   000  
             0000000   
            """
        

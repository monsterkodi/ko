
# 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00  
#    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000  
#    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000  
#    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000  
#    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000  

{ post, reversed, fs, log 
} = require 'kxk'
{ expect
} = require 'chai'

return if not window?.editor

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b
    
describe 'transform', ->

    it 'create', ->
        
        if not editor.transform
            new editor.Transform editor
        
        test editor.transform?
        test editor.transform.do?
        
    it 'new tab', ->
        
        post.emit 'newTabWithFile'
        test editor.currentFile == null
        test editor.text() == ''
                
    it 'paste', ->
        
        editor.setLines ['123', '123', '123abc', '456']
        editor.singleCursorAtPos [0,1]
        editor.singleCursorAtPos [3,2], extend:true
        test editor.selections(), [[1, [0,3]], [2,[0,3]]]
        editor.pasteText 'ins\nert'
        test editor.lines(), ['123', 'ins', 'ertabc', '456']
    
    it 'reverse', ->

        atod = ['a', 'b', 'c', 'd']
        editor.setLines atod
        test editor.text() == atod.join '\n'
        editor.cursorInAllLines()
        editor.transform.do 'reverse'
        test editor.text(), reversed(atod).join '\n'
        editor.transform.do 'reverse'
        test editor.text(), atod.join '\n'
       
    it 'sort', ->

        unsorted = ['a', 'b2', '1a', ' 2b', '  3c', 'b1', 'a0']
        sorted = unsorted.sort (a,b) -> a.localeCompare b
        
        editor.setLines unsorted
        editor.cursorInAllLines()

        editor.transform.do 'sortUp'
        test editor.lines(), sorted

        editor.transform.do 'sortDown'
        test editor.lines(), reversed sorted
        
        editor.transform.do 'sort'
        test editor.lines(), sorted
        
        editor.transform.do 'sort'
        test editor.lines(), reversed sorted
        
    it 'case', ->
        
        words = ['heLLo', 'World!', '!@#&{$%^}', "what's.up?", "xyz-abc"]
        editor.setLines words
        editor.select []
        editor.cursorInAllLines()
        
        editor.transform.do 'titleCase'
        test editor.lines(), ['Hello', 'World!', '!@#&{$%^}', "What's.up?", "Xyz-abc"]
        
        editor.select []
        editor.cursorInAllLines()
        editor.transform.do 'lowerCase'
        test editor.lines(), ['hello', 'world!', '!@#&{$%^}', "what's.up?", "xyz-abc"]
        
        editor.select []
        editor.cursorInAllLines()
        editor.transform.do 'upperCase'
        test editor.lines(), ['HELLO', 'WORLD!', '!@#&{$%^}', "WHAT's.up?", "XYZ-abc"]

        editor.cursorInAllLines()
        editor.selectMoreLines()

        editor.transform.do 'titleCase'
        test editor.lines(), ['Hello', 'World!', '!@#&{$%^}', "What'S.Up?", "Xyz-Abc"]
        
        editor.cursorInAllLines()
        editor.selectMoreLines()
        editor.transform.do 'lowerCase'
        test editor.lines(), ['hello', 'world!', '!@#&{$%^}', "what's.up?", "xyz-abc"]
        
        editor.cursorInAllLines()
        editor.selectMoreLines()
        editor.transform.do 'upperCase'
        test editor.lines(), ['HELLO', 'WORLD!', '!@#&{$%^}', "WHAT'S.UP?", "XYZ-ABC"]
    
    it 'inline', ->
        
        words = ['heLLo World!', "['42','666','23','1']", "what's up?"]
        editor.setLines words
        editor.setCursors [[2,1],[7,1],[13,1],[18,1]]
        editor.moveCursorsToWordBoundary 'right', extend: true
        editor.transform.do 'reverse'
        test editor.lines(), ['heLLo World!', "['1','23','666','42']", "what's up?"]
        editor.transform.do 'reverse'
        test editor.lines(), words
        editor.transform.do 'sortUp'
        test editor.lines(), ['heLLo World!', "['1','23','42','666']", "what's up?"]
        editor.transform.do 'sortDown'
        test editor.lines(), ['heLLo World!', "['666','42','23','1']", "what's up?"]
        
    it 'close tab', ->
        
        numTabs = window.tabs.numTabs()
        post.emit 'closeTabOrWindow'
        test window.tabs.numTabs(), numTabs-1
        
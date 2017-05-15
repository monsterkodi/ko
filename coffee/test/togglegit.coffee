
# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000    
#    000     000   000  000        000        000      000             000        000     000       
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000       
#    000     000   000  000   000  000   000  000      000             000   000  000     000       
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000       

{ childp, path, empty, post, log, _
}        = require 'kxk'
{expect} = require 'chai'
gitRoot  = require '../tools/gitroot'

return if not window?.editor

test = (a, b) ->
    if b == undefined then b = true
    expect(a).to.eql b

editor          = window.editor
simpleFile      = path.join gitRoot(__dirname), 'coffee', 'test', 'dir', 'simple.txt'
simpleText      = '123456'.split('').join '\n'

# 000       0000000    0000000   0000000    
# 000      000   000  000   000  000   000  
# 000      000   000  000000000  000   000  
# 000      000   000  000   000  000   000  
# 0000000   0000000   000   000  0000000    

loadFile = (file, text, done) ->
    
    onDiffbarUpdate = (changes) ->
        
        return if changes.file != file
        editor.removeListener 'diffbarUpdated', onDiffbarUpdate
        
        try
            test changes.error == undefined
            test empty changes.changes
            test editor.text(), text
            
        catch err
            
            return done err
            
        done()
        
    editor.on 'diffbarUpdated', onDiffbarUpdate
    
    post.emit 'newTabWithFile', file

#  0000000   0000000   000   000  00000000
# 000       000   000  000   000  000
# 0000000   000000000   000 000   0000000
#      000  000   000     000     000
# 0000000   000   000      0      00000000

saveFile = (file, done) ->

    onDiffbarUpdate = (changes) ->
        
        return if changes.file != file
        editor.removeListener 'diffbarUpdated', onDiffbarUpdate
        
        try
            test changes.error == undefined
            test not empty changes.changes
            
        catch err
            
            return done err
            
        done()

    editor.on 'diffbarUpdated', onDiffbarUpdate
    
    post.emit 'saveFile'

# 00000000   00000000  000   000  00000000  00000000   000000000
# 000   000  000       000   000  000       000   000     000
# 0000000    0000000    000 000   0000000   0000000       000
# 000   000  000          000     000       000   000     000
# 000   000  00000000      0      00000000  000   000     000

revertFile = (file, text, done) ->

    onDiffbarUpdate = (changes) ->
        
        return if changes.file != file
        editor.removeListener 'diffbarUpdated', onDiffbarUpdate
        
        try
            
            test changes.error == undefined
            test empty changes?.changes
            test editor.text(), text
            
        catch err
            
            return done err

        post.once 'tabClosed', (tf) ->
            
            if tf == file
                done()
            else
                done new Error "wrong tab closed? #{tf} != #{file}"
                
        post.emit 'closeTabOrWindow'

    editor.on 'diffbarUpdated', onDiffbarUpdate
        
    try
        childp.execSync "git checkout -- #{file}"
    catch err
        done err

describe 'togglegit', ->
    
    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000     
    
    describe 'insert', ->
    
        it 'load', (done) -> loadFile simpleFile, simpleText, done
    
        it 'modify', ->
    
            editor.singleCursorAtPos [1,1]
            editor.newline()
            editor.insertCharacter 'x'
            test editor.text(), '12x3456'.split('').join '\n'
    
        it 'save', (done) -> saveFile simpleFile, done
    
        it 'undo all', -> 
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test editor.text(), simpleText
    
        it 'redo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test editor.text(), '12x3456'.split('').join '\n'
    
        it 'undo again', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test editor.text(), simpleText
    
        it 'revert', (done) -> revertFile simpleFile, simpleText, done
    
    # 0000000     0000000   000   000  0000000    000      00000000  
    # 000   000  000   000  000   000  000   000  000      000       
    # 000   000  000   000  000   000  0000000    000      0000000   
    # 000   000  000   000  000   000  000   000  000      000       
    # 0000000     0000000    0000000   0000000    0000000  00000000  
    
    describe 'insert double', ->
    
        it 'load', (done) -> loadFile simpleFile, simpleText, done
    
        it 'modify', ->
    
            editor.singleCursorAtPos [1,1]
            editor.newline()
            editor.insertCharacter 'x'
            editor.newline()
            editor.insertCharacter 'y'
            
            test editor.text(), '12xy3456'.split('').join '\n'
    
        it 'save', (done) -> saveFile simpleFile, done
    
        it 'undo all', -> 
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test editor.meta.metasAtLineIndex(2).length, 2
            test editor.text(), simpleText
    
        it 'redo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test not empty editor.meta.metasAtLineIndex 3
            test editor.text(), '12xy3456'.split('').join '\n'
    
        it 'undo again', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test not empty editor.meta.metasAtLineIndex 2
            test editor.text(), simpleText
    
        it 'revert', (done) -> revertFile simpleFile, simpleText, done
        
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000
    # 000   000  0000000   000      0000000      000     0000000
    # 000   000  000       000      000          000     000
    # 0000000    00000000  0000000  00000000     000     00000000
    
    describe 'delete', ->
    
        it 'load', (done) -> loadFile simpleFile, simpleText, done
    
        it 'modify', ->
    
            editor.setCursors [[0,2], [0,3], [0,4]]
            editor.selectMoreLines()
            editor.deleteSelection()
            
            test editor.text(), '126'.split('').join '\n'
    
        it 'save', (done) -> saveFile simpleFile, done
    
        it 'undo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), simpleText
    
        it 'redo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), '126'.split('').join '\n'
    
        it 'undo again', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), simpleText
    
        it 'revert', (done) -> revertFile simpleFile, simpleText, done
    
    # 00     00  000  000   000  00000000  0000000    
    # 000   000  000   000 000   000       000   000  
    # 000000000  000    00000    0000000   000   000  
    # 000 0 000  000   000 000   000       000   000  
    # 000   000  000  000   000  00000000  0000000    
    
    describe 'mixed', ->
    
        it 'load', (done) -> loadFile simpleFile, simpleText, done
    
        it 'modify', ->
    
            editor.singleCursorAtPos [0,1]
            editor.insertCharacter 'a'
            editor.moveCursors 'down'
            editor.insertCharacter 'b'
            editor.newline()
            editor.insertCharacter '5'
            editor.newline()
            editor.insertCharacter 'd'
            editor.newline()
            editor.moveCursors 'down'
            editor.selectMoreLines()
            editor.selectMoreLines()
            editor.deleteSelection()
            
            test editor.text(), '1\na2\n3b\n5\nd\n\n6'
    
        it 'save', (done) -> saveFile simpleFile, done
    
        it 'undo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), simpleText
    
        it 'redo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), '1\na2\n3b\n5\nd\n\n6'
    
        it 'undo again', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), simpleText
            
        it 'revert', (done) -> revertFile simpleFile, simpleText, done
    
    #  0000000   0000000   00     00  00000000   000      00000000  000   000
    # 000       000   000  000   000  000   000  000      000        000 000
    # 000       000   000  000000000  00000000   000      0000000     00000
    # 000       000   000  000 0 000  000        000      000        000 000
    #  0000000   0000000   000   000  000        0000000  00000000  000   000
    
    describe 'complex', ->
    
        complexFile     = path.join gitRoot(__dirname), 'coffee', 'test', 'dir', 'git.txt'
        complexText     = 'abcdefghijklmnopqrstuvwxyz'.split('').join '\n'
        complexModified = 'a\nbad\ncool\nd\nhello\nh\ni\nj\nl\nm\np\n\n\n1\n23q\nr\n4s\nt5\nv\n6\n\n7\n\nw\nx\ny\nz'
            
        it 'load', (done) -> loadFile complexFile, complexText, done
    
        it 'modify', ->
    
            editor.singleCursorAtPos [1,1]
            editor.insertCharacter 'a'
            editor.insertCharacter 'd'
            editor.singleCursorAtPos [1,2]
            editor.insertCharacter 'o'
            editor.insertCharacter 'o'
            editor.insertCharacter 'l'
            editor.singleCursorAtPos [0,4]
            editor.insertCharacter 'h'
            editor.moveCursors 'right'
            editor.insertCharacter 'l'
            editor.insertCharacter 'l'
            editor.insertCharacter 'o'
            editor.setCursors [[0,5], [0,6], [0,10], [0,13], [0,14]]
            editor.selectMoreLines()
            editor.deleteSelection()
            editor.singleCursorAtPos [0,11]
            editor.newline()
            editor.newline()
            editor.insertCharacter '1'
            editor.newline()
            editor.insertCharacter '2'
            editor.insertCharacter '3'
            editor.singleCursorAtPos [0,16]
            editor.insertCharacter '4'
            editor.moveCursors 'down'
            editor.insertCharacter '5'
            editor.newline()
            editor.insertCharacter 'v'
            editor.newline()
            editor.insertCharacter '6'
            editor.newline()
            editor.newline()
            editor.insertCharacter '7'
            editor.newline()
            editor.moveCursors 'down'
            editor.selectMoreLines()
            editor.selectMoreLines()
            editor.deleteSelection()
    
            test editor.text(), complexModified
    
        it 'save', (done) -> saveFile complexFile, done
    
        it 'undo all', ->
             
            editor.cursorInAllLines()
            editor.toggleGitChange()
            
            test editor.text(), complexText
            
        it 'redo all', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), complexModified
    
        it 'undo again', ->
    
            editor.cursorInAllLines()
            editor.toggleGitChange()
    
            test editor.text(), complexText
    
        it 'revert', (done) -> revertFile complexFile, complexText, done


# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000    
#    000     000   000  000        000        000      000             000        000     000       
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000       
#    000     000   000  000   000  000   000  000      000             000   000  000     000       
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000       

{ childp, path, empty, post, log
}       = require 'kxk'
gitRoot = require '../tools/gitroot'
{ expect,should
}       = require 'chai'
assert  = require 'assert'
_       = require 'lodash'
should()

return if not window?.editor

editor   = window.editor
testFile = path.join gitRoot(__dirname), 'coffee', 'test', 'dir', 'git.txt'

describe 'togglegit', ->
        
    it 'load', ->
        
        post.emit 'newTabWithFile', testFile
        assert editor.dirty == false
        assert editor.currentFile == testFile
        assert editor.text() == 'abcdefghijklmnopqrstuvwxyz'.split('').join '\n'
        assert editor.diffbar.changes == null
        
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
        assert empty editor.diffbar.changes
        
    it 'save', (done) ->
        post.once 'saved', (file) ->
            try
                assert file == testFile
            catch err
                return done err
            editor.once 'diffbarUpdated', ->
                try
                    assert not empty editor.diffbar.changes
                catch err
                    return done err
                done()
        post.emit 'saveFile'

    it 'revert', (done) ->
        childp.execSync "git checkout -- #{testFile}"
        
        post.once 'file', (file) ->
            
            try
                assert file == testFile
                assert editor.dirty == false
                assert editor.currentFile == testFile
                assert editor.text() == 'abcdefghijklmnopqrstuvwxyz'.split('').join '\n'
            catch err
                return done err
                
            editor.once 'diffbarUpdated', ->
                try
                    assert empty editor.diffbar.changes
                catch err
                    return done err
                done()
            
         

# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000    
#    000     000   000  000        000        000      000             000        000     000       
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000       
#    000     000   000  000   000  000   000  000      000             000   000  000     000       
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000       

{ childp, path, empty, post, log, _
}        = require 'kxk'
{expect} = require 'chai'
gitRoot  = require '../tools/gitroot'
assert   = require 'assert'

return if not window?.editor

test = (a, b) -> 
    if b == undefined then b = true
    expect(a).to.eql b

editor   = window.editor
testFile = path.join gitRoot(__dirname), 'coffee', 'test', 'dir', 'git.txt'

describe 'togglegit', ->
        
    it 'load', ->
        
        post.emit 'newTabWithFile', testFile
        test editor.dirty, false
        test editor.currentFile, testFile
        test editor.text(), 'abcdefghijklmnopqrstuvwxyz'.split('').join '\n'
        test editor.diffbar.changes, null
        
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
        editor.insertCharacter '6'
        editor.insertCharacter '7'
        editor.newline()
        editor.newline()
        editor.insertCharacter '8'
        editor.newline()
        editor.moveCursors 'down'
        editor.selectMoreLines()
        editor.selectMoreLines()
        editor.deleteSelection()
        
        test empty editor.diffbar.changes
        
    it 'save', (done) ->
        post.once 'saved', (file) ->
            try
                test file, testFile
            catch err
                return done err
            editor.once 'diffbarUpdated', ->
                try
                    test not empty editor.diffbar.changes.changes
                    log editor.diffbar.changes.changes
                catch err
                    return done err
                done()
        post.emit 'saveFile'

    it 'revert', (done) ->
        return
        childp.execSync "git checkout -- #{testFile}"
        
        post.once 'file', (file) ->
            
            try
                test file, testFile
                test editor.dirty, false
                test editor.currentFile, testFile
                test editor.text(), 'abcdefghijklmnopqrstuvwxyz'.split('').join '\n'
            catch err
                return done err
                
            editor.once 'diffbarUpdated', ->
                try
                    test empty editor.diffbar.changes
                catch err
                    return done err
                done()
            
        
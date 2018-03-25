
# 000   000  000  000   000  
# 000 0 000  000  0000  000  
# 000000000  000  000 0 000  
# 000   000  000  000  0000  
# 00     00  000  000   000  

{ log, post, slash, fs } = require 'kxk'
{ expect,should } = require 'chai'

should()

try
    electron      = require 'electron'
    remote        = electron.remote
    BrowserWindow = remote.BrowserWindow
catch
    return
    
winID    = 0
thisID   = window.winID
editor   = window.editor
thisFile = null
otherWin = null
tmpFile  = slash.resolve '$TMPDIR/ko/test.coffee'
text     = "a='hello'\nb='world'"
        
describe 'win', ->
    
    before -> 
        fs.outputFileSync tmpFile, text
        thisFile = editor.currentFile
    
    it 'new window', (done) ->
        post.once 'winLoaded', (wid) -> winID = wid; done()
        post.toMain 'newWindowWithFile'
         
    it 'close window', (done) ->
        post.once 'winClosed', (wid) -> done()
        BrowserWindow.fromId(winID).close()

    it 'new window with file', (done) ->
        post.once 'fileLoaded', (file, wid) ->
            try
                expect(file) .to.eql tmpFile
            catch err
                done err
                            
            otherWin = BrowserWindow.fromId wid 
            post.once 'editorState', (wid, state) -> 
                try
                    expect(wid) .to.eql otherWin.id
                    expect(state.lines) .to.eql ["a='hello'", "b='world'"]
                    done()
                catch err
                    done err
            post.toWin otherWin.id, 'postEditorState'
        post.toMain 'newWindowWithFile', tmpFile
        
    it 'load file', ->
        window.loadFile tmpFile
        expect(editor.dirty) .to.be.false
        expect(editor.currentFile) .to.eql tmpFile
        expect(editor.text()) .to.eql text
            
    it 'insert', ->
        editor.singleCursorAtPos [0,0]
        editor.newlineAtEnd()
        expect(editor.dirty) .to.be.true
        expect(editor.lines()) .to.eql ["a='hello'", '', "b='world'"]

    it 'change', ->
        editor.insertCharacter 'c'
        editor.insertCharacter '='
        editor.insertCharacter '1'
        expect(editor.lines()) .to.eql ["a='hello'", 'c=1', "b='world'"]

    it 'foreign after change', (done) ->
        post.once 'editorState', (wid, state) -> 
            try
                expect(wid) .to.eql otherWin.id
                expect(state.lines) .to.eql ["a='hello'", 'c=1', "b='world'"]
                done()
            catch err
                done err
        post.toWin otherWin.id, 'postEditorState'

    it 'undo', ->
        editor.do.undo()
        editor.do.undo()
        expect(editor.lines()) .to.eql ["a='hello'", '', "b='world'"]
        editor.do.undo()
        expect(editor.lines()) .to.eql ["a='hello'", "b='world'"]

    it 'foreign after undo', (done) ->
        post.once 'editorState', (wid, state) -> 
            try
                expect(wid) .to.eql otherWin.id
                expect(state.lines) .to.eql ["a='hello'", "b='world'"]
                done()
            catch err
                done err
        post.toWin otherWin.id, 'postEditorState'
        
    it 'close other window', (done) ->
        otherWinID = otherWin.id
        post.once 'winClosed', (wid) -> 
            expect(wid) .to.eql otherWinID
            done()
        otherWin.close()
    
    it 'restore file', ->
        window.loadFile thisFile
        expect(editor.currentFile) .to.eql thisFile    

          
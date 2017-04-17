# 000   000  000  000   000  
# 000 0 000  000  0000  000  
# 000000000  000  000 0 000  
# 000   000  000  000  0000  
# 00     00  000  000   000  

{log, post, resolve, fs} = require 'kxk'
{expect,should} = require 'chai'
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
thisFile = editor.currentFile
otherWin = null
tmpFile  = resolve '$TMPDIR/ko/test.coffee'
text     = "a='hello'\nb='world'"
fs.outputFileSync tmpFile, text
        
describe 'win', ->
    
    it 'new window', (done) ->
        post.once 'winLoaded', (wid) -> winID = wid; done()
        post.toMain 'newWindowWithFile'
         
    it 'close window', (done) ->
        post.once 'winClosed', (wid) -> done()
        BrowserWindow.fromId(winID).close()

    it 'new window with file', (done) ->
        post.once 'fileLoaded', (file, wid) -> 
            expect(file) .to.eql tmpFile
            otherWin = BrowserWindow.fromId wid 
            onEditorState = (wid, state) -> 
                if wid == otherWin.id
                    post.removeListener 'editorState', onEditorState
                    try
                        expect(state.lines) .to.eql ["a='hello'", "b='world'"]
                        done()
                    catch err
                        done err
            post.on 'editorState', onEditorState
            post.toWins 'postEditorState'
        post.toMain 'newWindowWithFile', tmpFile
        
    it 'loadFile', ->
        window.loadFile tmpFile
        expect(editor.dirty) .to.be.false
        expect(editor.currentFile) .to.eql tmpFile
        expect(editor.text()) .to.eql text
            
    it 'edit', ->
        editor.singleCursorAtPos [0,0]
        editor.newlineAtEnd()
        expect(editor.dirty) .to.be.true
        log editor.lines()
        expect(editor.lines()) .to.eql ["a='hello'", '', "b='world'"]

    it 'foreign', (done) ->
        onEditorState = (wid, state) -> 
            if wid == otherWin.id
                post.removeListener 'editorState', onEditorState
                try
                    expect(state.lines) .to.eql ["a='hello'", '', "b='world'"]
                    done()
                catch err
                    done err
        post.on 'editorState', onEditorState
        post.toWins 'postEditorState'

    it 'close other window', (done) ->
        otherWinID = otherWin.id
        post.once 'winClosed', (wid) -> 
            expect(wid) .to.eql otherWinID
            done()
        otherWin.close()
    
    it 'restore file', ->
        window.loadFile thisFile
        expect(editor.currentFile) .to.eql thisFile    
            
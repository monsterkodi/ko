#  0000000  00000000   0000000   00000000    0000000  000   000  00000000  0000000    000  000000000  
# 000       000       000   000  000   000  000       000   000  000       000   000  000     000     
# 0000000   0000000   000000000  0000000    000       000000000  0000000   000   000  000     000     
#      000  000       000   000  000   000  000       000   000  000       000   000  000     000     
# 0000000   00000000  000   000  000   000   0000000  000   000  00000000  0000000    000     000     

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
terminal = window.terminal
commandline = window.commandline
thisFile = null
otherWin = null
resultLines = null
tmpFile  = resolve '$TMPDIR/ko/test.coffee'
txtFile  = resolve '$TMPDIR/ko/test.txt'
pkgFile  = resolve '$TMPDIR/ko/package.json'
texta    = "a='hello'\nb='world'"
textb    = "hell on earth"

describe 'search edit', ->
    
    before -> 
        fs.outputFileSync tmpFile, texta
        fs.outputFileSync txtFile, textb
        fs.outputFileSync pkgFile, ''
        thisFile = editor.currentFile
        resultLines = []
            
    it 'load file', ->
        window.loadFile tmpFile
        expect(editor.dirty) .to.be.false
        expect(editor.currentFile) .to.eql tmpFile
        expect(editor.text()) .to.eql texta
            
    it 'start search', ->
        commandline.startCommand 'search', 'command+shift+f'
        expect(commandline.command.name) .to.eql 'search'
        
    it 'search', (done) ->
        count = 2
        onSearchResult = (meta) ->
            count--
            # log count, terminal.numLines(), meta
            resultLines.push terminal.numLines()
            if count == 0
                post.removeListener 'search-result', onSearchResult
                done()
        post.on 'search-result', onSearchResult 
        commandline.setText 'ell'
        commandline.execute()

    it 'edit', ->
        terminal.singleCursorAtPos [3, resultLines[0]-1]
        terminal.insertCharacter 's'
        terminal.singleCursorAtPos [4, resultLines[1]-1]
        terminal.deleteForward()
        
    it 'save', (done) ->
        count = 2
        onSearchSaved = (file) ->
            count--
            log count, file
            if count == 0
                post.removeListener 'search-saved', onSearchSaved
                done()
        post.on 'search-saved', onSearchSaved 
        terminal.meta.saveChanges()
     
    it 'saved', ->
        fileA = fs.readFileSync txtFile, 'utf8'
        fileB = fs.readFileSync tmpFile, 'utf8'
        log fileA
        log fileB
        expect(fileA) .to.eql "hellon earth"      
        expect(fileB) .to.eql "a='shello'\nb='world'"  
    
    it 'editor updated', ->
        expect(editor.text()) .to.eql "a='shello'\nb='world'"

    it 'restore file', ->
        window.loadFile thisFile
        expect(editor.currentFile) .to.eql thisFile    

          
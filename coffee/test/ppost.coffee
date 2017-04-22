# 00000000   00000000    0000000    0000000  000000000  
# 000   000  000   000  000   000  000          000     
# 00000000   00000000   000   000  0000000      000     
# 000        000        000   000       000     000     
# 000        000         0000000   0000000      000     

{ log, post, resolve, fs, _
} = require 'kxk'
{expect,should} = require 'chai'
should()

try
    electron      = require 'electron'
    remote        = electron.remote
    BrowserWindow = remote.BrowserWindow
catch
    return
    
otherID  = -1
thisID   = window.winID
otherWin = null
payloadA = { a: 1, b: 'hello'}
payloadB = [ 2, b: 'world']

describe 'ppost', ->
    
    it 'new window', (done) ->
        post.once 'winLoaded', (wid) -> otherID = wid; done()
        post.toMain 'newWindowWithFile'
         
    it 'toMain', (done) ->
        post.once 'pong', (id, a, b) ->
            try
                expect(id) .to.eql 'main'
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                done()
            catch err
                done err
                            
        post.toMain 'ping', thisID, payloadA, payloadB
        
    it 'toWin', (done) ->
        post.once 'pong', (id, a, b) ->
            try
                expect(id) .to.eql otherID
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                done()
            catch err
                done err
                            
        post.toWin otherID, 'ping', thisID, payloadA, payloadB
        
    it 'toAll', (done) ->
        pongIDs = [otherID, thisID, 'main']
        onPong = (id, a, b) ->
            try
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                _.pull pongIDs, id
                if _.isEmpty pongIDs
                    post.removeListener 'pong', onPong
                    done()
            catch err
                done err
        post.on 'pong', onPong                    
        post.toAll 'ping', thisID, payloadA, payloadB

    it 'toOthers', (done) ->
        pongIDs = [otherID, 'main']
        onPong = (id, a, b) ->
            try
                expect(id) .to.not.eql thisID
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                _.pull pongIDs, id
                if _.isEmpty pongIDs
                    post.removeListener 'pong', onPong
                    done()
            catch err
                done err
        post.on 'pong', onPong                    
        post.toOthers 'ping', thisID, payloadA, payloadB

    it 'toOtherWins', (done) ->
        pongIDs = [otherID]
        onPong = (id, a, b) ->
            try
                expect(id) .to.not.eql thisID
                expect(id) .to.not.eql 'main'
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                _.pull pongIDs, id
                if _.isEmpty pongIDs
                    post.removeListener 'pong', onPong
                    done()
            catch err
                done err
        post.on 'pong', onPong                    
        post.toOtherWins 'ping', thisID, payloadA, payloadB

    it 'toWins', (done) ->
        pongIDs = [otherID, thisID]
        onPong = (id, a, b) ->
            try
                expect(id) .to.not.eql 'main'
                expect(a) .to.eql payloadA
                expect(b) .to.eql payloadB
                _.pull pongIDs, id
                if _.isEmpty pongIDs
                    post.removeListener 'pong', onPong
                    done()
            catch err
                done err
        post.on 'pong', onPong                    
        post.toWins 'ping', thisID, payloadA, payloadB
            
    it 'close window', (done) ->
        post.once 'winClosed', (wid) -> done()
        BrowserWindow.fromId(otherID).close()
  

          
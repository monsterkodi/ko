{ slash, log, _ } = require 'kxk'
{ expect, should } = require 'chai'

root   = require './root'
diff   = require './diff'
info   = require './info'
status = require './status'

rootDir = slash.dir slash.dir __dirname
process.chdir __dirname

should()

describe 'git', ->

    describe 'info', ->
        
        it 'info file', ->  expect(info rootDir).to.include gitDir:rootDir
        it 'info dir',  ->  expect(info __dirname).to.include gitDir:__dirname
        it 'info /',    ->  expect(info '/').to.be.empty

        it 'info cb file', (done) ->  info rootDir,   (r) -> expect(r).to.include gitDir:rootDir   ; done()
        it 'info cb dir',  (done) ->  info __dirname, (r) -> expect(r).to.include gitDir:__dirname ; done()
        it 'info cb /',    (done) ->  info '/',       (r) -> expect(r).to.be.empty                 ; done()
    
    describe 'status', ->
        
        it 'status dir',  ->  expect(status rootDir).to.include gitDir:rootDir
        it 'status dir',  ->  expect(status __dirname).to.include gitDir:__dirname
        it 'status file', ->  expect(status __filename).to.be.empty
        it 'status /',    ->  expect(status '/').to.be.empty

        it 'status cb file', (done) ->  status rootDir,    (r) -> expect(r).to.include gitDir:rootDir   ; done()
        it 'status cb dir',  (done) ->  status __dirname,  (r) -> expect(r).to.include gitDir:__dirname ; done()
        it 'status cb /',    (done) ->  status __filename, (r) -> expect(r).to.be.empty                 ; done()
        it 'status cb /',    (done) ->  status '/',        (r) -> expect(r).to.be.empty                 ; done()
        
    describe 'root', ->
        
        it 'root .',          -> expect(root '.')                        .to.eql rootDir 
        it 'root ..',         -> expect(root '..')                       .to.eql rootDir 
        it 'root __filename', -> expect(root __filename)                 .to.eql rootDir 
        it 'root root',       -> expect(root rootDir)                    .to.eql rootDir 
        it 'root invalid',    -> expect(root __filename + 'blark')       .to.eql rootDir 
        it 'root /',          -> expect(root '/')                        .to.eql '' 
        it 'root fantasy',    -> expect(root '/blark/fasel')             .to.eql ''
        it 'root root/.git',  -> expect(root slash.join rootDir, '.git') .to.eql '' 
        
    describe 'root cb', -> 
        
        it 'root cb .',          (done) -> root '.',                             (r) -> expect(r).to.eql rootDir ; done()
        it 'root cb ..',         (done) -> root '..',                            (r) -> expect(r).to.eql rootDir ; done()
        it 'root cb __filename', (done) -> root __filename,                      (r) -> expect(r).to.eql rootDir ; done()
        it 'root cb root',       (done) -> root rootDir,                         (r) -> expect(r).to.eql rootDir ; done()
        it 'root cb invalid',    (done) -> root slash.join(__dirname, 'blark'),  (r) -> expect(r).to.eql rootDir ; done()
        it 'root cb /',          (done) -> root '/',                             (r) -> expect(r).to.eql ''      ; done()
        it 'root cb fantasy',    (done) -> root '/blark/fasel',                  (r) -> expect(r).to.eql ''      ; done()
        it 'root cb root/.git',  (done) -> root slash.join(rootDir, '.git'),     (r) -> expect(r).to.eql ''      ; done()
        
    describe 'diff', ->

        it 'diff sync',        -> expect(diff __filename).to.include file:slash.resolve __filename
        it 'diff dir',         -> expect(diff __dirname).to.eql {}
        it 'diff async',     (done) -> diff __filename, (r) -> expect(r).to.include(file:slash.resolve(__filename)) ; done()
        it 'diff async dir', (done) -> diff __dirname,  (r) -> expect(r).to.be.empty ; done()
        
        
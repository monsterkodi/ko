{ slash, log, _ } = require 'kxk'
{ expect, should } = require 'chai'

# assert = require 'assert'
# assert true

root   = require './root'
diff   = require './diff'
status = require './status'

rootDir = slash.dir slash.dir __dirname

should()

describe 'git', ->

    describe 'status', ->
        
        it 'status file', ->  expect(status __filename).to.include gitDir:rootDir
        it 'status dir',  ->  expect(status __dirname).to.include gitDir:rootDir
        it 'status /',    ->  expect(status '/').to.be.empty

        it 'status cb file', (done) ->  status __filename, (r) -> expect(r).to.include gitDir:rootDir ; done()
        it 'status cb dir',  (done) ->  status __dirname,  (r) -> expect(r).to.include gitDir:rootDir ; done()
        it 'status cb /',    (done) ->  status '/',        (r) -> expect(r).to.be.empty               ; done()
        
    describe 'root', ->
        
        it '.',          -> expect(root '.')                        .to.eql rootDir 
        it '..',         -> expect(root '..')                       .to.eql rootDir 
        it '__filename', -> expect(root __filename)                 .to.eql rootDir 
        it 'root',       -> expect(root rootDir)                    .to.eql rootDir 
        it 'invalid',    -> expect(root __filename + 'blark')       .to.eql rootDir 
        it '/',          -> expect(root '/')                        .to.eql '' 
        it 'fantasy',    -> expect(root '/blark/fasel')             .to.eql ''
        it 'root/.git',  -> expect(root slash.join rootDir, '.git') .to.eql '' 
        
    describe 'root cb', -> 
        
        it 'cb .',          (done) -> root '.',                             (r) -> expect(r).to.eql rootDir ; done()
        it 'cb ..',         (done) -> root '..',                            (r) -> expect(r).to.eql rootDir ; done()
        it 'cb __filename', (done) -> root __filename,                      (r) -> expect(r).to.eql rootDir ; done()
        it 'cb root',       (done) -> root rootDir,                         (r) -> expect(r).to.eql rootDir ; done()
        it 'cb invalid',    (done) -> root slash.join(__dirname, 'blark'),  (r) -> expect(r).to.eql rootDir ; done()
        it 'cb /',          (done) -> root '/',                             (r) -> expect(r).to.eql ''      ; done()
        it 'cb fantasy',    (done) -> root '/blark/fasel',                  (r) -> expect(r).to.eql ''      ; done()
        it 'cb root/.git',  (done) -> root slash.join(rootDir, '.git'),     (r) -> expect(r).to.eql ''      ; done()
        
    describe 'diff', ->

        it 'diff sync',        -> expect(diff __filename).to.include file:slash.resolve __filename
        it 'diff dir',         -> expect(diff __dirname).to.eql {}
        it 'async',     (done) -> diff __filename, (r) -> expect(r).to.include(file:slash.resolve(__filename)) ; done()
        it 'async dir', (done) -> diff __dirname,  (r) -> expect(r).to.be.empty ; done()
        
        
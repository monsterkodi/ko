{ slash, log, _ } = require 'kxk'
{ expect, should } = require 'chai'

# assert = require 'assert'
# assert true

root = require './root'
diff = require './diff'

rootDir = slash.dir slash.dir __dirname

should()

describe 'git', ->

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
        
        it '.',          (done) -> root '.',                             (r) -> expect(r).to.eql rootDir ; done()
        it '..',         (done) -> root '..',                            (r) -> expect(r).to.eql rootDir ; done()
        it '__filename', (done) -> root __filename,                      (r) -> expect(r).to.eql rootDir ; done()
        it 'root',       (done) -> root rootDir,                         (r) -> expect(r).to.eql rootDir ; done()
        it 'invalid',    (done) -> root slash.join(__dirname, 'blark'),  (r) -> expect(r).to.eql rootDir ; done()
        it '/',          (done) -> root '/',                             (r) -> expect(r).to.eql ''      ; done()
        it 'fantasy',    (done) -> root '/blark/fasel',                  (r) -> expect(r).to.eql ''      ; done()
        it 'root/.git',  (done) -> root slash.join(rootDir, '.git'),     (r) -> expect(r).to.eql ''      ; done()
        
    describe 'diff', ->
        
        it 'sync',             -> expect(diff __filename).to.include file:slash.resolve __filename
        it 'dir',              -> expect(diff __dirname).to.eql {}
        it 'async',     (done) -> diff __filename, (r) -> expect(r).to.include file:slash.resolve __filename ; done()
        it 'async dir', (done) -> diff __dirname,  (r) -> expect(r).to.eql {}                                ; done()
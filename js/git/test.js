// monsterkodi/kode 0.270.0

var _k_

var diff, expect, info, root, rootDir, should, slash, status

slash = require('kxk').slash

expect = require('chai').expect
should = require('chai').should

root = require('./root')
diff = require('./diff')
info = require('./info')
status = require('./status')
rootDir = slash.dir(slash.dir(__dirname))
process.chdir(__dirname)
should()
describe('git',function ()
{
    describe('info',function ()
    {
        it('info file',function ()
        {
            return expect(info(rootDir)).to.include({gitDir:rootDir})
        })
        it('info dir',function ()
        {
            return expect(info(__dirname)).to.include({gitDir:__dirname})
        })
        it('info /',function ()
        {
            return expect(info('/')).to.be.empty
        })
        it('info cb file',function (done)
        {
            return info(rootDir,function (r)
            {
                expect(r).to.include({gitDir:rootDir})
                return done()
            })
        })
        it('info cb dir',function (done)
        {
            return info(__dirname,function (r)
            {
                expect(r).to.include({gitDir:__dirname})
                return done()
            })
        })
        return it('info cb /',function (done)
        {
            return info('/',function (r)
            {
                expect(r).to.be.empty
                return done()
            })
        })
    })
    describe('status',function ()
    {
        it('status dir',function ()
        {
            return expect(status(rootDir)).to.include({gitDir:rootDir})
        })
        it('status dir',function ()
        {
            return expect(status(__dirname)).to.include({gitDir:__dirname})
        })
        it('status file',function ()
        {
            return expect(status(__filename)).to.be.empty
        })
        it('status /',function ()
        {
            return expect(status('/')).to.be.empty
        })
        it('status cb file',function (done)
        {
            return status(rootDir,function (r)
            {
                expect(r).to.include({gitDir:rootDir})
                return done()
            })
        })
        it('status cb dir',function (done)
        {
            return status(__dirname,function (r)
            {
                expect(r).to.include({gitDir:__dirname})
                return done()
            })
        })
        it('status cb /',function (done)
        {
            return status(__filename,function (r)
            {
                expect(r).to.be.empty
                return done()
            })
        })
        return it('status cb /',function (done)
        {
            return status('/',function (r)
            {
                expect(r).to.be.empty
                return done()
            })
        })
    })
    describe('root',function ()
    {
        it('root .',function ()
        {
            return expect(root('.')).to.eql(rootDir)
        })
        it('root ..',function ()
        {
            return expect(root('..')).to.eql(rootDir)
        })
        it('root __filename',function ()
        {
            return expect(root(__filename)).to.eql(rootDir)
        })
        it('root root',function ()
        {
            return expect(root(rootDir)).to.eql(rootDir)
        })
        it('root invalid',function ()
        {
            return expect(root(__filename + 'blark')).to.eql(rootDir)
        })
        it('root /',function ()
        {
            return expect(root('/')).to.eql('')
        })
        it('root fantasy',function ()
        {
            return expect(root('/blark/fasel')).to.eql('')
        })
        return it('root root/.git',function ()
        {
            return expect(root(slash.join(rootDir,'.git'))).to.eql('')
        })
    })
    describe('root cb',function ()
    {
        it('root cb .',function (done)
        {
            return root('.',function (r)
            {
                expect(r).to.eql(rootDir)
                return done()
            })
        })
        it('root cb ..',function (done)
        {
            return root('..',function (r)
            {
                expect(r).to.eql(rootDir)
                return done()
            })
        })
        it('root cb __filename',function (done)
        {
            return root(__filename,function (r)
            {
                expect(r).to.eql(rootDir)
                return done()
            })
        })
        it('root cb root',function (done)
        {
            return root(rootDir,function (r)
            {
                expect(r).to.eql(rootDir)
                return done()
            })
        })
        it('root cb invalid',function (done)
        {
            return root(slash.join(__dirname,'blark'),function (r)
            {
                expect(r).to.eql(rootDir)
                return done()
            })
        })
        it('root cb /',function (done)
        {
            return root('/',function (r)
            {
                expect(r).to.eql('')
                return done()
            })
        })
        it('root cb fantasy',function (done)
        {
            return root('/blark/fasel',function (r)
            {
                expect(r).to.eql('')
                return done()
            })
        })
        return it('root cb root/.git',function (done)
        {
            return root(slash.join(rootDir,'.git'),function (r)
            {
                expect(r).to.eql('')
                return done()
            })
        })
    })
    return describe('diff',function ()
    {
        it('diff sync',function ()
        {
            return expect(diff(__filename)).to.include({file:slash.resolve(__filename)})
        })
        it('diff dir',function ()
        {
            return expect(diff(__dirname)).to.eql({})
        })
        it('diff async',function (done)
        {
            return diff(__filename,function (r)
            {
                expect(r).to.include({file:slash.resolve(__filename)})
                return done()
            })
        })
        return it('diff async dir',function (done)
        {
            return diff(__dirname,function (r)
            {
                expect(r).to.be.empty
                return done()
            })
        })
    })
})
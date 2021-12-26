// monsterkodi/kode 0.234.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var kxk, post, slash, watch

kxk = require('kxk')
post = kxk.post
slash = kxk.slash
watch = kxk.watch

class GitWatch
{
    constructor (gitDir, cb)
    {
        var refPath, _16_29_

        this.gitDir = gitDir
    
        if (!(this.gitDir != null))
        {
            return
        }
        this.gitFile = slash.join(this.gitDir,'.git','HEAD')
        if (slash.fileExists(this.gitFile))
        {
            refPath = slash.readText(this.gitFile)
            if (refPath.startsWith('ref: '))
            {
                this.gitFile = slash.join(this.gitDir,'.git',refPath.slice(5).trim())
                this.ref = slash.readText(this.gitFile)
            }
            else
            {
                this.ref = refPath
            }
            this.watcher = watch.file(this.gitFile)
            this.watcher.on('change',(function (info)
            {
                var ref

                ref = slash.readText(this.gitFile)
                if (!_k_.empty((ref)) && this.ref !== ref)
                {
                    this.ref = ref
                    cb(this.gitDir)
                    return post.emit('gitRefChanged',this.gitDir)
                }
            }).bind(this))
        }
    }

    unwatch ()
    {
        var _39_16_

        ;(this.watcher != null ? this.watcher.close() : undefined)
        return delete this.watcher
    }
}

module.exports = GitWatch
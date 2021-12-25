// monsterkodi/kode 0.228.0

var _k_

var post, watch

post = require('kxk').post
watch = require('kxk').watch

class DirWatch
{
    static watches = {}

    static watch (dir)
    {
        var watcher

        if (DirWatch.watches[dir])
        {
            return
        }
        watcher = watch.dir(dir,{skipSave:true})
        watcher.on('change',function (info)
        {
            if (info.change !== 'change')
            {
                return post.emit('dirChanged',info)
            }
        })
        watcher.on('error',function (err)
        {
            console.error(`watch.error ${err}`)
        })
        return DirWatch.watches[dir] = watcher
    }

    static unwatch (dir)
    {
        ;(DirWatch.watches[dir] != null ? DirWatch.watches[dir].close() : undefined)
        return delete DirWatch.watches[dir]
    }
}

module.exports = DirWatch
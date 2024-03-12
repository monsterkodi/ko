// monsterkodi/kode 0.270.0

var _k_

var fs, klog, post, slash

fs = require('kxk').fs
klog = require('kxk').klog
post = require('kxk').post
slash = require('kxk').slash

class Watcher
{
    static id = 0

    constructor (file)
    {
        this.file = file
    
        this.onRename = this.onRename.bind(this)
        this.onChange = this.onChange.bind(this)
        this.onExists = this.onExists.bind(this)
        this.id = Watcher.id++
        slash.exists(this.file,this.onExists)
    }

    onExists (stat)
    {
        if (!stat)
        {
            return
        }
        if (!this.id)
        {
            return
        }
        this.mtime = stat.mtimeMs
        this.w = fs.watch(this.file)
        this.w.on('change',(function (changeType, p)
        {
            if (changeType === 'change')
            {
                return slash.exists(this.file,this.onChange)
            }
            else
            {
                return setTimeout(((function ()
                {
                    return slash.exists(this.file,this.onRename)
                }).bind(this)),200)
            }
        }).bind(this))
        return this.w.on('unlink',(function (p)
        {
            return klog(`unlink ${this.id}`,slash.basename(this.file))
        }).bind(this))
    }

    onChange (stat)
    {
        if (stat.mtimeMs !== this.mtime)
        {
            this.mtime = stat.mtimeMs
            return post.emit('reloadFile',this.file)
        }
    }

    onRename (stat)
    {
        if (!stat)
        {
            this.stop()
            return post.emit('removeFile',this.file)
        }
    }

    stop ()
    {
        var _50_10_

        ;(this.w != null ? this.w.close() : undefined)
        delete this.w
        return this.id = 0
    }
}

class FileWatcher
{
    constructor ()
    {
        this.onUnwatch = this.onUnwatch.bind(this)
        this.onWatch = this.onWatch.bind(this)
        this.watchers = {}
        post.on('watch',this.onWatch)
        post.on('unwatch',this.onUnwatch)
    }

    onWatch (file)
    {
        file = slash.resolve(file)
        if (!(this.watchers[file] != null))
        {
            return this.watchers[file] = new Watcher(file)
        }
    }

    onUnwatch (file)
    {
        file = slash.resolve(file)
        ;(this.watchers[file] != null ? this.watchers[file].stop() : undefined)
        return delete this.watchers[file]
    }
}

module.exports = FileWatcher
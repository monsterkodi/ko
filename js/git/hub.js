// monsterkodi/kode 0.223.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

var diff, diffs, filter, info, kxk, post, root, roots, stati, status, watch, watchers

kxk = require('kxk')
filter = kxk.filter
post = kxk.post

watch = require('./watch')
status = require('./status')
diff = require('./diff')
info = require('./info')
root = require('./root')
watchers = {}
roots = {}
stati = {}
diffs = {}
class Hub
{
    static refresh ()
    {
        stati = {}
        roots = {}
        return diffs = {}
    }

    static watch (gitDir)
    {
        if (watchers[gitDir])
        {
            return
        }
        return watchers[gitDir] = new watch(gitDir,Hub.onGitRefChanged)
    }

    static onGitRefChanged (gitDir)
    {
        delete stati[gitDir]
        diffs = filter(diffs,function (v, k)
        {
            var _47_28_

            return !(typeof k.startsWith === "function" ? k.startsWith(gitDir) : undefined)
        })
        return Hub.status(gitDir,function (status)
        {
            return post.emit('gitStatus',gitDir,status)
        })
    }

    static onSaved (file)
    {
        if (diffs[file])
        {
            delete diffs[file]
            Hub.diff(file,function (changes)
            {
                return post.emit('gitDiff',file,changes)
            })
        }
        return Hub.applyRoot(file,function (gitDir)
        {
            if (gitDir)
            {
                return Hub.onGitRefChanged(gitDir)
            }
        })
    }

    static diff (file, cb)
    {
        if (diffs[file])
        {
            return cb(diffs[file])
        }
        else
        {
            return diff(file,function (changes)
            {
                diffs[file] = changes
                return cb(changes)
            })
        }
    }

    static status (dirOrFile, cb)
    {
        var rootStatus

        rootStatus = function (cb)
        {
            return function (gitDir)
            {
                if (stati[gitDir])
                {
                    return cb(stati[gitDir])
                }
                else
                {
                    return status(gitDir,function (info)
                    {
                        stati[gitDir] = info
                        return cb(info)
                    })
                }
            }
        }
        return Hub.applyRoot(dirOrFile,rootStatus(cb))
    }

    static statusFiles (status)
    {
        var file, files, key

        files = {}
        var list = ['changed','added','dirs']
        for (var _99_16_ = 0; _99_16_ < list.length; _99_16_++)
        {
            key = list[_99_16_]
            if (!_k_.empty(status[key]))
            {
                var list1 = _k_.list(status[key])
                for (var _101_25_ = 0; _101_25_ < list1.length; _101_25_++)
                {
                    file = list1[_101_25_]
                    files[file] = key
                }
            }
        }
        return files
    }

    static info (dirOrFile, cb)
    {
        var rootInfo

        rootInfo = function (cb)
        {
            return function (gitDir)
            {
                return info(gitDir,function (info)
                {
                    return cb(info)
                })
            }
        }
        return Hub.applyRoot(dirOrFile,rootInfo(cb))
    }

    static applyRoot (dirOrFile, cb)
    {
        if (roots[dirOrFile])
        {
            return cb(roots[dirOrFile])
        }
        else
        {
            return root(dirOrFile,function (gitDir)
            {
                roots[dirOrFile] = gitDir
                roots[gitDir] = gitDir
                Hub.watch(gitDir)
                return cb(gitDir)
            })
        }
    }
}

post.on('saved',Hub.onSaved)
module.exports = Hub
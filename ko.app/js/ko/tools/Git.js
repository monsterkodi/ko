var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}}

var Git

import kxk from "../../kxk.js"
let slash = kxk.slash
let post = kxk.post
let kermit = kxk.kermit


Git = (function ()
{
    Git["statusRequests"] = {}
    Git["statusCache"] = {}
    function Git ()
    {
        this["onFileChanged"] = this["onFileChanged"].bind(this)
        this["onProjectIndexed"] = this["onProjectIndexed"].bind(this)
        this.gitDirs = []
        post.on('projectIndexed',this.onProjectIndexed)
        post.on('fileChanged',this.onFileChanged)
    }

    Git.prototype["onProjectIndexed"] = function (prjPath)
    {
        return kakao('fs.git',prjPath).then((function (gitDir)
        {
            if (!_k_.empty(gitDir) && !(_k_.in(gitDir,this.gitDirs)))
            {
                return this.gitDirs.push(slash.path(gitDir,'.git'))
            }
        }).bind(this))
    }

    Git.prototype["onFileChanged"] = function (file)
    {
        var gitDir

        var list = _k_.list(this.gitDirs)
        for (var _31_19_ = 0; _31_19_ < list.length; _31_19_++)
        {
            gitDir = list[_31_19_]
            if (file.startsWith(gitDir))
            {
                if (slash.dir(file).endsWith('.git/refs/heads'))
                {
                    if (_k_.in(slash.name(file),['master','main']))
                    {
                        Git.status(gitDir)
                        return
                    }
                }
            }
        }
    }

    Git["status"] = async function (file)
    {
        var dirSet, gitDir, gitStatus, header, key, line, lines, rel, status

        gitDir = await kakao('fs.git',file)
        status = {gitDir:gitDir,changed:[],deleted:[],added:[],files:{}}
        if (_k_.empty(gitDir) || this.statusRequests[gitDir])
        {
            return status
        }
        this.statusRequests[gitDir] = true
        gitStatus = await kakao('app.sh','/usr/bin/git',{arg:'status --porcelain',cwd:gitDir})
        delete this.statusRequests[gitDir]
        if (gitStatus.startsWith('fatal:'))
        {
            return status
        }
        lines = gitStatus.split('\n')
        dirSet = new Set
        while (line = lines.shift())
        {
            rel = line.slice(3)
            file = slash.path(gitDir,line.slice(3))
            while ((rel = slash.dir(rel)) !== '')
            {
                dirSet.add(rel)
            }
            header = line.slice(0,2)
            switch (header)
            {
                case ' D':
                    status.deleted.push(file)
                    break
                case 'MM':
                case ' M':
                    status.changed.push(file)
                    break
                case '??':
                    status.added.push(file)
                    break
            }

        }
        status.dirs = Array.from(dirSet).map(function (d)
        {
            return slash.path(gitDir,d)
        })
        var list = ['changed','added','deleted']
        for (var _86_16_ = 0; _86_16_ < list.length; _86_16_++)
        {
            key = list[_86_16_]
            var list1 = _k_.list(status[key])
            for (var _87_21_ = 0; _87_21_ < list1.length; _87_21_++)
            {
                file = list1[_87_21_]
                status.files[file] = key
            }
        }
        post.emit('gitStatus',status)
        this.statusCache[gitDir] = status
        return status
    }

    Git["diff"] = async function (file)
    {
        var after, afterSplit, before, change, diff, gitDir, i, line, lines, newLines, numNew, numOld, oldLines, status, x, _116_55_, _117_48_

        gitDir = await kakao('fs.git',file)
        diff = await kakao('app.sh','/usr/bin/git',{arg:`--no-pager diff --no-color -U0 --ignore-blank-lines ${file}`,cwd:gitDir})
        status = {file:file,changes:[]}
        lines = diff.split('\n')
        while (line = lines.shift())
        {
            if (line.startsWith('@@'))
            {
                var _113_35_ = line.split(' '); x = _113_35_[0]; before = _113_35_[1]; after = _113_35_[2]

                afterSplit = after.split(',')
                numOld = parseInt(((_116_55_=before.split(',')[1]) != null ? _116_55_ : 1))
                numNew = parseInt(((_117_48_=afterSplit[1]) != null ? _117_48_ : 1))
                change = {line:parseInt(afterSplit[0])}
                oldLines = []
                for (var _121_26_ = i = 0, _121_30_ = numOld; (_121_26_ <= _121_30_ ? i < numOld : i > numOld); (_121_26_ <= _121_30_ ? ++i : --i))
                {
                    oldLines.push(lines.shift().slice(1))
                }
                while (_k_.first(lines)[0] === '\\')
                {
                    lines.shift()
                }
                newLines = []
                for (var _126_26_ = i = 0, _126_30_ = numNew; (_126_26_ <= _126_30_ ? i < numNew : i > numNew); (_126_26_ <= _126_30_ ? ++i : --i))
                {
                    newLines.push(lines.shift().slice(1))
                }
                while (_k_.first(lines)[0] === '\\')
                {
                    lines.shift()
                }
                if (oldLines.length)
                {
                    change.old = oldLines
                }
                if (newLines.length)
                {
                    change.new = newLines
                }
                if (numOld && numNew)
                {
                    change.mod = []
                    for (var _135_30_ = i = 0, _135_34_ = Math.min(numOld,numNew); (_135_30_ <= _135_34_ ? i < Math.min(numOld,numNew) : i > Math.min(numOld,numNew)); (_135_30_ <= _135_34_ ? ++i : --i))
                    {
                        change.mod.push({old:change.old[i],new:change.new[i]})
                    }
                }
                if (numOld > numNew)
                {
                    change.del = []
                    for (var _140_30_ = i = numNew, _140_39_ = numOld; (_140_30_ <= _140_39_ ? i < numOld : i > numOld); (_140_30_ <= _140_39_ ? ++i : --i))
                    {
                        change.del.push({old:change.old[i]})
                    }
                }
                else if (numNew > numOld)
                {
                    change.add = []
                    for (var _145_30_ = i = numOld, _145_39_ = numNew; (_145_30_ <= _145_39_ ? i < numNew : i > numNew); (_145_30_ <= _145_39_ ? ++i : --i))
                    {
                        change.add.push({new:change.new[i]})
                    }
                }
                status.changes.push(change)
            }
        }
        return status
    }

    Git["patch"] = async function (rev)
    {
        var diffgit, gitDir, patch, patches, r

        gitDir = await kakao('fs.git',editor.currentFile)
        patch = await kakao('app.sh','/usr/bin/git',{arg:`--no-pager diff ${rev}^..${rev} --no-color -U0 --ignore-blank-lines`,cwd:gitDir})
        patch = '\n' + patch
        patches = []
        var list = _k_.list(patch.split('\ndiff --git '))
        for (var _170_20_ = 0; _170_20_ < list.length; _170_20_++)
        {
            diffgit = list[_170_20_]
            if (_k_.empty(diffgit))
            {
                continue
            }
            try
            {
                r = kermit(`diff --git ●path
index ●refs
--- ●srcfile
+++ ●tgtfile
■changes
    @@ ●lineinfo @@
    ■changedlines
        ●type ○line`,'diff --git ' + diffgit)
                patches = patches.concat(r)
            }
            catch (err)
            {
                true
            }
        }
        return patches
    }

    Git["history"] = async function (path)
    {
        var args, cwd, history

        args = ["--no-pager","log","--name-status","--no-color",'.']
        if (path)
        {
            args.push(path)
            cwd = slash.dir(path)
        }
        else
        {
            cwd = await kakao('fs.git',editor.currentFile)
        }
        history = await kakao('app.sh','/usr/bin/git',{args:args,cwd:cwd})
        return kermit(`commit  ●commit
Author: ●author
Date:   ●date
●msg
■files
    ●type ●path`,history)
    }

    return Git
})()

export default Git;
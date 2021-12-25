// monsterkodi/kode 0.223.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var childp, dir, gitCmd, gitOpt, kxk, parseResult, slash, status, _

kxk = require('kxk')
childp = kxk.childp
slash = kxk.slash
_ = kxk._

gitCmd = 'git status --porcelain'

gitOpt = function (gitDir)
{
    return {encoding:'utf8',cwd:slash.unslash(gitDir),stdio:['pipe','pipe','ignore']}
}

status = function (gitDir, cb)
{
    var r

    if (_.isFunction(cb))
    {
        if (_k_.empty(gitDir))
        {
            return cb({})
        }
        else
        {
            try
            {
                return childp.exec(gitCmd,gitOpt(gitDir),function (err, r)
                {
                    if (!_k_.empty(err))
                    {
                        return cb({})
                    }
                    else
                    {
                        return cb(parseResult(gitDir,r))
                    }
                })
            }
            catch (err)
            {
                return cb({})
            }
        }
    }
    else
    {
        if (_k_.empty(gitDir))
        {
            return {}
        }
        try
        {
            r = childp.execSync(gitCmd,gitOpt(gitDir))
        }
        catch (err)
        {
            return {}
        }
        return parseResult(gitDir,r)
    }
}

parseResult = function (gitDir, result)
{
    var dirSet, file, header, info, line, lines, rel

    if (result.startsWith('fatal:'))
    {
        return {}
    }
    lines = result.split('\n')
    info = {gitDir:gitDir,changed:[],deleted:[],added:[]}
    dirSet = new Set
    while (line = lines.shift())
    {
        rel = line.slice(3)
        file = slash.join(gitDir,line.slice(3))
        while ((rel = slash.dir(rel)) !== '')
        {
            dirSet.add(rel)
        }
        header = line.slice(0,2)
        switch (header)
        {
            case ' D':
                info.deleted.push(file)
                break
            case ' M':
                info.changed.push(file)
                break
            case '??':
                info.added.push(file)
                break
        }

    }
    info.dirs = Array.from(dirSet).map(function (d)
    {
        return slash.join(gitDir,d)
    })
    return info
}
if (module.parent)
{
    module.exports = status
}
else
{
    if (!_k_.empty(process.argv[2]))
    {
        dir = slash.resolve(process.argv[2])
    }
    else
    {
        dir = process.cwd()
    }
    console.log(status(dir))
}
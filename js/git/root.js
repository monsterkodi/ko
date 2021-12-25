// monsterkodi/kode 0.228.0

var _k_ = {isFunc: function (o) {return typeof o === 'function'}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var childp, dir, fixPath, gitCmd, gitOpt, kxk, root, slash, _

kxk = require('kxk')
_ = kxk._
childp = kxk.childp
slash = kxk.slash


fixPath = function (p)
{
    p = p.trim()
    if ((p[0] === p[2] && p[2] === '/'))
    {
        p = p[1].toUpperCase() + ':' + p.slice(2)
    }
    return slash.resolve(p)
}
gitCmd = 'git rev-parse --show-toplevel'

gitOpt = function (cwd)
{
    return {cwd:cwd,encoding:'utf8',stdio:['pipe','pipe','ignore']}
}

root = function (pth, cb)
{
    pth = slash.resolve(pth)
    if (_k_.isFunc(cb))
    {
        if (_k_.empty(pth))
        {
            return cb('')
        }
        else
        {
            pth = slash.unslash(pth)
            return slash.dirExists(pth,function (stat)
            {
                pth = !_k_.empty((stat)) ? slash.unslash(pth) : slash.dir(pth)
                if (_k_.empty(pth))
                {
                    return cb('')
                }
                else
                {
                    return slash.git(pth,cb)
                }
            })
        }
    }
    else
    {
        if (_k_.empty(pth))
        {
            return ''
        }
        try
        {
            pth = slash.dirExists(pth) ? slash.unslash(pth) : slash.dir(pth)
            if (_k_.empty(pth))
            {
                return ''
            }
            return fixPath(childp.execSync(gitCmd,gitOpt(pth)))
        }
        catch (err)
        {
            return ''
        }
    }
}
if (module.parent)
{
    module.exports = root
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
    console.log(root(dir))
}
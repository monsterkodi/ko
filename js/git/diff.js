// monsterkodi/kode 0.218.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

var childp, diff, file, gitCmd, gitOpt, kstr, kxk, parseResult, slash, _

kxk = require('kxk')
_ = kxk._
childp = kxk.childp
kstr = kxk.kstr
slash = kxk.slash


gitCmd = function (file)
{
    return `git --no-pager diff -U0 \"${slash.file(file)}\"`
}

gitOpt = function (cwd)
{
    return {cwd:cwd,encoding:'utf8',stdio:['pipe','pipe','ignore']}
}

diff = function (file, cb)
{
    file = slash.resolve(file)
    if (_.isFunction(cb))
    {
        return slash.isFile(file,function (stat)
        {
            if (_k_.empty(stat))
            {
                cb({})
            }
            return childp.exec(gitCmd(file),gitOpt(slash.unslash(slash.dir(file))),function (err, r)
            {
                if (!_k_.empty(err))
                {
                    return cb({})
                }
                else
                {
                    return cb(parseResult(file,r))
                }
            })
        })
    }
    else
    {
        if (!slash.isFile(file))
        {
            return {}
        }
        return parseResult(file,childp.execSync(gitCmd(file),gitOpt(slash.unslash(slash.dir(file)))))
    }
}

parseResult = function (file, result)
{
    var after, afterSplit, before, change, i, info, l, line, lines, newLines, numNew, numOld, oldLines, x, _49_51_, _50_44_

    info = {file:file,changes:[]}
    lines = (function () { var _41__36_ = []; var list = _k_.list(result.split('\n')); for (var _41_36_ = 0; _41_36_ < list.length; _41_36_++)  { l = list[_41_36_];_41__36_.push(kstr.stripAnsi(l))  } return _41__36_ }).bind(this)()
    while (line = lines.shift())
    {
        if (line.startsWith('@@'))
        {
            var _46_31_ = line.split(' '); x = _46_31_[0]; before = _46_31_[1]; after = _46_31_[2]

            afterSplit = after.split(',')
            numOld = parseInt(((_49_51_=before.split(',')[1]) != null ? _49_51_ : 1))
            numNew = parseInt(((_50_44_=afterSplit[1]) != null ? _50_44_ : 1))
            change = {line:parseInt(afterSplit[0])}
            oldLines = []
            for (var _54_22_ = i = 0, _54_26_ = numOld; (_54_22_ <= _54_26_ ? i < numOld : i > numOld); (_54_22_ <= _54_26_ ? ++i : --i))
            {
                oldLines.push(lines.shift().slice(1))
            }
            while (_.first(lines)[0] === '\\')
            {
                lines.shift()
            }
            newLines = []
            for (var _59_22_ = i = 0, _59_26_ = numNew; (_59_22_ <= _59_26_ ? i < numNew : i > numNew); (_59_22_ <= _59_26_ ? ++i : --i))
            {
                newLines.push(lines.shift().slice(1))
            }
            while (_.first(lines)[0] === '\\')
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
                for (var _68_26_ = i = 0, _68_30_ = Math.min(numOld,numNew); (_68_26_ <= _68_30_ ? i < Math.min(numOld,numNew) : i > Math.min(numOld,numNew)); (_68_26_ <= _68_30_ ? ++i : --i))
                {
                    change.mod.push({old:change.old[i],new:change.new[i]})
                }
            }
            if (numOld > numNew)
            {
                change.del = []
                for (var _73_26_ = i = numNew, _73_35_ = numOld; (_73_26_ <= _73_35_ ? i < numOld : i > numOld); (_73_26_ <= _73_35_ ? ++i : --i))
                {
                    change.del.push({old:change.old[i]})
                }
            }
            else if (numNew > numOld)
            {
                change.add = []
                for (var _78_26_ = i = numOld, _78_35_ = numNew; (_78_26_ <= _78_35_ ? i < numNew : i > numNew); (_78_26_ <= _78_35_ ? ++i : --i))
                {
                    change.add.push({new:change.new[i]})
                }
            }
            info.changes.push(change)
        }
    }
    return info
}
if (module.parent)
{
    module.exports = diff
}
else
{
    if (!_k_.empty(process.argv[2]))
    {
        file = slash.resolve(process.argv[2])
    }
    else
    {
        file = process.cwd()
    }
    console.log(diff(file))
}
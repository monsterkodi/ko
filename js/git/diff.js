// monsterkodi/kode 0.270.0

var _k_ = {isFunc: function (o) {return typeof o === 'function'}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var childp, diff, file, gitCmd, gitOpt, kstr, parseResult, slash, _

_ = require('kxk')._
childp = require('kxk').childp
kstr = require('kxk').kstr
slash = require('kxk').slash


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
    if (_k_.isFunc(cb))
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
    var after, afterSplit, before, change, i, info, l, line, lines, newLines, numNew, numOld, oldLines, x, _48_51_, _49_44_

    info = {file:file,changes:[]}
    lines = (function () { var r_40_36_ = []; var list = _k_.list(result.split('\n')); for (var _40_36_ = 0; _40_36_ < list.length; _40_36_++)  { l = list[_40_36_];r_40_36_.push(kstr.stripAnsi(l))  } return r_40_36_ }).bind(this)()
    while (line = lines.shift())
    {
        if (line.startsWith('@@'))
        {
            var _45_31_ = line.split(' '); x = _45_31_[0]; before = _45_31_[1]; after = _45_31_[2]

            afterSplit = after.split(',')
            numOld = parseInt(((_48_51_=before.split(',')[1]) != null ? _48_51_ : 1))
            numNew = parseInt(((_49_44_=afterSplit[1]) != null ? _49_44_ : 1))
            change = {line:parseInt(afterSplit[0])}
            oldLines = []
            for (var _53_22_ = i = 0, _53_26_ = numOld; (_53_22_ <= _53_26_ ? i < numOld : i > numOld); (_53_22_ <= _53_26_ ? ++i : --i))
            {
                oldLines.push(lines.shift().slice(1))
            }
            while (_.first(lines)[0] === '\\')
            {
                lines.shift()
            }
            newLines = []
            for (var _58_22_ = i = 0, _58_26_ = numNew; (_58_22_ <= _58_26_ ? i < numNew : i > numNew); (_58_22_ <= _58_26_ ? ++i : --i))
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
                for (var _67_26_ = i = 0, _67_30_ = Math.min(numOld,numNew); (_67_26_ <= _67_30_ ? i < Math.min(numOld,numNew) : i > Math.min(numOld,numNew)); (_67_26_ <= _67_30_ ? ++i : --i))
                {
                    change.mod.push({old:change.old[i],new:change.new[i]})
                }
            }
            if (numOld > numNew)
            {
                change.del = []
                for (var _72_26_ = i = numNew, _72_35_ = numOld; (_72_26_ <= _72_35_ ? i < numOld : i > numOld); (_72_26_ <= _72_35_ ? ++i : --i))
                {
                    change.del.push({old:change.old[i]})
                }
            }
            else if (numNew > numOld)
            {
                change.add = []
                for (var _77_26_ = i = numOld, _77_35_ = numNew; (_77_26_ <= _77_35_ ? i < numNew : i > numNew); (_77_26_ <= _77_35_ ? ++i : --i))
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
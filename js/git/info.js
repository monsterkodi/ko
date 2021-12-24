// monsterkodi/kode 0.218.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

var diff, dir, info, kxk, slash, status, _

kxk = require('kxk')
slash = kxk.slash
_ = kxk._

status = require('./status')
diff = require('./diff')

info = function (gitDir, cb)
{
    var stts

    if (_.isFunction(cb))
    {
        return status(gitDir,function (stts)
        {
            var changed, file, numFiles, pushFile

            if (_k_.empty(stts))
            {
                return cb({})
            }
            else
            {
                numFiles = stts.changed.length
                changed = []
                var list = _k_.list(stts.changed)
                for (var _25_25_ = 0; _25_25_ < list.length; _25_25_++)
                {
                    file = list[_25_25_]
                    pushFile = function (file)
                    {
                        return function (dsts)
                        {
                            changed.push(dsts)
                            numFiles -= 1
                            if (numFiles === 0)
                            {
                                stts.changed = changed
                                return cb(stts)
                            }
                        }
                    }
                    diff(file,pushFile(file))
                }
            }
        })
    }
    else
    {
        stts = status(gitDir)
        if (_k_.empty(stts))
        {
            return {}
        }
        else
        {
            stts.changed = stts.changed.map(function (file)
            {
                return diff(file)
            })
            return stts
        }
    }
}
if (module.parent)
{
    module.exports = info
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
    console.log(info(dir))
}
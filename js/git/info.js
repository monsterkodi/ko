// monsterkodi/kode 0.245.0

var _k_ = {isFunc: function (o) {return typeof o === 'function'}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var diff, dir, info, slash, status, _

slash = require('kxk').slash
_ = require('kxk')._

status = require('./status')
diff = require('./diff')

info = function (gitDir, cb)
{
    var stts

    if (_k_.isFunc(cb))
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
                for (var _24_25_ = 0; _24_25_ < list.length; _24_25_++)
                {
                    file = list[_24_25_]
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
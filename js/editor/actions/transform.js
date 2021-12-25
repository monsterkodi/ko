// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}}

var kerror, kstr, matchr, reversed, slash, _

_ = require('kxk')._
kerror = require('kxk').kerror
kstr = require('kxk').kstr
matchr = require('kxk').matchr
reversed = require('kxk').reversed
slash = require('kxk').slash

class Transform
{
    static transformNames = ['upper','lower','title','case','count','add','sub','up','down','sort','uniq','reverse','resolve','unresolve','dir','base','file','ext']

    static transformMenus = {Case:['upper','lower','title','case'],Calc:['count','add','sub'],Sort:['up','down','sort','uniq','reverse'],Path:['resolve','unresolve','dir','base','file','ext']}

    constructor (editor)
    {
        this.editor = editor
    
        this.editor.transform = this
        this.last = null
        this.caseFuncs = ['upper','lower','title']
        this.resolveFuncs = ['resolve','unresolve']
        this.sortFuncs = ['up','down']
    }

    count (typ = 'dec', offset = 0, step = 1)
    {
        var base, cs, i, numbers, pad

        offset = parseInt(offset)
        step = parseInt(step)
        this.editor.do.start()
        this.editor.fillVirtualSpaces()
        cs = this.editor.do.cursors()
        this.editor.do.select(rangesFromPositions(cs))
        switch (typ)
        {
            case 'hex':
                base = 16
                break
            case 'bin':
                base = 2
                break
            default:
                base = 10
        }

        pad = Number(step * (cs.length - 1) + offset).toString(base).length
        numbers = (function () { var _60__83_ = []; for (var _60_87_ = i = 0, _60_91_ = cs.length; (_60_87_ <= _60_91_ ? i < cs.length : i > cs.length); (_60_87_ <= _60_91_ ? ++i : --i))  { _60__83_.push(_.padStart(Number(step * i + offset).toString(base),pad,'0'))  } return _60__83_ }).bind(this)()
        this.editor.replaceSelectedText(numbers)
        this.editor.do.end()
        return 'count'
    }

    add (d = 1)
    {
        this.apply(function (t)
        {
            return kstr(parseInt(t) + parseInt(d))
        })
        return 'add'
    }

    sub (d = 1)
    {
        this.apply(function (t)
        {
            return kstr(parseInt(t) - parseInt(d))
        })
        return 'sub'
    }

    reverse ()
    {
        this.trans(function (l)
        {
            return reversed(l)
        })
        return 'reverse'
    }

    sort ()
    {
        return this.toggle(this.sortFuncs)
    }

    up ()
    {
        this.trans(function (l)
        {
            return l.sort(function (a, b)
            {
                return a.localeCompare(b)
            })
        })
        return 'up'
    }

    down ()
    {
        this.trans(function (l)
        {
            return reversed(l.sort(function (a, b)
            {
                return a.localeCompare(b)
            }))
        })
        return 'down'
    }

    uniq ()
    {
        this.trans(function (l)
        {
            var a, r, v

            v = []
            r = []
            var list = _k_.list(l)
            for (var _112_18_ = 0; _112_18_ < list.length; _112_18_++)
            {
                a = list[_112_18_]
                _k_.in(a,v) ? r.push('') : v.push(a)
            }
            return r
        })
        return 'uniq'
    }

    case ()
    {
        return this.toggle(this.caseFuncs)
    }

    upper ()
    {
        this.apply(function (t)
        {
            return t.toUpperCase()
        })
        return 'upper'
    }

    lower ()
    {
        this.apply(function (t)
        {
            return t.toLowerCase()
        })
        return 'lower'
    }

    title ()
    {
        var pattern

        pattern = /\w+/
        this.apply(function (t)
        {
            var r

            var list = _k_.list(matchr.ranges(/\w+/,t))
            for (var _139_18_ = 0; _139_18_ < list.length; _139_18_++)
            {
                r = list[_139_18_]
                t = t.splice(r.start,r.match.length,r.match.substr(0,1).toUpperCase() + r.match.slice(1).toLowerCase())
            }
            return t
        })
        return 'title'
    }

    toggleResolve ()
    {
        return this.toggle(this.resolveFuncs)
    }

    resolve ()
    {
        var cwd, _155_30_

        cwd = process.cwd()
        if ((this.editor.currentFile != null))
        {
            process.chdir(slash.dir(this.editor.currentFile))
        }
        this.apply(function (t)
        {
            return slash.resolve(t)
        })
        process.chdir(cwd)
        return 'resolve'
    }

    unresolve ()
    {
        this.apply(function (t)
        {
            return slash.unresolve(t)
        })
        return 'unresolve'
    }

    base ()
    {
        this.apply(function (t)
        {
            return slash.base(t)
        })
        return 'basename'
    }

    dir ()
    {
        this.apply(function (t)
        {
            return slash.dir(t)
        })
        return 'dirname'
    }

    ext ()
    {
        this.apply(function (t)
        {
            return slash.ext(t)
        })
        return 'ext'
    }

    file ()
    {
        this.apply(function (t)
        {
            return slash.file(t)
        })
        return 'file'
    }

    apply (func)
    {
        return this.tfunc({apply:func})
    }

    trans (func)
    {
        return this.tfunc({trans:func})
    }

    tfunc (opt)
    {
        var selections, tl, _226_42_, _227_42_

        if (!this.editor.numSelections())
        {
            if (opt.trans)
            {
                this.editor.selectMoreLines()
            }
            else
            {
                this.editor.select(this.editor.rangesForWordsAtCursors())
            }
        }
        selections = this.editor.selections()
        tl = this.editor.textsInRanges(selections)
        if ((opt.apply != null))
        {
            tl = tl.map(opt.apply)
        }
        if ((opt.trans != null))
        {
            tl = opt.trans(tl)
        }
        this.editor.do.start()
        this.editor.replaceSelectedText(tl)
        return this.editor.do.end()
    }

    toggle (funcList)
    {
        var nextIndex

        if (!(_k_.in(this.last,funcList)))
        {
            this.last = _.last(funcList)
        }
        nextIndex = (1 + funcList.indexOf(this.last)) % funcList.length
        return this.do(funcList[nextIndex])
    }

    do (transName, ...opts)
    {
        var f

        f = this[transName]
        if (_k_.isFunc(f))
        {
            this.last = f.apply(this,opts)
        }
        else
        {
            return kerror(`unhandled transform ${transName}`)
        }
        return this.last
    }

    static do (editor, transName, ...opts)
    {
        var t, _266_29_

        t = ((_266_29_=editor.transform) != null ? _266_29_ : new Transform(editor))
        return t.do.apply(t,[transName].concat(opts))
    }
}

module.exports = {actions:{menu:"Misc",toggleCase:{name:'Toggle Case',text:'toggles selected texts between lower- upper- and title-case',combo:'command+alt+ctrl+u',accel:'alt+ctrl+u'},reverseSelection:{name:'Reverse Selection',text:'reverses the order of selected texts',combo:'command+alt+ctrl+r',accel:'alt+ctrl+r'},doTransform:{name:'doTransform'}},toggleCase:function ()
{
    return Transform.do(this,'case')
},reverseSelection:function ()
{
    return Transform.do(this,'reverse')
},doTransform:function (arg)
{
    return Transform.do(this,arg)
},Transform:Transform,transformNames:Transform.transformNames}
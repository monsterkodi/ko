var _k_ = {lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, isFunc: function (o) {return typeof o === 'function'}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let slash = kxk.slash
let matchr = kxk.matchr
let reversed = kxk.reversed

class Transform
{
    static transformNames = ['upper','lower','title','case','count','add','sub','up','down','sort','uniq','reverse','dir','base','file','ext']

    static transformMenus = {Case:['upper','lower','title','case'],Calc:['count','add','sub'],Sort:['up','down','sort','uniq','reverse'],Path:['dir','base','file','ext']}

    constructor (editor)
    {
        this.editor = editor
    
        this.last = null
        this.caseFuncs = ['upper','lower','title']
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
        numbers = (function () { var r_57_77_ = []; for (var _57_81_ = i = 0, _57_85_ = cs.length; (_57_81_ <= _57_85_ ? i < cs.length : i > cs.length); (_57_81_ <= _57_85_ ? ++i : --i))  { r_57_77_.push(_k_.lpad(pad,Number(step * i + offset).toString(base),'0'))  } return r_57_77_ }).bind(this)()
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
            for (var _109_18_ = 0; _109_18_ < list.length; _109_18_++)
            {
                a = list[_109_18_]
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
        this.apply(function (t)
        {
            var r

            var list = _k_.list(matchr.ranges(/\w+/,t))
            for (var _135_18_ = 0; _135_18_ < list.length; _135_18_++)
            {
                r = list[_135_18_]
                t = kstr.splice(t,r.start,r.match.length,r.match.substr(0,1).toUpperCase() + r.match.slice(1).toLowerCase())
            }
            return t
        })
        return 'title'
    }

    base ()
    {
        this.apply(function (t)
        {
            return slash.name(t)
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
        var selections, tl, _200_42_, _201_42_

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
            this.last = _k_.last(funcList)
        }
        nextIndex = (1 + funcList.indexOf(this.last)) % funcList.length
        return this.do(funcList[nextIndex])
    }

    do (transName, ...opts)
    {
        var f

        console.log('do transform',transName)
        f = this[transName]
        if (_k_.isFunc(f))
        {
            this.last = f.apply(this,opts)
        }
        else
        {
            return console.error(`unhandled transform ${transName}`)
        }
        return this.last
    }

    static do (editor, transName, ...opts)
    {
        var _245_25_

        console.log('static Transform.do',editor.name,transName)
        editor.transform = ((_245_25_=editor.transform) != null ? _245_25_ : new Transform(editor))
        return editor.transform.do.apply(editor.transform,[transName].concat(opts))
    }
}

export default {actions:{menu:"Misc",toggleCase:{name:'Toggle Case',text:'toggles selected texts between lower- upper- and title-case',combo:'command+alt+ctrl+u'},reverseSelection:{name:'Reverse Selection',text:'reverses the order of selected texts',combo:'command+alt+ctrl+r'},sortSelection:{name:'Sort Selection',text:'sorts selected texts. toggles between up and down',combo:'command+alt+ctrl+s'},doTransform:{name:'doTransform'}},toggleCase:function ()
{
    return Transform.do(this,'case')
},reverseSelection:function ()
{
    return Transform.do(this,'reverse')
},sortSelection:function ()
{
    return Transform.do(this,'sort')
},doTransform:function (arg)
{
    return Transform.do(this,arg)
},Transform:Transform,transformNames:Transform.transformNames}
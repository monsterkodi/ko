var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

import kxk from "../../../kxk.js"
let reversed = kxk.reversed

export default {actions:{toggleGitChange:{name:'Toggle Git Changes at Cursors',combo:'command+u'}},toggleGitChange:function (key, info)
{
    return this.toggleGitChangesInLines(this.selectedAndCursorLineIndices())
},toggleGitChangesInLines:function (lineIndices)
{
    var cursors, li, lineMeta, metas, offset, oi, untoggled

    metas = []
    untoggled = false
    this.do.start()
    this.do.setCursors([this.mainCursor()])
    this.do.select([])
    this.do.end()
    var list = _k_.list(lineIndices)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        li = list[_a_]
        var list1 = _k_.list(this.meta.metasAtLineIndex(li))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            lineMeta = list1[_b_]
            if (lineMeta[2].clss.startsWith('git'))
            {
                if (!lineMeta[2].toggled)
                {
                    untoggled = true
                }
                metas.push(lineMeta)
            }
        }
    }
    var list2 = _k_.list(metas)
    for (var _c_ = 0; _c_ < list2.length; _c_++)
    {
        lineMeta = list2[_c_]
        oi = lineMeta[0]
        if (untoggled)
        {
            if (!lineMeta[2].toggled)
            {
                this.reverseGitChange(lineMeta)
            }
        }
        else
        {
            if (lineMeta[2].toggled)
            {
                this.applyGitChange(lineMeta)
            }
            else
            {
                this.reverseGitChange(lineMeta)
            }
        }
        if (oi !== lineMeta[0])
        {
            offset = oi - lineMeta[0]
            if (offset < 0)
            {
                this.meta.moveLineMeta(lineMeta,offset)
            }
        }
    }
    cursors = []
    var list3 = _k_.list(metas)
    for (var _d_ = 0; _d_ < list3.length; _d_++)
    {
        lineMeta = list3[_d_]
        cursors.push([0,lineMeta[0]])
        if (!(_k_.in(lineMeta,this.meta.metas)))
        {
            this.meta.addLineMeta(lineMeta)
            this.meta.addDiv(lineMeta)
        }
    }
    this.do.start()
    this.do.setCursors(cursors,{main:'closest'})
    this.do.select([])
    return this.do.end()
},reverseGitChange:function (lineMeta)
{
    var li, line, meta, _87_16_

    meta = lineMeta[2]
    li = lineMeta[0]
    this.do.start()
    meta.toggled = true
    ;(meta.div != null ? meta.div.classList.add('toggled') : undefined)
    switch (meta.clss)
    {
        case 'git mod':
        case 'git mod boring':
            this.do.change(li,meta.change.old)
            break
        case 'git add':
        case 'git add boring':
            this.do.delete(li)
            break
        case 'git del':
            var list = _k_.list(reversed(meta.change))
            for (var _e_ = 0; _e_ < list.length; _e_++)
            {
                line = list[_e_]
                this.do.insert(li,line.old)
            }
            break
    }

    return this.do.end()
},applyGitChange:function (lineMeta)
{
    var li, line, meta, _114_16_

    meta = lineMeta[2]
    li = lineMeta[0]
    this.do.start()
    delete meta.toggled
    ;(meta.div != null ? meta.div.classList.remove('toggled') : undefined)
    switch (meta.clss)
    {
        case 'git mod':
        case 'git mod boring':
            this.do.change(li,meta.change.new)
            break
        case 'git add':
        case 'git add boring':
            this.do.insert(li,meta.change.new)
            break
        case 'git del':
            var list = _k_.list(reversed(meta.change))
            for (var _f_ = 0; _f_ < list.length; _f_++)
            {
                line = list[_f_]
                this.do.delete(li)
            }
            break
    }

    return this.do.end()
}}
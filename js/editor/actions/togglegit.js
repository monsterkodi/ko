// monsterkodi/kode 0.257.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var reversed

reversed = require('kxk').reversed

module.exports = {actions:{toggleGitChange:{name:'Toggle Git Changes at Cursors',combo:'command+u',accel:'ctrl+u'}},toggleGitChange:function (key, info)
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
    for (var _33_15_ = 0; _33_15_ < list.length; _33_15_++)
    {
        li = list[_33_15_]
        var list1 = _k_.list(this.meta.metasAtLineIndex(li))
        for (var _35_25_ = 0; _35_25_ < list1.length; _35_25_++)
        {
            lineMeta = list1[_35_25_]
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
    for (var _44_21_ = 0; _44_21_ < list2.length; _44_21_++)
    {
        lineMeta = list2[_44_21_]
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
    for (var _63_21_ = 0; _63_21_ < list3.length; _63_21_++)
    {
        lineMeta = list3[_63_21_]
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
    var li, line, meta, _88_16_

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
            for (var _100_25_ = 0; _100_25_ < list.length; _100_25_++)
            {
                line = list[_100_25_]
                this.do.insert(li,line.old)
            }
            break
    }

    return this.do.end()
},applyGitChange:function (lineMeta)
{
    var li, line, meta, _119_16_

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
            for (var _133_25_ = 0; _133_25_ < list.length; _133_25_++)
            {
                line = list[_133_25_]
                this.do.delete(li)
            }
            break
    }

    return this.do.end()
}}
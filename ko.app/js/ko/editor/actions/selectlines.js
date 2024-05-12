var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}}

import kxk from "../../../kxk.js"
let reversed = kxk.reversed

export default {actions:{menu:'Select',selectMoreLines:{name:'Select More Lines',text:'selects line at cursor or next line if cursor line is selected already',combo:'command+l'},selectLessLines:{name:'Select Less Lines',text:'removes a line from each block of selected lines',combo:'command+shift+l'}},selectMoreLines:function ()
{
    var c, newCursors, newSelections, selectCursorLineAtIndex, start

    this.do.start()
    newCursors = this.do.cursors()
    newSelections = this.do.selections()
    selectCursorLineAtIndex = (function (c, i)
    {
        var range

        range = [i,[0,this.do.line(i).length]]
        newSelections.push(range)
        return cursorSet(c,rangeEndPos(range))
    }).bind(this)
    start = false
    var list = _k_.list(newCursors)
    for (var _37_14_ = 0; _37_14_ < list.length; _37_14_++)
    {
        c = list[_37_14_]
        if (!this.isSelectedLineAtIndex(c[1]))
        {
            selectCursorLineAtIndex(c,c[1])
            start = true
        }
    }
    if (!start)
    {
        var list1 = _k_.list(newCursors)
        for (var _43_18_ = 0; _43_18_ < list1.length; _43_18_++)
        {
            c = list1[_43_18_]
            if (c[1] < this.numLines() - 1)
            {
                selectCursorLineAtIndex(c,c[1] + 1)
            }
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
},selectLessLines:function ()
{
    var c, newCursors, newSelections, s, thisSel

    this.do.start()
    newCursors = this.do.cursors()
    newSelections = this.do.selections()
    var list = _k_.list(reversed(newCursors))
    for (var _56_14_ = 0; _56_14_ < list.length; _56_14_++)
    {
        c = list[_56_14_]
        thisSel = rangesAtLineIndexInRanges(c[1],newSelections)
        if (thisSel.length)
        {
            if (this.isSelectedLineAtIndex(c[1] - 1))
            {
                s = _k_.first(rangesAtLineIndexInRanges(c[1] - 1,newSelections))
                cursorSet(c,s[1][1],s[0])
            }
            newSelections.splice(newSelections.indexOf(thisSel[0]),1)
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
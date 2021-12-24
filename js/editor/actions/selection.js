// monsterkodi/kode 0.212.0

var _k_ = {list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var kerror, klog, post, _

_ = require('kxk')._
kerror = require('kxk').kerror
klog = require('kxk').klog
post = require('kxk').post

module.exports = {actions:{menu:'Select',selectAll:{name:'Select All',combo:'command+a',accel:'ctrl+a'},selectNone:{name:'Deselect',combo:'command+shift+a',accel:'ctrl+shift+a'},selectInverted:{name:'Invert Selection',text:'selects all lines that have no cursors and no selections',combo:'command+i',accel:'ctrl+i'},selectNextHighlight:{separator:true,name:'Select Next Highlight',combo:'command+g',accel:'ctrl+g'},selectPrevHighlight:{name:'Select Previous Highlight',combo:'command+shift+g',accel:'ctrl+shift+g'},selectTextBetweenCursorsOrSurround:{name:'Select Between Cursors, Brackets or Quotes',text:`select text between even cursors, if at least two cursors exist. 
select text between highlighted brackets or quotes otherwise.`,combo:'alt+b',accel:'alt+b'},toggleStickySelection:{separator:true,name:'Toggle Sticky Selection',text:'current selection is not removed when adding new selections',combo:"ctrl+'",accel:"ctrl+'"}},selectSingleRange:function (r, opt)
{
    var cursorX

    if (!(r != null))
    {
        return kerror(`Editor.${name}.selectSingleRange -- undefined range!`)
    }
    cursorX = (opt != null ? opt.before : undefined) ? r[1][0] : r[1][1]
    this.do.start()
    this.do.setCursors([[cursorX,r[0]]])
    this.do.select([r])
    this.do.end()
    return this
},toggleStickySelection:function ()
{
    klog('toggleStickySelection')
    if (this.stickySelection)
    {
        return this.endStickySelection()
    }
    else
    {
        return this.startStickySelection()
    }
},startStickySelection:function ()
{
    this.stickySelection = true
    post.emit('sticky',true)
    return this.emit('selection')
},endStickySelection:function ()
{
    this.stickySelection = false
    post.emit('sticky',false)
    return this.emit('selection')
},startSelection:function (opt = {extend:false})
{
    var c, sel

    if (!(opt != null ? opt.extend : undefined))
    {
        this.startSelectionCursors = null
        if (!this.stickySelection)
        {
            this.do.select([])
        }
        return
    }
    if (!this.startSelectionCursors || this.numCursors() !== this.startSelectionCursors.length)
    {
        this.startSelectionCursors = this.do.cursors()
        if (this.numSelections())
        {
            var list = _k_.list(this.startSelectionCursors)
            for (var _113_22_ = 0; _113_22_ < list.length; _113_22_++)
            {
                c = list[_113_22_]
                if (sel = this.continuousSelectionAtPosInRanges(c,this.do.selections()))
                {
                    if (isSamePos(sel[1],c))
                    {
                        c[0] = sel[0][0]
                        c[1] = sel[0][1]
                    }
                }
            }
        }
        if (!this.stickySelection)
        {
            return this.do.select(rangesFromPositions(this.startSelectionCursors))
        }
    }
},endSelection:function (opt = {extend:false})
{
    var ci, nc, newCursors, newSelection, oc, oldCursors, ranges, _132_50_

    if (!(opt != null ? opt.extend : undefined))
    {
        this.startSelectionCursors = null
        if (!this.stickySelection)
        {
            this.do.select([])
        }
    }
    else
    {
        oldCursors = ((_132_50_=this.startSelectionCursors) != null ? _132_50_ : this.do.cursors())
        newSelection = this.stickySelection && this.do.selections() || []
        newCursors = this.do.cursors()
        if (oldCursors.length !== newCursors.length)
        {
            return kerror(`Editor.${this.name}.endSelection -- oldCursors.size != newCursors.size`,oldCursors.length,newCursors.length)
        }
        for (var _139_23_ = ci = 0, _139_27_ = this.do.numCursors(); (_139_23_ <= _139_27_ ? ci < this.do.numCursors() : ci > this.do.numCursors()); (_139_23_ <= _139_27_ ? ++ci : --ci))
        {
            oc = oldCursors[ci]
            nc = newCursors[ci]
            if (!(oc != null) || !(nc != null))
            {
                return kerror(`Editor.${this.name}.endSelection -- invalid cursors`,oc,nc)
            }
            else
            {
                ranges = this.rangesForLinesBetweenPositions(oc,nc,true)
                newSelection = newSelection.concat(ranges)
            }
        }
        this.do.select(newSelection)
    }
    return this.checkSalterMode()
},addRangeToSelection:function (range)
{
    var newSelections

    this.do.start()
    newSelections = this.do.selections()
    newSelections.push(range)
    this.do.setCursors(endPositionsFromRanges(newSelections),{main:'last'})
    this.do.select(newSelections)
    return this.do.end()
},removeSelectionAtIndex:function (si)
{
    var newCursors, newSelections

    this.do.start()
    newSelections = this.do.selections()
    newSelections.splice(si,1)
    if (newSelections.length)
    {
        newCursors = endPositionsFromRanges(newSelections)
        this.do.setCursors(newCursors,{main:(newCursors.length + si - 1) % newCursors.length})
    }
    this.do.select(newSelections)
    return this.do.end()
},clearSelection:function ()
{
    return this.selectNone()
},selectNone:function ()
{
    this.do.start()
    this.do.select([])
    return this.do.end()
},selectAll:function ()
{
    this.do.start()
    this.do.select(this.rangesForAllLines())
    return this.do.end()
},selectInverted:function ()
{
    var invertedRanges, li, sc

    invertedRanges = []
    sc = this.selectedAndCursorLineIndices()
    for (var _202_19_ = li = 0, _202_23_ = this.numLines(); (_202_19_ <= _202_23_ ? li < this.numLines() : li > this.numLines()); (_202_19_ <= _202_23_ ? ++li : --li))
    {
        if (!(_k_.in(li,sc)))
        {
            invertedRanges.push(this.rangeForLineAtIndex(li))
        }
    }
    if (invertedRanges.length)
    {
        this.do.start()
        this.do.setCursors([rangeStartPos(_.first(invertedRanges))])
        this.do.select(invertedRanges)
        return this.do.end()
    }
},selectTextBetweenCursorsOrSurround:function ()
{
    var c0, c1, i, newCursors, newSelections, oldCursors

    if (this.numCursors() && this.numCursors() % 2 === 0)
    {
        this.do.start()
        newSelections = []
        newCursors = []
        oldCursors = this.do.cursors()
        for (var _224_22_ = i = 0, _224_26_ = oldCursors.length; (_224_22_ <= _224_26_ ? i < oldCursors.length : i > oldCursors.length); (_224_22_ <= _224_26_ ? ++i : --i))
        {
            c0 = oldCursors[i]
            c1 = oldCursors[i + 1]
            newSelections = newSelections.concat(this.rangesForLinesBetweenPositions(c0,c1))
            newCursors.push(c1)
            i++
        }
        this.do.setCursors(newCursors)
        this.do.select(newSelections)
        return this.do.end()
    }
    else
    {
        return this.selectBetweenSurround()
    }
},selectBetweenSurround:function ()
{
    var end, s, start, surr

    if (surr = this.highlightsSurroundingCursor())
    {
        this.do.start()
        start = rangeEndPos(surr[0])
        end = rangeStartPos(surr[1])
        s = this.rangesForLinesBetweenPositions(start,end)
        s = cleanRanges(s)
        if (s.length)
        {
            this.do.select(s)
            if (this.do.numSelections())
            {
                this.do.setCursors([rangeEndPos(_.last(s))],{Main:'closest'})
            }
        }
        return this.do.end()
    }
},selectSurround:function ()
{
    var r, surr

    if (surr = this.highlightsSurroundingCursor())
    {
        this.do.start()
        this.do.select(surr)
        if (this.do.numSelections())
        {
            this.do.setCursors((function () { var _255__53_ = []; var list = _k_.list(this.do.selections()); for (var _255_53_ = 0; _255_53_ < list.length; _255_53_++)  { r = list[_255_53_];_255__53_.push(rangeEndPos(r))  } return _255__53_ }).bind(this)()({main:'closest'}))
        }
        return this.do.end()
    }
},selectNextHighlight:function ()
{
    var r, searchText, _267_57_, _274_33_

    if (!this.numHighlights() && (window != null))
    {
        searchText = (window.commandline.commands.find != null ? window.commandline.commands.find.currentText : undefined)
        if ((searchText != null ? searchText.length : undefined))
        {
            this.highlightText(searchText)
        }
    }
    if (!this.numHighlights())
    {
        return
    }
    r = rangeAfterPosInRanges(this.cursorPos(),this.highlights())
    r = (r != null ? r : this.highlight(0))
    if ((r != null))
    {
        this.selectSingleRange(r,{before:(r[2] != null ? r[2].clss : undefined) === 'close'})
        return (typeof this.scrollCursorIntoView === "function" ? this.scrollCursorIntoView() : undefined)
    }
},selectPrevHighlight:function ()
{
    var hs, r, searchText, _279_57_

    if (!this.numHighlights() && (window != null))
    {
        searchText = (window.commandline.commands.find != null ? window.commandline.commands.find.currentText : undefined)
        if ((searchText != null ? searchText.length : undefined))
        {
            this.highlightText(searchText)
        }
    }
    if (!this.numHighlights())
    {
        return
    }
    hs = this.highlights()
    r = rangeBeforePosInRanges(this.cursorPos(),hs)
    r = (r != null ? r : _.last(hs))
    if ((r != null))
    {
        return this.selectSingleRange(r)
    }
}}
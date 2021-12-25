// monsterkodi/kode 0.227.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var clamp, drag, elem, getStyle, MapScroll

clamp = require('kxk').clamp
drag = require('kxk').drag
elem = require('kxk').elem
getStyle = require('kxk').getStyle

MapScroll = require('./mapscroll')
class Minimap
{
    constructor (editor)
    {
        var minimapWidth, _40_56_

        this.editor = editor
    
        this.clearAll = this.clearAll.bind(this)
        this.onScroll = this.onScroll.bind(this)
        this.onEditorScroll = this.onEditorScroll.bind(this)
        this.onEditorViewHeight = this.onEditorViewHeight.bind(this)
        this.onEditorNumLines = this.onEditorNumLines.bind(this)
        this.onStart = this.onStart.bind(this)
        this.onDrag = this.onDrag.bind(this)
        this.onChanged = this.onChanged.bind(this)
        this.onVanishLines = this.onVanishLines.bind(this)
        this.onExposeLines = this.onExposeLines.bind(this)
        this.exposeLine = this.exposeLine.bind(this)
        this.drawTopBot = this.drawTopBot.bind(this)
        this.drawMainCursor = this.drawMainCursor.bind(this)
        this.drawCursors = this.drawCursors.bind(this)
        this.drawHighlights = this.drawHighlights.bind(this)
        this.drawLines = this.drawLines.bind(this)
        this.drawSelections = this.drawSelections.bind(this)
        minimapWidth = parseInt(getStyle('.minimap','width'))
        this.editor.layerScroll.style.right = `${minimapWidth}px`
        this.width = 2 * minimapWidth
        this.height = 8192
        this.offsetLeft = 6
        this.elem = elem({class:'minimap'})
        this.topbot = elem({class:'topbot'})
        this.selecti = elem('canvas',{class:'minimapSelections',width:this.width,height:this.height})
        this.lines = elem('canvas',{class:'minimapLines',width:this.width,height:this.height})
        this.highlig = elem('canvas',{class:'minimapHighlights',width:this.width,height:this.height})
        this.cursors = elem('canvas',{class:'minimapCursors',width:this.width,height:this.height})
        this.elem.appendChild(this.topbot)
        this.elem.appendChild(this.selecti)
        this.elem.appendChild(this.lines)
        this.elem.appendChild(this.highlig)
        this.elem.appendChild(this.cursors)
        this.elem.addEventListener('wheel',(this.editor.scrollbar != null ? this.editor.scrollbar.onWheel : undefined),{passive:true})
        this.editor.view.appendChild(this.elem)
        this.editor.on('viewHeight',this.onEditorViewHeight)
        this.editor.on('numLines',this.onEditorNumLines)
        this.editor.on('changed',this.onChanged)
        this.editor.on('highlight',this.drawHighlights)
        this.editor.scroll.on('scroll',this.onEditorScroll)
        this.scroll = new MapScroll({exposeMax:this.height / 4,lineHeight:4,viewHeight:2 * this.editor.viewHeight()})
        this.scroll.name = `${this.editor.name}.minimap`
        this.drag = new drag({target:this.elem,onStart:this.onStart,onMove:this.onDrag,cursor:'pointer'})
        this.scroll.on('clearLines',this.clearAll)
        this.scroll.on('scroll',this.onScroll)
        this.scroll.on('exposeLines',this.onExposeLines)
        this.scroll.on('vanishLines',this.onVanishLines)
        this.scroll.on('exposeLine',this.exposeLine)
        this.onScroll()
        this.drawLines()
        this.drawTopBot()
    }

    drawSelections ()
    {
        var ctx, offset, r, y

        this.selecti.height = this.height
        this.selecti.width = this.width
        if (this.scroll.exposeBot < 0)
        {
            return
        }
        ctx = this.selecti.getContext('2d')
        ctx.fillStyle = this.editor.syntax.colorForClassnames('selection')
        var list = _k_.list(rangesFromTopToBotInRanges(this.scroll.exposeTop,this.scroll.exposeBot,this.editor.selections()))
        for (var _85_14_ = 0; _85_14_ < list.length; _85_14_++)
        {
            r = list[_85_14_]
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight
            if (2 * r[1][0] < this.width)
            {
                offset = r[1][0] && this.offsetLeft || 0
                ctx.fillRect(offset + 2 * r[1][0],y,2 * (r[1][1] - r[1][0]),this.scroll.lineHeight)
                ctx.fillRect(260 - 6,y,2,this.scroll.lineHeight)
            }
        }
    }

    drawLines (top = this.scroll.exposeTop, bot = this.scroll.exposeBot)
    {
        var ctx, diss, li, r, y, _105_25_, _107_30_

        ctx = this.lines.getContext('2d')
        y = parseInt((top - this.scroll.exposeTop) * this.scroll.lineHeight)
        ctx.clearRect(0,y,this.width,((bot - this.scroll.exposeTop) - (top - this.scroll.exposeTop) + 1) * this.scroll.lineHeight)
        if (this.scroll.exposeBot < 0)
        {
            return
        }
        bot = Math.min(bot,this.editor.numLines() - 1)
        if (bot < top)
        {
            return
        }
        for (var _100_19_ = li = top, _100_24_ = bot; (_100_19_ <= _100_24_ ? li <= bot : li >= bot); (_100_19_ <= _100_24_ ? ++li : --li))
        {
            diss = this.editor.syntax.getDiss(li)
            y = parseInt((li - this.scroll.exposeTop) * this.scroll.lineHeight)
            var list = (diss != null ? diss : [])
            for (var _103_18_ = 0; _103_18_ < list.length; _103_18_++)
            {
                r = list[_103_18_]
                if (2 * r.start >= this.width)
                {
                    break
                }
                if ((r.clss != null))
                {
                    ctx.fillStyle = this.editor.syntax.colorForClassnames(r.clss + " minimap")
                }
                else if ((r.styl != null))
                {
                    ctx.fillStyle = this.editor.syntax.colorForStyle(r.styl)
                }
                ctx.fillRect(this.offsetLeft + 2 * r.start,y,2 * r.match.length,this.scroll.lineHeight)
            }
        }
    }

    drawHighlights ()
    {
        var ctx, r, y

        this.highlig.height = this.height
        this.highlig.width = this.width
        if (this.scroll.exposeBot < 0)
        {
            return
        }
        ctx = this.highlig.getContext('2d')
        ctx.fillStyle = this.editor.syntax.colorForClassnames('highlight')
        var list = _k_.list(rangesFromTopToBotInRanges(this.scroll.exposeTop,this.scroll.exposeBot,this.editor.highlights()))
        for (var _118_14_ = 0; _118_14_ < list.length; _118_14_++)
        {
            r = list[_118_14_]
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight
            if (2 * r[1][0] < this.width)
            {
                ctx.fillRect(this.offsetLeft + 2 * r[1][0],y,2 * (r[1][1] - r[1][0]),this.scroll.lineHeight)
            }
            ctx.fillRect(260 - 4,y,4,this.scroll.lineHeight)
        }
    }

    drawCursors ()
    {
        var ctx, r, y

        this.cursors.height = this.height
        this.cursors.width = this.width
        if (this.scroll.exposeBot < 0)
        {
            return
        }
        ctx = this.cursors.getContext('2d')
        var list = _k_.list(rangesFromTopToBotInRanges(this.scroll.exposeTop,this.scroll.exposeBot,rangesFromPositions(this.editor.cursors())))
        for (var _130_14_ = 0; _130_14_ < list.length; _130_14_++)
        {
            r = list[_130_14_]
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight
            if (2 * r[1][0] < this.width)
            {
                ctx.fillStyle = '#f80'
                ctx.fillRect(this.offsetLeft + 2 * r[1][0],y,2,this.scroll.lineHeight)
            }
            ctx.fillStyle = 'rgba(255,128,0,0.5)'
            ctx.fillRect(260 - 8,y,4,this.scroll.lineHeight)
        }
        return this.drawMainCursor()
    }

    drawMainCursor (blink)
    {
        var ctx, mc, y

        ctx = this.cursors.getContext('2d')
        ctx.fillStyle = blink && '#000' || '#ff0'
        mc = this.editor.mainCursor()
        y = (mc[1] - this.scroll.exposeTop) * this.scroll.lineHeight
        if (2 * mc[0] < this.width)
        {
            ctx.fillRect(this.offsetLeft + 2 * mc[0],y,2,this.scroll.lineHeight)
        }
        return ctx.fillRect(260 - 8,y,8,this.scroll.lineHeight)
    }

    drawTopBot ()
    {
        var lh, th, ty

        if (this.scroll.exposeBot < 0)
        {
            return
        }
        lh = this.scroll.lineHeight / 2
        th = (this.editor.scroll.bot - this.editor.scroll.top + 1) * lh
        ty = 0
        if (this.editor.scroll.scrollMax)
        {
            ty = (Math.min(0.5 * this.scroll.viewHeight,this.scroll.numLines * 2) - th) * this.editor.scroll.scroll / this.editor.scroll.scrollMax
        }
        this.topbot.style.height = `${th}px`
        return this.topbot.style.top = `${ty}px`
    }

    exposeLine (li)
    {
        return this.drawLines(li,li)
    }

    onExposeLines (e)
    {
        return this.drawLines(this.scroll.exposeTop,this.scroll.exposeBot)
    }

    onVanishLines (e)
    {
        var _174_16_

        if ((e.top != null))
        {
            return this.drawLines(this.scroll.exposeTop,this.scroll.exposeBot)
        }
        else
        {
            return this.clearRange(this.scroll.exposeBot,this.scroll.exposeBot + this.scroll.numLines)
        }
    }

    onChanged (changeInfo)
    {
        var change, li, _199_33_

        if (this.scroll.numLines !== this.editor.numLines() || (changeInfo.inserts || changeInfo.deletes))
        {
            this.scroll.setNumLines(0)
            this.scroll.setNumLines(this.editor.numLines())
            this.onEditorScroll()
            this.drawSelections()
            this.drawCursors()
            return
        }
        if (changeInfo.selects)
        {
            this.drawSelections()
        }
        if (changeInfo.cursors)
        {
            this.drawCursors()
        }
        var list = _k_.list(changeInfo.changes)
        for (var _198_19_ = 0; _198_19_ < list.length; _198_19_++)
        {
            change = list[_198_19_]
            li = ((_199_33_=change.oldIndex) != null ? _199_33_ : change.doIndex)
            this.drawLines(li,li)
        }
    }

    onDrag (drag, event)
    {
        var br, li, pc, ry

        if (this.scroll.fullHeight > this.scroll.viewHeight)
        {
            br = this.elem.getBoundingClientRect()
            ry = event.clientY - br.top
            pc = 2 * ry / this.scroll.viewHeight
            li = parseInt(pc * this.editor.scroll.numLines)
            return this.jumpToLine(li,event)
        }
        else
        {
            return this.jumpToLine(this.lineIndexForEvent(event),event)
        }
    }

    onStart (drag, event)
    {
        return this.jumpToLine(this.lineIndexForEvent(event),event)
    }

    jumpToLine (li, event)
    {
        var jumpTo

        jumpTo = (function ()
        {
            this.editor.scroll.to((li - 5) * this.editor.scroll.lineHeight)
            if (!event.metaKey)
            {
                this.editor.singleCursorAtPos([0,li + 5],{extend:event.shiftKey})
            }
            this.editor.focus()
            return this.onEditorScroll()
        }).bind(this)
        clearImmediate(this.jumpToTimer)
        return this.jumpToTimer = setImmediate(jumpTo)
    }

    lineIndexForEvent (event)
    {
        var br, li, ly, py, st

        st = this.elem.scrollTop
        br = this.elem.getBoundingClientRect()
        ly = clamp(0,this.elem.offsetHeight,event.clientY - br.top)
        py = parseInt(Math.floor(2 * ly / this.scroll.lineHeight)) + this.scroll.top
        li = parseInt(Math.min(this.scroll.numLines - 1,py))
        return li
    }

    onEditorNumLines (n)
    {
        if (n && this.lines.height <= this.scroll.lineHeight)
        {
            this.onEditorViewHeight(this.editor.viewHeight())
        }
        return this.scroll.setNumLines(n)
    }

    onEditorViewHeight (h)
    {
        this.scroll.setViewHeight(2 * this.editor.viewHeight())
        this.onScroll()
        return this.onEditorScroll()
    }

    onEditorScroll ()
    {
        var pc, tp

        if (this.scroll.fullHeight > this.scroll.viewHeight)
        {
            pc = this.editor.scroll.scroll / this.editor.scroll.scrollMax
            tp = parseInt(pc * this.scroll.scrollMax)
            this.scroll.to(tp)
        }
        return this.drawTopBot()
    }

    onScroll ()
    {
        var t, x, y

        y = parseInt(-this.height / 4 - this.scroll.offsetTop / 2)
        x = parseInt(this.width / 4)
        t = `translate3d(${x}px, ${y}px, 0px) scale3d(0.5, 0.5, 1)`
        this.selecti.style.transform = t
        this.highlig.style.transform = t
        this.cursors.style.transform = t
        return this.lines.style.transform = t
    }

    clearRange (top, bot)
    {
        var ctx

        ctx = this.lines.getContext('2d')
        return ctx.clearRect(0,(top - this.scroll.exposeTop) * this.scroll.lineHeight,2 * this.width,(bot - top) * this.scroll.lineHeight)
    }

    clearAll ()
    {
        this.selecti.width = this.selecti.width
        this.highlig.width = this.highlig.width
        this.cursors.width = this.cursors.width
        this.topbot.width = this.topbot.width
        this.lines.width = this.lines.width
        return this.topbot.style.height = '0'
    }
}

module.exports = Minimap
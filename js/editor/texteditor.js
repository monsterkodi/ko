// monsterkodi/kode 0.229.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, isFunc: function (o) {return typeof o === 'function'}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var $, drag, Editor, EditorScroll, elem, kerror, keyinfo, klog, kxk, os, post, prefs, render, stopEvent, TextEditor, _

kxk = require('kxk')
$ = kxk.$
_ = kxk._
drag = kxk.drag
elem = kxk.elem
kerror = kxk.kerror
keyinfo = kxk.keyinfo
klog = kxk.klog
os = kxk.os
post = kxk.post
prefs = kxk.prefs
stopEvent = kxk.stopEvent

render = require('./render')
EditorScroll = require('./editorscroll')
Editor = require('./editor')

TextEditor = (function ()
{
    _k_.extend(TextEditor, Editor)
    function TextEditor (viewElem, config)
    {
        var feature, featureClss, featureName, layer, name, _45_27_, _47_68_

        this["onKeyDown"] = this["onKeyDown"].bind(this)
        this["onClickTimeout"] = this["onClickTimeout"].bind(this)
        this["startClickTimer"] = this["startClickTimer"].bind(this)
        this["clear"] = this["clear"].bind(this)
        this["clearLines"] = this["clearLines"].bind(this)
        this["doBlink"] = this["doBlink"].bind(this)
        this["releaseBlink"] = this["releaseBlink"].bind(this)
        this["shiftLines"] = this["shiftLines"].bind(this)
        this["showLines"] = this["showLines"].bind(this)
        this["setFontSize"] = this["setFontSize"].bind(this)
        this["onSchemeChanged"] = this["onSchemeChanged"].bind(this)
        this["onBlur"] = this["onBlur"].bind(this)
        this["onFocus"] = this["onFocus"].bind(this)
        name = viewElem
        if (name[0] === '.')
        {
            name = name.slice(1)
        }
        TextEditor.__super__.constructor.call(this,name,config)
        this.view = $(viewElem)
        this.layers = elem({class:'layers'})
        this.layerScroll = elem({class:'layerScroll',child:this.layers,parent:this.view})
        layer = []
        layer.push('selections')
        layer.push('highlights')
        if (_k_.in('Meta',this.config.features))
        {
            layer.push('meta')
        }
        layer.push('lines')
        layer.push('cursors')
        if (_k_.in('Numbers',this.config.features))
        {
            layer.push('numbers')
        }
        this.initLayers(layer)
        this.size = {}
        this.elem = this.layerDict.lines
        this.spanCache = []
        this.lineDivs = {}
        this.config.lineHeight = ((_45_27_=this.config.lineHeight) != null ? _45_27_ : 1.2)
        this.setFontSize(prefs.get(`${this.name}FontSize`,((_47_68_=this.config.fontSize) != null ? _47_68_ : 19)))
        this.scroll = new EditorScroll(this)
        this.scroll.on('shiftLines',this.shiftLines)
        this.scroll.on('showLines',this.showLines)
        this.view.addEventListener('blur',this.onBlur)
        this.view.addEventListener('focus',this.onFocus)
        this.view.addEventListener('keydown',this.onKeyDown)
        this.initDrag()
        var list = _k_.list(this.config.features)
        for (var _58_20_ = 0; _58_20_ < list.length; _58_20_++)
        {
            feature = list[_58_20_]
            if (feature === 'CursorLine')
            {
                this.cursorLine = elem('div',{class:'cursor-line'})
            }
            else
            {
                featureName = feature.toLowerCase()
                featureClss = require(`./${featureName}`)
                this[featureName] = new featureClss(this)
            }
        }
        post.on('schemeChanged',this.onSchemeChanged)
    }

    TextEditor.prototype["del"] = function ()
    {
        var _78_18_

        post.removeListener('schemeChanged',this.onSchemeChanged)
        ;(this.scrollbar != null ? this.scrollbar.del() : undefined)
        this.view.removeEventListener('keydown',this.onKeyDown)
        this.view.removeEventListener('blur',this.onBlur)
        this.view.removeEventListener('focus',this.onFocus)
        this.view.innerHTML = ''
        return TextEditor.__super__.del.call(this)
    }

    TextEditor.prototype["onFocus"] = function ()
    {
        this.startBlink()
        this.emit('focus',this)
        return post.emit('editorFocus',this)
    }

    TextEditor.prototype["onBlur"] = function ()
    {
        this.stopBlink()
        return this.emit('blur',this)
    }

    TextEditor.prototype["onSchemeChanged"] = function ()
    {
        var updateMinimap, _106_15_

        ;(this.syntax != null ? this.syntax.schemeChanged() : undefined)
        if (this.minimap)
        {
            updateMinimap = (function ()
            {
                var _108_39_

                return (this.minimap != null ? this.minimap.drawLines() : undefined)
            }).bind(this)
            return setTimeout(updateMinimap,10)
        }
    }

    TextEditor.prototype["initLayers"] = function (layerClasses)
    {
        var cls

        this.layerDict = {}
        var list = _k_.list(layerClasses)
        for (var _120_16_ = 0; _120_16_ < list.length; _120_16_++)
        {
            cls = list[_120_16_]
            this.layerDict[cls] = this.addLayer(cls)
        }
    }

    TextEditor.prototype["addLayer"] = function (cls)
    {
        var div

        div = elem({class:cls})
        this.layers.appendChild(div)
        return div
    }

    TextEditor.prototype["updateLayers"] = function ()
    {
        this.renderHighlights()
        this.renderSelection()
        return this.renderCursors()
    }

    TextEditor.prototype["setLines"] = function (lines)
    {
        var viewHeight

        this.clearLines()
        lines = (lines != null ? lines : [])
        this.spanCache = []
        this.lineDivs = {}
        TextEditor.__super__.setLines.call(this,lines)
        this.scroll.reset()
        viewHeight = this.viewHeight()
        this.scroll.start(viewHeight,this.numLines())
        this.layerScroll.scrollLeft = 0
        this.layersWidth = this.layerScroll.offsetWidth
        this.layersHeight = this.layerScroll.offsetHeight
        return this.updateLayers()
    }

    TextEditor.prototype["appendText"] = function (text)
    {
        var appended, l, li, ls, showLines

        if (!(text != null))
        {
            console.log(`${this.name}.appendText - no text?`)
            return
        }
        appended = []
        ls = (text != null ? text.split(/\n/) : undefined)
        var list = _k_.list(ls)
        for (var _179_14_ = 0; _179_14_ < list.length; _179_14_++)
        {
            l = list[_179_14_]
            this.state = this.state.appendLine(l)
            appended.push(this.numLines() - 1)
        }
        if (this.scroll.viewHeight !== this.viewHeight())
        {
            this.scroll.setViewHeight(this.viewHeight())
        }
        showLines = (this.scroll.bot < this.scroll.top) || (this.scroll.bot < this.scroll.viewLines)
        this.scroll.setNumLines(this.numLines(),{showLines:showLines})
        var list1 = _k_.list(appended)
        for (var _190_15_ = 0; _190_15_ < list1.length; _190_15_++)
        {
            li = list1[_190_15_]
            this.emit('lineAppended',{lineIndex:li,text:this.line(li)})
        }
        this.emit('linesAppended',ls)
        return this.emit('numLines',this.numLines())
    }

    TextEditor.prototype["setFontSize"] = function (fontSize)
    {
        var _216_15_

        this.layers.style.fontSize = `${fontSize}px`
        this.size.numbersWidth = _k_.in('Numbers',this.config.features) && 50 || 0
        this.size.fontSize = fontSize
        this.size.lineHeight = Math.floor(fontSize * this.config.lineHeight)
        this.size.charWidth = fontSize * 0.6
        this.size.offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth)
        if (this.size.centerText)
        {
            this.centerText(false,0)
            this.centerText(true,0)
        }
        ;(this.scroll != null ? this.scroll.setLineHeight(this.size.lineHeight) : undefined)
        return this.emit('fontSizeChanged')
    }

    TextEditor.prototype["changed"] = function (changeInfo)
    {
        var ch, change, di, li, num

        this.syntax.changed(changeInfo)
        var list = _k_.list(changeInfo.changes)
        for (var _230_19_ = 0; _230_19_ < list.length; _230_19_++)
        {
            change = list[_230_19_]
            var _231_23_ = [change.doIndex,change.newIndex,change.change]; di = _231_23_[0]; li = _231_23_[1]; ch = _231_23_[2]

            switch (ch)
            {
                case 'changed':
                    this.updateLine(li,di)
                    this.emit('lineChanged',li)
                    break
                case 'deleted':
                    this.spanCache = this.spanCache.slice(0,di)
                    this.emit('lineDeleted',di)
                    break
                case 'inserted':
                    this.spanCache = this.spanCache.slice(0,di)
                    this.emit('lineInserted',li,di)
                    break
            }

        }
        if (changeInfo.inserts || changeInfo.deletes)
        {
            this.layersWidth = this.layerScroll.offsetWidth
            if (this.numLines() !== this.scroll.numLines)
            {
                this.scroll.setNumLines(this.numLines())
            }
            else
            {
                num = this.scroll.bot - this.scroll.top + 1
                this.showLines(this.scroll.top,this.scroll.bot,num)
            }
            this.updateLinePositions()
        }
        if (changeInfo.changes.length)
        {
            this.clearHighlights()
        }
        if (changeInfo.cursors)
        {
            this.renderCursors()
            this.scroll.cursorIntoView()
            this.emit('cursor')
            this.suspendBlink()
        }
        if (changeInfo.selects)
        {
            this.renderSelection()
            this.emit('selection')
        }
        return this.emit('changed',changeInfo)
    }

    TextEditor.prototype["updateLine"] = function (li, oi)
    {
        var div

        if (!(oi != null))
        {
            oi = li
        }
        if (li < this.scroll.top || li > this.scroll.bot)
        {
            if ((this.lineDivs[li] != null))
            {
                kerror(`dangling line div? ${li}`,this.lineDivs[li])
            }
            delete this.spanCache[li]
            return
        }
        if (!this.lineDivs[oi])
        {
            return kerror(`updateLine - out of bounds? li ${li} oi ${oi}`)
        }
        this.spanCache[li] = render.lineSpan(this.syntax.getDiss(li),this.size)
        div = this.lineDivs[oi]
        return div.replaceChild(this.spanCache[li],div.firstChild)
    }

    TextEditor.prototype["refreshLines"] = function (top, bot)
    {
        var li

        for (var _294_19_ = li = top, _294_24_ = bot; (_294_19_ <= _294_24_ ? li <= bot : li >= bot); (_294_19_ <= _294_24_ ? ++li : --li))
        {
            this.syntax.getDiss(li,true)
            this.updateLine(li)
        }
    }

    TextEditor.prototype["showLines"] = function (top, bot, num)
    {
        var li

        this.lineDivs = {}
        this.elem.innerHTML = ''
        for (var _309_19_ = li = top, _309_24_ = bot; (_309_19_ <= _309_24_ ? li <= bot : li >= bot); (_309_19_ <= _309_24_ ? ++li : --li))
        {
            this.appendLine(li)
        }
        this.updateLinePositions()
        this.updateLayers()
        return this.emit('linesShown',top,bot,num)
    }

    TextEditor.prototype["appendLine"] = function (li)
    {
        this.lineDivs[li] = elem({class:'line'})
        this.lineDivs[li].appendChild(this.cachedSpan(li))
        return this.elem.appendChild(this.lineDivs[li])
    }

    TextEditor.prototype["shiftLines"] = function (top, bot, num)
    {
        var divInto, oldBot, oldTop

        oldTop = top - num
        oldBot = bot - num
        divInto = (function (li, lo)
        {
            var span, tx

            if (!this.lineDivs[lo])
            {
                console.log(`${this.name}.shiftLines.divInto - no div? ${top} ${bot} ${num} old ${oldTop} ${oldBot} lo ${lo} li ${li}`)
                return
            }
            if (!_.isElement(this.lineDivs[lo]))
            {
                console.log(`${this.name}.shiftLines.divInto - no element? ${top} ${bot} ${num} old ${oldTop} ${oldBot} lo ${lo} li ${li}`)
                return
            }
            this.lineDivs[li] = this.lineDivs[lo]
            delete this.lineDivs[lo]
            this.lineDivs[li].replaceChild(this.cachedSpan(li),this.lineDivs[li].firstChild)
            if (this.showInvisibles)
            {
                tx = this.line(li).length * this.size.charWidth + 1
                span = elem('span',{class:"invisible newline",html:'&#9687'})
                span.style.transform = `translate(${tx}px, -1.5px)`
                return this.lineDivs[li].appendChild(span)
            }
        }).bind(this)
        if (num > 0)
        {
            while (oldBot < bot)
            {
                oldBot += 1
                divInto(oldBot,oldTop)
                oldTop += 1
            }
        }
        else
        {
            while (oldTop > top)
            {
                oldTop -= 1
                divInto(oldTop,oldBot)
                oldBot -= 1
            }
        }
        this.emit('linesShifted',top,bot,num)
        this.updateLinePositions()
        return this.updateLayers()
    }

    TextEditor.prototype["updateLinePositions"] = function (animate = 0)
    {
        var div, li, resetTrans, y, _378_25_

        for (li in this.lineDivs)
        {
            div = this.lineDivs[li]
            if (((div != null ? div.style : undefined) != null))
            {
                y = this.size.lineHeight * (li - this.scroll.top)
                div.style.transform = `translate3d(${this.size.offsetX}px,${y}px, 0)`
                if (animate)
                {
                    div.style.transition = `all ${animate / 1000}s`
                }
                div.style.zIndex = li
            }
        }
        if (animate)
        {
            resetTrans = (function ()
            {
                var c

                var list = _k_.list(this.elem.children)
                for (var _386_22_ = 0; _386_22_ < list.length; _386_22_++)
                {
                    c = list[_386_22_]
                    c.style.transition = 'initial'
                }
            }).bind(this)
            return setTimeout(resetTrans,animate)
        }
    }

    TextEditor.prototype["updateLines"] = function ()
    {
        var li

        for (var _392_19_ = li = this.scroll.top, _392_32_ = this.scroll.bot; (_392_19_ <= _392_32_ ? li <= this.scroll.bot : li >= this.scroll.bot); (_392_19_ <= _392_32_ ? ++li : --li))
        {
            this.updateLine(li)
        }
    }

    TextEditor.prototype["clearHighlights"] = function ()
    {
        if (this.numHighlights())
        {
            $('.highlights',this.layers).innerHTML = ''
            return TextEditor.__super__.clearHighlights.call(this)
        }
    }

    TextEditor.prototype["cachedSpan"] = function (li)
    {
        if (!this.spanCache[li])
        {
            this.spanCache[li] = render.lineSpan(this.syntax.getDiss(li),this.size)
        }
        return this.spanCache[li]
    }

    TextEditor.prototype["renderCursors"] = function ()
    {
        var c, cs, cursorLine, html, line, mc, ri, ty, vc

        cs = []
        var list = _k_.list(this.cursors())
        for (var _418_14_ = 0; _418_14_ < list.length; _418_14_++)
        {
            c = list[_418_14_]
            if (c[1] >= this.scroll.top && c[1] <= this.scroll.bot)
            {
                cs.push([c[0],c[1] - this.scroll.top])
            }
        }
        mc = this.mainCursor()
        if (this.numCursors() === 1)
        {
            if (cs.length === 1)
            {
                if (mc[1] < 0)
                {
                    return
                }
                if (mc[1] > this.numLines() - 1)
                {
                    return kerror(`${this.name}.renderCursors mainCursor DAFUK?`,this.numLines(),str(this.mainCursor()))
                }
                ri = mc[1] - this.scroll.top
                cursorLine = this.state.line(mc[1])
                if (!(cursorLine != null))
                {
                    return kerror('no main cursor line?')
                }
                if (mc[0] > cursorLine.length)
                {
                    cs[0][2] = 'virtual'
                    cs.push([cursorLine.length,ri,'main off'])
                }
                else
                {
                    cs[0][2] = 'main off'
                }
            }
        }
        else if (this.numCursors() > 1)
        {
            vc = []
            var list1 = _k_.list(cs)
            for (var _445_18_ = 0; _445_18_ < list1.length; _445_18_++)
            {
                c = list1[_445_18_]
                if (isSamePos(this.mainCursor(),[c[0],c[1] + this.scroll.top]))
                {
                    c[2] = 'main'
                }
                line = this.line(this.scroll.top + c[1])
                if (c[0] > line.length)
                {
                    vc.push([line.length,c[1],'virtual'])
                }
            }
            cs = cs.concat(vc)
        }
        html = render.cursors(cs,this.size)
        this.layerDict.cursors.innerHTML = html
        ty = (mc[1] - this.scroll.top) * this.size.lineHeight
        if (this.cursorLine)
        {
            this.cursorLine.style = `z-index:0;transform:translate3d(0,${ty}px,0); height:${this.size.lineHeight}px;`
            return this.layers.insertBefore(this.cursorLine,this.layers.firstChild)
        }
    }

    TextEditor.prototype["renderSelection"] = function ()
    {
        var h, s

        h = ""
        s = this.selectionsInLineIndexRangeRelativeToLineIndex([this.scroll.top,this.scroll.bot],this.scroll.top)
        if (s)
        {
            h += render.selection(s,this.size)
        }
        return this.layerDict.selections.innerHTML = h
    }

    TextEditor.prototype["renderHighlights"] = function ()
    {
        var h, s

        h = ""
        s = this.highlightsInLineIndexRangeRelativeToLineIndex([this.scroll.top,this.scroll.bot],this.scroll.top)
        if (s)
        {
            h += render.selection(s,this.size,"highlight")
        }
        return this.layerDict.highlights.innerHTML = h
    }

    TextEditor.prototype["cursorDiv"] = function ()
    {
        return $('.cursor.main',this.layerDict['cursors'])
    }

    TextEditor.prototype["suspendBlink"] = function ()
    {
        var blinkDelay, _490_20_

        if (!this.blinkTimer)
        {
            return
        }
        this.stopBlink()
        ;(this.cursorDiv() != null ? this.cursorDiv().classList.toggle('blink',false) : undefined)
        clearTimeout(this.suspendTimer)
        blinkDelay = prefs.get('cursorBlinkDelay',[800,200])
        return this.suspendTimer = setTimeout(this.releaseBlink,blinkDelay[0])
    }

    TextEditor.prototype["releaseBlink"] = function ()
    {
        clearTimeout(this.suspendTimer)
        delete this.suspendTimer
        return this.startBlink()
    }

    TextEditor.prototype["toggleBlink"] = function ()
    {
        var blink

        blink = !prefs.get('blink',false)
        prefs.set('blink',blink)
        if (blink)
        {
            return this.startBlink()
        }
        else
        {
            return this.stopBlink()
        }
    }

    TextEditor.prototype["doBlink"] = function ()
    {
        var blinkDelay, _514_20_, _515_16_

        this.blink = !this.blink
        ;(this.cursorDiv() != null ? this.cursorDiv().classList.toggle('blink',this.blink) : undefined)
        ;(this.minimap != null ? this.minimap.drawMainCursor(this.blink) : undefined)
        clearTimeout(this.blinkTimer)
        blinkDelay = prefs.get('cursorBlinkDelay',[800,200])
        return this.blinkTimer = setTimeout(this.doBlink,this.blink && blinkDelay[1] || blinkDelay[0])
    }

    TextEditor.prototype["startBlink"] = function ()
    {
        if (!this.blinkTimer && prefs.get('blink'))
        {
            return this.doBlink()
        }
    }

    TextEditor.prototype["stopBlink"] = function ()
    {
        var _528_20_

        ;(this.cursorDiv() != null ? this.cursorDiv().classList.toggle('blink',false) : undefined)
        clearTimeout(this.blinkTimer)
        return delete this.blinkTimer
    }

    TextEditor.prototype["resized"] = function ()
    {
        var vh

        vh = this.view.clientHeight
        if (vh === this.scroll.viewHeight)
        {
            return
        }
        if (this.numbers)
        {
            this.numbers.elem.style.height = `${this.scroll.exposeNum * this.scroll.lineHeight}px`
        }
        this.layersWidth = this.layerScroll.offsetWidth
        this.scroll.setViewHeight(vh)
        return this.emit('viewHeight',vh)
    }

    TextEditor.prototype["posAtXY"] = function (x, y)
    {
        var br, lx, ly, p, px, py, sl, st

        sl = this.layerScroll.scrollLeft
        st = this.scroll.offsetTop
        br = this.view.getBoundingClientRect()
        lx = _k_.clamp(0,this.layers.offsetWidth,x - br.left - this.size.offsetX + this.size.charWidth / 3)
        ly = _k_.clamp(0,this.layers.offsetHeight,y - br.top)
        px = parseInt(Math.floor((Math.max(0,sl + lx)) / this.size.charWidth))
        py = parseInt(Math.floor((Math.max(0,st + ly)) / this.size.lineHeight)) + this.scroll.top
        p = [px,Math.min(this.numLines() - 1,py)]
        return p
    }

    TextEditor.prototype["posForEvent"] = function (event)
    {
        return this.posAtXY(event.clientX,event.clientY)
    }

    TextEditor.prototype["lineElemAtXY"] = function (x, y)
    {
        var p

        p = this.posAtXY(x,y)
        return this.lineDivs[p[1]]
    }

    TextEditor.prototype["lineSpanAtXY"] = function (x, y)
    {
        var br, e, lineElem, lr, offset

        if (lineElem = this.lineElemAtXY(x,y))
        {
            lr = lineElem.getBoundingClientRect()
            var list = _k_.list(lineElem.firstChild.children)
            for (var _581_18_ = 0; _581_18_ < list.length; _581_18_++)
            {
                e = list[_581_18_]
                br = e.getBoundingClientRect()
                if ((br.left <= x && x <= br.left + br.width))
                {
                    offset = x - br.left
                    return {span:e,offsetLeft:offset,offsetChar:parseInt(offset / this.size.charWidth)}
                }
            }
        }
        return null
    }

    TextEditor.prototype["numFullLines"] = function ()
    {
        return this.scroll.fullLines
    }

    TextEditor.prototype["viewHeight"] = function ()
    {
        var _592_18_, _593_13_

        if ((this.scroll != null ? this.scroll.viewHeight : undefined) >= 0)
        {
            return this.scroll.viewHeight
        }
        return (this.view != null ? this.view.clientHeight : undefined)
    }

    TextEditor.prototype["clearLines"] = function ()
    {
        this.elem.innerHTML = ''
        return this.emit('clearLines')
    }

    TextEditor.prototype["clear"] = function ()
    {
        return this.setLines([])
    }

    TextEditor.prototype["focus"] = function ()
    {
        return this.view.focus()
    }

    TextEditor.prototype["initDrag"] = function ()
    {
        return this.drag = new drag({target:this.layerScroll,onStart:(function (drag, event)
        {
            var eventPos, p, r, range

            this.view.focus()
            eventPos = this.posForEvent(event)
            if (event.button === 2)
            {
                return 'skip'
            }
            else if (event.button === 1)
            {
                if (!this.jumpToFileAtPos(eventPos))
                {
                    this.jumpToWordAtPos(eventPos)
                }
                stopEvent(event)
                return 'skip'
            }
            if (this.clickCount)
            {
                if (isSamePos(eventPos,this.clickPos))
                {
                    this.startClickTimer()
                    this.clickCount += 1
                    if (this.clickCount === 2)
                    {
                        range = this.rangeForWordAtPos(eventPos)
                        if (event.metaKey || this.stickySelection)
                        {
                            this.addRangeToSelection(range)
                        }
                        else
                        {
                            this.highlightWordAndAddToSelection()
                        }
                    }
                    if (this.clickCount === 3)
                    {
                        this.clearHighlights()
                        r = this.rangeForLineAtIndex(this.clickPos[1])
                        if (event.metaKey)
                        {
                            this.addRangeToSelection(r)
                        }
                        else
                        {
                            this.selectSingleRange(r)
                        }
                    }
                    return
                }
                else
                {
                    this.onClickTimeout()
                }
            }
            this.clickCount = 1
            this.clickPos = eventPos
            this.startClickTimer()
            p = this.posForEvent(event)
            return this.clickAtPos(p,event)
        }).bind(this),onMove:(function (drag, event)
        {
            var p

            p = this.posForEvent(event)
            if (event.metaKey)
            {
                return this.addCursorAtPos([this.mainCursor()[0],p[1]])
            }
            else
            {
                return this.singleCursorAtPos(p,{extend:true})
            }
        }).bind(this),onStop:(function ()
        {
            if (this.numSelections() && _k_.empty(this.textOfSelection()))
            {
                return this.selectNone()
            }
        }).bind(this)})
    }

    TextEditor.prototype["startClickTimer"] = function ()
    {
        clearTimeout(this.clickTimer)
        return this.clickTimer = setTimeout(this.onClickTimeout,this.stickySelection && 300 || 1000)
    }

    TextEditor.prototype["onClickTimeout"] = function ()
    {
        clearTimeout(this.clickTimer)
        this.clickCount = 0
        this.clickTimer = null
        return this.clickPos = null
    }

    TextEditor.prototype["funcInfoAtLineIndex"] = function (li)
    {
        var fileInfo, files, func

        files = post.get('indexer','files',this.currentFile)
        fileInfo = files[this.currentFile]
        var list = _k_.list(fileInfo.funcs)
        for (var _684_17_ = 0; _684_17_ < list.length; _684_17_++)
        {
            func = list[_684_17_]
            if ((func.line <= li && li <= func.last))
            {
                return func.class + '.' + func.name + ' '
            }
        }
        return ''
    }

    TextEditor.prototype["clickAtPos"] = function (p, event)
    {
        if (event.altKey)
        {
            return this.toggleCursorAtPos(p)
        }
        else if (event.metaKey || event.ctrlKey)
        {
            return this.jumpToWordAtPos(p)
        }
        else
        {
            return this.singleCursorAtPos(p,{extend:event.shiftKey})
        }
    }

    TextEditor.prototype["handleModKeyComboCharEvent"] = function (mod, key, combo, char, event)
    {
        var action, actionCombo, _712_24_, _742_28_, _745_37_, _749_41_, _755_33_

        if ((this.autocomplete != null))
        {
            if ('unhandled' !== this.autocomplete.handleModKeyComboEvent(mod,key,combo,event))
            {
                return
            }
        }
        switch (combo)
        {
            case 'backspace':
                return 'unhandled'

            case 'esc':
                this.setSalterMode(false)
                this.clearHighlights()
                this.clearCursors()
                this.endStickySelection()
                this.selectNone()
                return

            case 'command+enter':
            case 'ctrl+enter':
            case 'f12':
                if (this.name === 'editor')
                {
                    return this.jumpToWord()
                }
                break
        }

        var list = _k_.list(Editor.actions)
        for (var _732_19_ = 0; _732_19_ < list.length; _732_19_++)
        {
            action = list[_732_19_]
            if (action.combo === combo || action.accel === combo && os.platform() !== 'darwin')
            {
                switch (combo)
                {
                    case 'ctrl+a':
                    case 'command+a':
                        return this.selectAll()

                }

                return 'unhandled'
            }
            if ((action.accels != null) && os.platform() !== 'darwin')
            {
                var list1 = _k_.list(action.accels)
                for (var _743_32_ = 0; _743_32_ < list1.length; _743_32_++)
                {
                    actionCombo = list1[_743_32_]
                    if (combo === actionCombo)
                    {
                        if ((action.key != null) && _k_.isFunc(this[action.key]))
                        {
                            this[action.key](key,{combo:combo,mod:mod,event:event})
                            return
                        }
                    }
                }
            }
            if (!(action.combos != null))
            {
                continue
            }
            var list2 = _k_.list(action.combos)
            for (var _751_28_ = 0; _751_28_ < list2.length; _751_28_++)
            {
                actionCombo = list2[_751_28_]
                if (combo === actionCombo)
                {
                    if ((action.key != null) && _k_.isFunc(this[action.key]))
                    {
                        this[action.key](key,{combo:combo,mod:mod,event:event})
                        return
                    }
                }
            }
        }
        if (char && _k_.in(mod,["shift",""]))
        {
            return this.insertCharacter(char)
        }
        return 'unhandled'
    }

    TextEditor.prototype["onKeyDown"] = function (event)
    {
        var char, combo, key, mod, result

        mod = keyinfo.forEvent(event).mod
        key = keyinfo.forEvent(event).key
        combo = keyinfo.forEvent(event).combo
        char = keyinfo.forEvent(event).char

        if (!combo)
        {
            return
        }
        if (key === 'right click')
        {
            return
        }
        result = this.handleModKeyComboCharEvent(mod,key,combo,char,event)
        if ('unhandled' !== result)
        {
            return stopEvent(event)
        }
    }

    TextEditor.prototype["log"] = function ()
    {
        if (this.name !== 'editor')
        {
            return
        }
        klog.slog.depth = 3
        klog.apply(klog,[].splice.call(arguments,0))
        return klog.slog.depth = 2
    }

    return TextEditor
})()

module.exports = TextEditor
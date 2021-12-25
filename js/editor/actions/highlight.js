// monsterkodi/kode 0.227.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var kxk, post, _

kxk = require('kxk')
_ = kxk._
post = kxk.post

module.exports = {actions:{menu:'Select',highlightWordAndAddToSelection:{name:'Highlight and Select Word',text:'highlights all occurrences of text in selection or word at cursor and selects the first|next highlight.',combo:'command+d',accel:'ctrl+d'},selectAllWords:{name:'Select All Words',combo:'command+alt+d',accel:'alt+ctrl+d'},removeSelectedHighlight:{name:'Remove Highlighted Word from Selection',text:"does the inverse of 'highlight and select' word",combo:'command+shift+d',accel:'ctrl+shift+d'},highlightTextOfSelectionOrWordAtCursor:{name:'Highlight and Select Word',text:'highlights all occurrences of text in selection or word at cursor and selects it. expands to the left if already selected.',combo:'command+e',accel:'ctrl+e'}},highlightText:function (text, opt)
{
    var hls, _50_90_, _51_91_

    hls = this.rangesForText(text,opt)
    if (hls.length && (opt != null ? opt.select : undefined))
    {
        switch (opt.select)
        {
            case 'after':
                this.selectSingleRange(((_50_90_=rangeAfterPosInRanges(this.cursorPos(),hls)) != null ? _50_90_ : _.first(hls)))
                break
            case 'before':
                this.selectSingleRange(((_51_91_=rangeBeforePosInRanges(this.cursorPos(),hls)) != null ? _51_91_ : _.first(hls)))
                break
            case 'first':
                this.selectSingleRange(_.first(hls))
                break
        }

    }
    this.setHighlights(hls)
    this.renderHighlights()
    return this.emit('highlight')
},wordHighlights:function ()
{
    return this.highlights().filter(function (h)
    {
        var _63_111_, _63_65_

        return !(h[2] != null ? (_63_65_=h[2].clss) != null ? _63_65_.startsWith('stringmatch') : undefined : undefined) && !(h[2] != null ? (_63_111_=h[2].clss) != null ? _63_111_.startsWith('bracketmatch') : undefined : undefined)
    })
},selectAllWords:function ()
{
    var editor, _68_42_, _68_51_

    if (this.name === 'commandline-editor')
    {
        if (editor = ((_68_42_=window.commandline) != null ? (_68_51_=_68_42_.command) != null ? _68_51_.receivingEditor() : undefined : undefined))
        {
            editor.selectAllWords()
            editor.focus()
            return
        }
    }
    this.highlightWordAndAddToSelection()
    this.do.start()
    this.do.select(this.do.highlights())
    if (this.do.numSelections())
    {
        this.do.setCursors(endPositionsFromRanges(this.do.selections()),{main:'closest'})
    }
    return this.do.end()
},highlightWordAndAddToSelection:function ()
{
    var cp, cursorInWordHighlight, r, sr, wordHighlights

    cp = this.cursorPos()
    wordHighlights = this.wordHighlights()
    cursorInWordHighlight = wordHighlights.length && rangeAtPosInRanges(cp,wordHighlights)
    if (!cursorInWordHighlight)
    {
        return this.highlightTextOfSelectionOrWordAtCursor()
    }
    else
    {
        this.do.start()
        sr = rangeAtPosInRanges(cp,this.do.selections())
        if (sr)
        {
            r = rangeAfterPosInRanges(cp,wordHighlights)
        }
        else
        {
            r = rangeAtPosInRanges(cp,wordHighlights)
        }
        r = (r != null ? r : wordHighlights[0])
        this.addRangeToSelection(r)
        return this.do.end()
    }
},highlightTextOfSelectionOrWordAtCursor:function ()
{
    var largerRange, largerText, nr, nt, sel, srange, text, _140_32_

    if (this.numSelections() === 0)
    {
        srange = this.rangeForRealWordAtPos(this.cursorPos())
        if (_k_.empty(this.textInRange(srange).trim()))
        {
            this.clearHighlights()
            this.selectNone()
            return
        }
        this.selectSingleRange(srange)
    }
    sel = this.selection(0)
    text = this.textInRange(sel)
    if (text.length)
    {
        if (this.numHighlights())
        {
            if (text === this.textInRange(this.highlight(0)))
            {
                largerRange = [sel[0],[sel[1][0] - 1,sel[1][1]]]
                largerText = this.textInRange(largerRange)
                if (_k_.in(largerText[0],"@#$%&*+-!?:.'\"/") || /[A-Za-z]/.test(largerText[0]))
                {
                    if (_k_.in(largerText[0],"'\""))
                    {
                        nr = [sel[0],[sel[1][0] - 1,sel[1][1] + 1]]
                        nt = this.textInRange(nr)
                        if (nt[nt.length - 1] === largerText[0])
                        {
                            largerText = nt
                            largerRange = nr
                        }
                    }
                    else if (/[A-Za-z]/.test(largerText[0]))
                    {
                        while (largerRange[1][0] > 0 && /[A-Za-z]/.test(this.line(largerRange[0])[largerRange[1][0] - 1]))
                        {
                            largerRange[1][0] -= 1
                            largerText = this.textInRange(largerRange)
                        }
                    }
                    text = largerText
                    if (this.numSelections() === 1)
                    {
                        this.selectSingleRange(largerRange)
                    }
                }
            }
        }
        this.setHighlights(this.rangesForText(text,{max:9999}))
        if ((this.renderHighlights != null))
        {
            this.renderHighlights()
            this.emit('highlight')
            post.emit('searchText',text)
            return this.focus()
        }
    }
},clearHighlights:function ()
{
    if (this.numHighlights())
    {
        this.setHighlights([])
        return this.emit('highlight')
    }
},removeSelectedHighlight:function ()
{
    var cp, hr, sel, sr

    cp = this.cursorPos()
    sel = this.selections()
    sr = rangeAtPosInRanges(cp,sel)
    hr = rangeAtPosInRanges(cp,this.highlights())
    if (sr && hr)
    {
        return this.removeSelectionAtIndex(sel.indexOf(sr))
    }
}}
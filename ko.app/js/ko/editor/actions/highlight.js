var _k_ = {first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

import kxk from "../../../kxk.js"
let post = kxk.post

export default {actions:{menu:'Select',highlightWordAndAddToSelection:{name:'Highlight and Select Word',text:'highlights all occurrences of text in selection or word at cursor and selects the first|next highlight.',combo:'command+d'},selectAllWords:{name:'Select All Words',combo:'command+alt+d'},removeSelectedHighlight:{name:'Remove Highlighted Word from Selection',text:"does the inverse of 'highlight and select' word",combo:'command+shift+d'},highlightTextOfSelectionOrWordAtCursor:{name:'Highlight and Select Word',text:'highlights all occurrences of text in selection or word at cursor and selects it.',combo:'command+e'}},highlightText:function (text, opt)
{
    var hls, _45_90_, _46_91_

    hls = this.rangesForText(text,opt)
    if (hls.length && (opt != null ? opt.select : undefined))
    {
        switch (opt.select)
        {
            case 'after':
                this.selectSingleRange(((_45_90_=rangeAfterPosInRanges(this.cursorPos(),hls)) != null ? _45_90_ : _k_.first(hls)))
                break
            case 'before':
                this.selectSingleRange(((_46_91_=rangeBeforePosInRanges(this.cursorPos(),hls)) != null ? _46_91_ : _k_.first(hls)))
                break
            case 'first':
                this.selectSingleRange(_k_.first(hls))
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
        var _58_111_, _58_65_

        return !(h[2] != null ? (_58_65_=h[2].clss) != null ? _58_65_.startsWith('stringmatch') : undefined : undefined) && !(h[2] != null ? (_58_111_=h[2].clss) != null ? _58_111_.startsWith('bracketmatch') : undefined : undefined)
    })
},selectAllWords:function ()
{
    var editor, _63_42_, _63_51_

    if (this.name === 'commandline-editor')
    {
        if (editor = ((_63_42_=window.commandline) != null ? (_63_51_=_63_42_.command) != null ? _63_51_.receivingEditor() : undefined : undefined))
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
    var sel, srange, text, _116_32_

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
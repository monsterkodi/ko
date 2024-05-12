var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

import kxk from "../../kxk.js"
let pretty = kxk.pretty
let post = kxk.post
let elem = kxk.elem
let tooltip = kxk.tooltip
let $ = kxk.$

class Info
{
    constructor (editor)
    {
        var ttip

        this.onHighlight = this.onHighlight.bind(this)
        this.onSelection = this.onSelection.bind(this)
        this.onCursor = this.onCursor.bind(this)
        this.onNumLines = this.onNumLines.bind(this)
        this.reload = this.reload.bind(this)
        this.setEditor = this.setEditor.bind(this)
        this.updateEditorButton = this.updateEditorButton.bind(this)
        this.changeEditorFocus = this.changeEditorFocus.bind(this)
        post.on('editorFocus',this.setEditor)
        post.on('split',this.updateEditorButton)
        ttip = function (e, t)
        {
            return new tooltip({elem:e,text:t,x:0,y:1,textSize:11,keep:true})
        }
        this.elem = $('info')
        this.topline = elem({class:"info-line top"})
        this.cursorColumn = elem('span',{class:"info-cursor-column"})
        this.cursorColumn.onclick = (function ()
        {
            return this.editor.focus() + this.editor.singleCursorAtPos([0,this.editor.cursorPos()[1]])
        }).bind(this)
        this.topline.appendChild(this.cursorColumn)
        ttip(this.cursorColumn,'x')
        this.sticky = elem('span',{class:"info-sticky empty"})
        this.sticky.innerHTML = '○'
        this.topline.appendChild(this.sticky)
        this.cursors = elem('span',{class:"info-cursors"})
        this.cursors.onclick = (function ()
        {
            return this.editor.focus() + this.editor.clearCursors()
        }).bind(this)
        this.topline.appendChild(this.cursors)
        ttip(this.cursors,'cursors')
        this.selecti = elem('span',{class:"info-selections"})
        this.selecti.onclick = (function ()
        {
            return this.editor.focus() + this.editor.selectNone()
        }).bind(this)
        this.topline.appendChild(this.selecti)
        ttip(this.selecti,'selections')
        this.highlig = elem('span',{class:"info-highlights"})
        this.highlig.onclick = (function ()
        {
            return this.editor.focus() + this.editor.clearHighlights()
        }).bind(this)
        this.topline.appendChild(this.highlig)
        ttip(this.highlig,'highlights')
        this.elem.appendChild(this.topline)
        this.botline = elem({class:"info-line bot"})
        this.cursorLine = elem('span',{class:"info-cursor-line"})
        this.cursorLine.onclick = (function ()
        {
            return this.editor.focus() + this.editor.singleCursorAtPos([0,0])
        }).bind(this)
        this.botline.appendChild(this.cursorLine)
        ttip(this.cursorLine,'y')
        this.lines = elem('span',{class:"info-lines"})
        this.lines.onclick = (function ()
        {
            return this.editor.focus() + this.editor.singleCursorAtPos([0,this.editor.numLines()])
        }).bind(this)
        this.botline.appendChild(this.lines)
        ttip(this.lines,'lines')
        this.elem.appendChild(this.botline)
        this.infoEditor = elem({class:'info-editor',click:this.changeEditorFocus})
        this.elem.appendChild(this.infoEditor)
        this.setEditor(editor)
    }

    changeEditorFocus ()
    {
        if (!window.split.editorMaximized())
        {
            window.split.do('maximize editor')
            return window.split.do('focus editor')
        }
        else
        {
            return window.split.do('half editor')
        }
    }

    updateEditorButton ()
    {
        this.infoEditor.classList.toggle('terminal-icon',window.split.editorMaximized())
        return this.infoEditor.classList.toggle('editor-icon',!window.split.editorMaximized())
    }

    setEditor (editor)
    {
        var _113_18_

        if (!(_k_.in(editor.name,['editor','terminal'])))
        {
            return
        }
        if (editor === this.editor)
        {
            return
        }
        if ((this.editor != null))
        {
            this.editor.removeListener('numLines',this.onNumLines)
            this.editor.removeListener('lineInserted',this.onNumLines)
            this.editor.removeListener('lineDeleted',this.onNumLines)
            this.editor.removeListener('selection',this.onSelection)
            this.editor.removeListener('highlight',this.onHighlight)
            this.editor.removeListener('cursor',this.onCursor)
        }
        this.editor = editor
        this.editor.on('numLines',this.onNumLines)
        this.editor.on('lineInserted',this.onNumLines)
        this.editor.on('lineDeleted',this.onNumLines)
        this.editor.on('selection',this.onSelection)
        this.editor.on('highlight',this.onHighlight)
        this.editor.on('cursor',this.onCursor)
        return this.onNumLines(this.editor.numLines())
    }

    reload ()
    {}

    onNumLines (lc)
    {
        return this.lines.textContent = pretty.shortCount((lc != null ? lc : 0))
    }

    onCursor ()
    {
        this.cursorLine.textContent = this.editor.mainCursor()[1] + 1
        this.cursorColumn.textContent = ((this.editor.mainCursor()[0] > 0) ? this.editor.mainCursor()[0] : '')
        this.cursors.textContent = this.editor.numCursors()
        this.cursorColumn.classList.toggle('virtual',this.editor.isCursorVirtual())
        this.cursors.classList.toggle('empty',this.editor.numCursors() === 1)
        return this.sticky.classList.toggle('empty',!this.editor.stickySelection)
    }

    onSelection ()
    {
        this.selecti.textContent = this.editor.numSelections()
        this.selecti.classList.toggle('empty',this.editor.numSelections() === 0)
        return this.sticky.classList.toggle('empty',!this.editor.stickySelection)
    }

    onHighlight ()
    {
        this.highlig.textContent = this.editor.numHighlights()
        return this.highlig.classList.toggle('empty',this.editor.numHighlights() === 0)
    }
}

export default Info;
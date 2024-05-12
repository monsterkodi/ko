var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var FuncList

import kxk from "../../kxk.js"
let drag = kxk.drag
let elem = kxk.elem
let post = kxk.post

import FuncItems from "../tools/FuncItems.js"
import Indexer from "../tools/Indexer.js"

import Syntax from "./Syntax.js"


FuncList = (function ()
{
    function FuncList (editor)
    {
        this.editor = editor
    
        this["onFileIndexed"] = this["onFileIndexed"].bind(this)
        this["onEditorFile"] = this["onEditorFile"].bind(this)
        this["onEditorScrollOrCursor"] = this["onEditorScrollOrCursor"].bind(this)
        this["onSplit"] = this["onSplit"].bind(this)
        this["onDragMove"] = this["onDragMove"].bind(this)
        this.elem = elem({class:'funclist'})
        this.editor.view.appendChild(this.elem)
        this.editor.scroll.on('scroll',this.onEditorScrollOrCursor)
        this.editor.on('cursor',this.onEditorScrollOrCursor)
        post.on('fileIndexed',this.onFileIndexed)
        post.on('split',this.onSplit)
        post.on('list.toggle',this.onSplit)
        kore.on('editor|file',this.onEditorFile)
        this.drag = new drag({target:this.elem,onStart:this.onDragMove,onMove:this.onDragMove})
        this.onSplit()
    }

    FuncList.prototype["onDragMove"] = function (drag, event)
    {
        var item, listitem

        listitem = elem.upElem(event,{prop:'item'})
        if (item = (listitem != null ? listitem.item : undefined))
        {
            return post.emit('singleCursorAtPos',[4,item.line - 1])
        }
    }

    FuncList.prototype["onSplit"] = function ()
    {
        var browserVisible, funclistActive, hide

        browserVisible = window.split.browserVisible() && prefs.get('funclist|hideWhenBrowsing',false)
        funclistActive = prefs.get('list|active',true)
        hide = browserVisible || !funclistActive
        this.elem.style.display = (hide ? 'none' : 'inherit')
        return this.onEditorScrollOrCursor()
    }

    FuncList.prototype["onEditorScrollOrCursor"] = function ()
    {
        var botLine, child, inside, lastLine, mainLine, scroll, topLine, visible

        scroll = this.editor.scroll.scroll
        topLine = parseInt(scroll / this.editor.scroll.lineHeight)
        botLine = topLine + this.editor.numFullLines()
        mainLine = this.editor.mainCursor()[1] + 1
        var list = _k_.list(this.elem.children)
        for (var _72_18_ = 0; _72_18_ < list.length; _72_18_++)
        {
            child = list[_72_18_]
            lastLine = (child.nextSibling ? child.nextSibling.item.line : this.editor.numLines())
            visible = lastLine - 1 > topLine && child.item.line <= botLine
            child.classList.toggle('visible',visible)
            if (visible)
            {
                child.scrollIntoViewIfNeeded()
            }
            inside = child.item.line <= mainLine && lastLine > mainLine
            child.classList.toggle('inside',inside)
        }
    }

    FuncList.prototype["onEditorFile"] = function (file)
    {
        var info

        if (info = Indexer.file(file))
        {
            return this.onFileIndexed(file,info)
        }
    }

    FuncList.prototype["onFileIndexed"] = function (file, info)
    {
        var e, item, items

        if (file === kore.get('editor|file'))
        {
            items = FuncItems.forIndexerInfo(file,info)
            this.elem.innerHTML = ''
            var list = _k_.list(items)
            for (var _108_21_ = 0; _108_21_ < list.length; _108_21_++)
            {
                item = list[_108_21_]
                e = elem({class:'funclist-item',parent:this.elem,html:Syntax.spanForTextAndSyntax(item.text,'browser')})
                e.item = item
            }
        }
    }

    return FuncList
})()

export default FuncList;
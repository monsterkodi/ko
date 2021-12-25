// monsterkodi/kode 0.228.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var elem, hub, kxk, lineDiff, post

kxk = require('kxk')
elem = kxk.elem
post = kxk.post

lineDiff = require('../tools/linediff')
hub = require('../git/hub')
class Diffbar
{
    constructor (editor)
    {
        this.editor = editor
    
        this.updateScroll = this.updateScroll.bind(this)
        this.update = this.update.bind(this)
        this.onEditorFile = this.onEditorFile.bind(this)
        this.onMetaClick = this.onMetaClick.bind(this)
        this.elem = elem('canvas',{class:'diffbar'})
        this.elem.style.position = 'absolute'
        this.elem.style.left = '0'
        this.elem.style.top = '0'
        this.editor.view.appendChild(this.elem)
        this.editor.on('file',this.onEditorFile)
        this.editor.on('undone',this.update)
        this.editor.on('redone',this.update)
        this.editor.on('linesShown',this.updateScroll)
        post.on('gitStatus',this.update)
        post.on('gitDiff',this.update)
    }

    onMetaClick (meta, event)
    {
        var blockIndices, _48_53_

        if (event.metaKey)
        {
            return 'unhandled'
        }
        if (event.ctrlKey)
        {
            this.editor.singleCursorAtPos(rangeStartPos(meta))
            this.editor.toggleGitChangesInLines([meta[0]])
        }
        else
        {
            if (meta[2].boring)
            {
                ;(this.editor.invisibles != null ? this.editor.invisibles.activate() : undefined)
            }
            blockIndices = this.lineIndicesForBlockAtLine(meta[0])
            this.editor.do.start()
            this.editor.do.setCursors(blockIndices.map(function (i)
            {
                return [0,i]
            }))
            this.editor.do.end()
            this.editor.toggleGitChangesInLines(blockIndices)
        }
        return this
    }

    gitMetasAtLineIndex (li)
    {
        return this.editor.meta.metasAtLineIndex(li).filter(function (m)
        {
            return m[2].clss.startsWith('git')
        })
    }

    lineIndicesForBlockAtLine (li)
    {
        var ai, bi, lines, toggled

        lines = []
        if (!(_k_.empty(metas) = this.gitMetasAtLineIndex(li)))
        {
            toggled = metas[0][2].toggled
            lines.push(li)
            bi = li - 1
            while (!(_k_.empty(metas) = this.gitMetasAtLineIndex(bi)))
            {
                if (metas[0][2].toggled !== toggled)
                {
                    break
                }
                lines.unshift(bi)
                bi--
            }
            ai = li + 1
            while (!(_k_.empty(metas) = this.gitMetasAtLineIndex(ai)))
            {
                if (metas[0][2].toggled !== toggled)
                {
                    break
                }
                lines.push(ai)
                ai++
            }
        }
        return lines
    }

    updateMetas ()
    {
        var add, boring, change, li, meta, mod, mods, _103_25_, _120_25_, _122_33_, _138_30_, _140_33_, _97_30_, _97_39_

        this.clearMetas()
        if (!((_97_30_=this.changes) != null ? (_97_39_=_97_30_.changes) != null ? _97_39_.length : undefined : undefined))
        {
            return
        }
        var list = _k_.list(this.changes.changes)
        for (var _99_19_ = 0; _99_19_ < list.length; _99_19_++)
        {
            change = list[_99_19_]
            boring = this.isBoring(change)
            if ((change.mod != null))
            {
                li = change.line - 1
                var list1 = _k_.list(change.mod)
                for (var _107_24_ = 0; _107_24_ < list1.length; _107_24_++)
                {
                    mod = list1[_107_24_]
                    meta = {line:li,clss:'git mod' + (boring && ' boring' || ''),git:'mod',change:mod,boring:boring,length:change.mod.length,click:this.onMetaClick}
                    this.editor.meta.addDiffMeta(meta)
                    li++
                }
            }
            if ((change.add != null))
            {
                mods = (change.mod != null) && change.mod.length || 0
                li = change.line - 1 + mods
                var list2 = _k_.list(change.add)
                for (var _125_24_ = 0; _125_24_ < list2.length; _125_24_++)
                {
                    add = list2[_125_24_]
                    meta = {line:li,clss:'git add' + (boring && ' boring' || ''),git:'add',change:add,length:change.add.length,boring:boring,click:this.onMetaClick}
                    this.editor.meta.addDiffMeta(meta)
                    li++
                }
            }
            else if ((change.del != null))
            {
                mods = (change.mod != null) && change.mod.length || 1
                li = change.line - 1 + mods
                meta = {line:li,clss:'git del' + (boring && ' boring' || ''),git:'del',change:change.del,length:1,boring:boring,click:this.onMetaClick}
                this.editor.meta.addDiffMeta(meta)
            }
        }
    }

    isBoring (change)
    {
        var c, _162_21_, _166_21_, _170_21_

        if ((change.mod != null))
        {
            var list = _k_.list(change.mod)
            for (var _163_18_ = 0; _163_18_ < list.length; _163_18_++)
            {
                c = list[_163_18_]
                if (!lineDiff.isBoring(c.old,c.new))
                {
                    return false
                }
            }
        }
        if ((change.add != null))
        {
            var list1 = _k_.list(change.add)
            for (var _167_18_ = 0; _167_18_ < list1.length; _167_18_++)
            {
                c = list1[_167_18_]
                if (!_k_.empty(c.new.trim()))
                {
                    return false
                }
            }
        }
        if ((change.del != null))
        {
            var list2 = _k_.list(change.del)
            for (var _171_18_ = 0; _171_18_ < list2.length; _171_18_++)
            {
                c = list2[_171_18_]
                if (!_k_.empty(c.old.trim()))
                {
                    return false
                }
            }
        }
        return true
    }

    onEditorFile ()
    {
        return this.update()
    }

    update ()
    {
        if (this.editor.currentFile)
        {
            this.changes = {file:this.editor.currentFile}
            return hub.diff(this.editor.currentFile,(function (changes)
            {
                if (changes.file !== this.editor.currentFile)
                {
                    return {}
                }
                this.changes = changes
                this.updateMetas()
                this.updateScroll()
                return this.editor.emit('diffbarUpdated',this.changes)
            }).bind(this))
        }
        else
        {
            this.changes = null
            this.updateMetas()
            this.updateScroll()
            return this.editor.emit('diffbarUpdated',this.changes)
        }
    }

    updateScroll ()
    {
        var alpha, boring, ctx, h, length, lh, li, meta, w, _234_45_

        w = 2
        h = this.editor.scroll.viewHeight
        lh = h / this.editor.numLines()
        ctx = this.elem.getContext('2d')
        this.elem.width = w
        this.elem.height = h
        alpha = function (o)
        {
            return 0.5 + Math.max(0,(16 - o * lh) * (0.5 / 16))
        }
        if (this.changes)
        {
            var list = _k_.list(this.editor.meta.metas)
            for (var _232_21_ = 0; _232_21_ < list.length; _232_21_++)
            {
                meta = list[_232_21_]
                if (!((meta != null ? meta[2] != null ? meta[2].git : undefined : undefined) != null))
                {
                    continue
                }
                li = meta[0]
                length = meta[2].length
                boring = meta[2].boring
                ctx.fillStyle = ((function ()
                {
                    switch (meta[2].git)
                    {
                        case 'mod':
                            if (boring)
                            {
                                return `rgba(50, 50,50,${alpha(length)})`
                            }
                            else
                            {
                                return `rgba( 0,255, 0,${alpha(length)})`
                            }
                            break
                        case 'del':
                            if (boring)
                            {
                                return `rgba(50,50,50,${alpha(length)})`
                            }
                            else
                            {
                                return `rgba(255,0,0,${alpha(length)})`
                            }
                            break
                        case 'add':
                            if (boring)
                            {
                                return `rgba(50,50,50,${alpha(length)})`
                            }
                            else
                            {
                                return `rgba(160,160,255,${alpha(length)})`
                            }
                            break
                    }

                }).bind(this))()
                ctx.fillRect(0,li * lh,w,lh)
            }
        }
    }

    clear ()
    {
        this.clearMetas()
        return this.elem.width = 2
    }

    clearMetas ()
    {
        return this.editor.meta.delClass('git')
    }
}

module.exports = Diffbar
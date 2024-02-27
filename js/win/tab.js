// monsterkodi/kode 0.256.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var elem, File, kerror, post, render, slash, syntax, tooltip

elem = require('kxk').elem
kerror = require('kxk').kerror
post = require('kxk').post
slash = require('kxk').slash
tooltip = require('kxk').tooltip

File = require('../tools/file')
render = require('../editor/render')
syntax = require('../editor/syntax')
class Tab
{
    constructor (tabs, file)
    {
        var _26_46_

        this.tabs = tabs
        this.file = file
    
        this.togglePinned = this.togglePinned.bind(this)
        this.dirty = false
        this.pinned = false
        this.div = elem({class:'tab',text:''})
        this.tabs.div.appendChild(this.div)
        if (!this.file.startsWith('untitled'))
        {
            this.pkg = slash.pkg(this.file)
            if ((this.pkg != null))
            {
                this.pkg = slash.basename(this.pkg)
            }
        }
        this.update()
        post.emit('watch',this.file)
    }

    foreignChanges (lineChanges)
    {
        var _34_17_

        this.foreign = ((_34_17_=this.foreign) != null ? _34_17_ : [])
        this.foreign.push(lineChanges)
        return this.update()
    }

    reload ()
    {
        delete this.state
        this.dirty = false
        return this.update()
    }

    saveChanges ()
    {
        var change, changes, _54_23_

        if (this.state)
        {
            if ((this.foreign != null ? this.foreign.length : undefined))
            {
                var list = _k_.list(this.foreign)
                for (var _55_28_ = 0; _55_28_ < list.length; _55_28_++)
                {
                    changes = list[_55_28_]
                    var list1 = _k_.list(changes)
                    for (var _56_31_ = 0; _56_31_ < list1.length; _56_31_++)
                    {
                        change = list1[_56_31_]
                        switch (change.change)
                        {
                            case 'changed':
                                this.state.state = this.state.state.changeLine(change.doIndex,change.after)
                                break
                            case 'inserted':
                                this.state.state = this.state.state.insertLine(change.doIndex,change.after)
                                break
                            case 'deleted':
                                this.state.state = this.state.state.deleteLine(change.doIndex)
                                break
                        }

                    }
                }
            }
            if (this.state.state)
            {
                return File.save(this.state.file,this.state.state.text(),(function (err)
                {
                    if (err)
                    {
                        return kerror(`tab.saveChanges failed ${err}`)
                    }
                    return this.revert()
                }).bind(this))
            }
            else
            {
                return kerror('tab.saveChanges -- nothing to save?')
            }
        }
        else
        {
            return post.emit('saveChanges')
        }
    }

    setFile (newFile)
    {
        if (!slash.samePath(this.file,newFile))
        {
            this.file = slash.path(newFile)
            post.emit('watch',this.file)
            return this.update()
        }
    }

    storeState ()
    {
        if (window.editor.currentFile)
        {
            return this.state = window.editor.do.tabState()
        }
    }

    restoreState ()
    {
        var _91_62_, _91_68_

        if (!((this.state != null ? this.state.file : undefined) != null))
        {
            return kerror('no file in state?',this.state)
        }
        window.editor.do.setTabState(this.state)
        return delete this.state
    }

    update ()
    {
        var diss, html, name, sep, _137_16_

        this.div.innerHTML = ''
        this.div.classList.toggle('dirty',this.dirty)
        sep = '●'
        if (window.editor.newlineCharacters === '\r\n')
        {
            sep = '■'
        }
        this.div.appendChild(elem('span',{class:'dot',text:sep}))
        sep = "<span class='dot'>►</span>"
        this.pkgDiv = elem('span',{class:'pkg',html:this.pkg && (this.pkg + sep) || ''})
        this.div.appendChild(this.pkgDiv)
        diss = syntax.dissForTextAndSyntax(slash.basename(this.file),'ko')
        name = elem('span',{class:'name',html:render.line(diss,{charWidth:0})})
        this.div.appendChild(name)
        html = ''
        if (this.pinned)
        {
            html = `<svg width="100%" height="100%" viewBox="0 0 30 30">
    <circle cx="15" cy="12" r="4" />
    <line x1="15" y1="16"  x2="15"  y2="22" stroke-linecap="round"></line>
</svg>`
        }
        else if (this.tmpTab)
        {
            html = `<svg width="100%" height="100%" viewBox="0 0 30 30">
    <circle cx="15" cy="10" r="2" />
    <circle cx="15" cy="15" r="2" />
    <circle cx="15" cy="20" r="2" />
</svg>`
        }
        this.div.appendChild(elem({class:'tabstate',html:html,click:this.togglePinned}))
        if ((this.file != null))
        {
            diss = syntax.dissForTextAndSyntax(slash.tilde(this.file),'ko')
            html = render.line(diss,{charWidth:0})
            this.tooltip = new tooltip({elem:name,html:html,x:0})
        }
        if (this.dirty)
        {
            this.div.appendChild(elem('span',{class:'dot',text:'●'}))
        }
        return this
    }

    index ()
    {
        return this.tabs.tabs.indexOf(this)
    }

    prev ()
    {
        if (this.index() > 0)
        {
            return this.tabs.tab(this.index() - 1)
        }
    }

    next ()
    {
        if (this.index() < this.tabs.numTabs() - 1)
        {
            return this.tabs.tab(this.index() + 1)
        }
    }

    nextOrPrev ()
    {
        var _148_27_

        return ((_148_27_=this.next()) != null ? _148_27_ : this.prev())
    }

    close ()
    {
        var _158_16_

        post.emit('unwatch',this.file)
        if (this.dirty)
        {
            this.saveChanges()
        }
        this.div.remove()
        ;(this.tooltip != null ? this.tooltip.del() : undefined)
        post.emit('tabClosed',this.file)
        return this
    }

    hidePkg ()
    {
        if (this.pkgDiv)
        {
            return this.pkgDiv.style.display = 'none'
        }
    }

    showPkg ()
    {
        if (this.pkgDiv)
        {
            return this.pkgDiv.style.display = 'initial'
        }
    }

    setDirty (dirty)
    {
        if (this.dirty !== dirty)
        {
            this.dirty = dirty
            if (this.dirty)
            {
                delete this.tmpTab
            }
            this.update()
        }
        return this
    }

    togglePinned ()
    {
        this.pinned = !this.pinned
        delete this.tmpTab
        this.update()
        return this
    }

    revert ()
    {
        delete this.foreign
        delete this.state
        this.dirty = false
        this.update()
        this.tabs.update()
        return this
    }

    activate ()
    {
        post.emit('jumpToFile',{file:this.file})
        return this
    }

    finishActivation ()
    {
        var changes, _216_17_, _219_19_

        this.setActive()
        if ((this.state != null))
        {
            this.restoreState()
        }
        if ((this.foreign != null ? this.foreign.length : undefined))
        {
            var list = _k_.list(this.foreign)
            for (var _220_24_ = 0; _220_24_ < list.length; _220_24_++)
            {
                changes = list[_220_24_]
                window.editor.do.foreignChanges(changes)
            }
            delete this.foreign
        }
        this.tabs.update()
        return this
    }

    isActive ()
    {
        return this.div.classList.contains('active')
    }

    setActive ()
    {
        if (!this.isActive())
        {
            this.div.classList.add('active')
        }
        return this
    }

    clearActive ()
    {
        this.div.classList.remove('active')
        return this
    }
}

module.exports = Tab
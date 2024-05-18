var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

import kxk from "../../kxk.js"
let elem = kxk.elem
let slash = kxk.slash
let tooltip = kxk.tooltip

import Git from "../tools/Git.js"
import Projects from "../tools/Projects.js"

import Render from "../editor/Render.js"
import Syntax from "../editor/Syntax.js"

class Tab
{
    constructor (tabs, koreTab)
    {
        var k, v

        this.tabs = tabs
    
        this.togglePinned = this.togglePinned.bind(this)
        this.onGitStatus = this.onGitStatus.bind(this)
        this.tooltipHtml = this.tooltipHtml.bind(this)
        this.update = this.update.bind(this)
        for (k in koreTab)
        {
            v = koreTab[k]
            this[k] = v
        }
        this.div = elem({class:'tab app-drag-region'})
        this.tabs.div.appendChild(this.div)
        this.update()
    }

    isPrj ()
    {
        return this.type === 'prj'
    }

    index ()
    {
        return this.tabs.tabs.indexOf(this)
    }

    update ()
    {
        var diss, dot, html, name, prj, sep, tab, tabs, _37_45_, _38_46_, _43_17_

        this.div.innerHTML = ''
        this.div.classList.toggle('dirty',(this.dirty != null))
        this.div.classList.toggle('active',(this.active != null))
        sep = '●'
        if (this.isPrj())
        {
            sep = ''
        }
        if ((this.dirty != null))
        {
            this.dot = elem('span',{class:'unsaved-icon'})
        }
        else
        {
            this.dot = elem('span',{class:'dot',text:sep})
        }
        this.div.appendChild(this.dot)
        diss = Syntax.dissForTextAndSyntax(slash.file(this.path),'ko')
        if (!prefs.get('tabs|extension'))
        {
            if (!_k_.empty(slash.ext(this.path)) && !_k_.empty(slash.name(this.path)))
            {
                diss.pop()
                diss.pop()
            }
        }
        name = elem('span',{class:'name app-drag-region',html:Render.line(diss,{charWidth:0})})
        this.div.appendChild(name)
        if (this.isPrj())
        {
            this.div.classList.add('prj')
        }
        else
        {
            html = ''
            if (this.pinned)
            {
                html = '<span class="tab-lock"><span class="lock-icon"></span></span>'
            }
            else if (this.tmp)
            {
                html = '<span class="tab-temp"><span class="temp-icon"></span></span>'
            }
            this.div.appendChild(elem('span',{class:'tabstate app-drag-region',html:html,click:this.togglePinned}))
        }
        this.tooltip = new tooltip({elem:name,bound:this.div,html:this.tooltipHtml,x:-2})
        if (this.isPrj())
        {
            if (Git.statusCache[this.path])
            {
                this.onGitStatus(Git.statusCache[this.path])
            }
            if (this.collapsed)
            {
                tabs = this.tabs.fileTabsForPath(this.path)
                var list = _k_.list(tabs)
                for (var _a_ = 0; _a_ < list.length; _a_++)
                {
                    tab = list[_a_]
                    dot = elem('span',{class:'prjdot',text:'■'})
                    this.div.appendChild(dot)
                    if (tab.active)
                    {
                        dot.classList.add('activeTab')
                    }
                }
            }
        }
        else
        {
            if (prj = this.tabs.prjTabForPath(this.path))
            {
                if (prj.collapsed)
                {
                    this.div.style.display = 'none'
                }
            }
        }
        return this
    }

    tooltipHtml ()
    {
        var diss, html, numFiles, _99_16_

        if ((this.path != null))
        {
            diss = Syntax.dissForTextAndSyntax(slash.tilde(this.path),'ko')
            html = Render.line(diss,{wrapSpan:'tooltip-path'})
            if (this.isPrj() && (numFiles = Projects.files(this.path).length))
            {
                html += Render.line(Syntax.dissForTextAndSyntax(`${numFiles} files`,'git'),{wrapSpan:'tooltip-line'})
                console.log('ttip git status')
                Git.status(this.path)
            }
        }
        return html
    }

    onGitStatus (status)
    {
        var t, _120_19_, _120_24_

        if (status.gitDir !== this.path)
        {
            return
        }
        if (((this.tooltip != null ? this.tooltip.div : undefined) != null))
        {
            if (status.deleted.length)
            {
                this.tooltip.div.innerHTML += Render.line(Syntax.dissForTextAndSyntax(`▲ ${status.deleted.length} deleted`,'git'),{wrapSpan:'tooltip-line'})
            }
            if (status.added.length)
            {
                this.tooltip.div.innerHTML += Render.line(Syntax.dissForTextAndSyntax(`■ ${status.added.length} added`,'git'),{wrapSpan:'tooltip-line'})
            }
            if (status.changed.length)
            {
                this.tooltip.div.innerHTML += Render.line(Syntax.dissForTextAndSyntax(`● ${status.changed.length} changed`,'git'),{wrapSpan:'tooltip-line'})
            }
        }
        t = ''
        if (status.deleted.length)
        {
            t += '<div class="git-status-icon git-deleted deleted-triangle">▲</div>'
        }
        if (status.added.length)
        {
            t += '<div class="git-status-icon git-added       added-square">■</div>'
        }
        if (status.changed.length)
        {
            t += '<div class="git-status-icon git-changed   changed-circle">●</div>'
        }
        return this.dot.innerHTML = t
    }

    togglePinned ()
    {
        return this.tabs.togglePinned(this.path)
    }
}

export default Tab;
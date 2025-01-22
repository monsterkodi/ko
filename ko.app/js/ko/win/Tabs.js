var _k_ = {isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

import kxk from "../../kxk.js"
let post = kxk.post
let elem = kxk.elem
let kpos = kxk.kpos
let slash = kxk.slash
let drag = kxk.drag
let popup = kxk.popup
let stopEvent = kxk.stopEvent
let ffs = kxk.ffs
let $ = kxk.$

import Projects from "../tools/Projects.js"
import File from "../tools/File.js"

import Tab from "./Tab.js"

import Do from "../editor/Do.js"

class Tabs
{
    constructor (titlebar)
    {
        this.showContextMenu = this.showContextMenu.bind(this)
        this.onContextMenu = this.onContextMenu.bind(this)
        this.onSaveAll = this.onSaveAll.bind(this)
        this.revertFile = this.revertFile.bind(this)
        this.onClearState = this.onClearState.bind(this)
        this.onStoreState = this.onStoreState.bind(this)
        this.setDirty = this.setDirty.bind(this)
        this.onDirty = this.onDirty.bind(this)
        this.toggleExtension = this.toggleExtension.bind(this)
        this.onDragStop = this.onDragStop.bind(this)
        this.onDragMove = this.onDragMove.bind(this)
        this.onDragStart = this.onDragStart.bind(this)
        this.shiftTab = this.shiftTab.bind(this)
        this.move = this.move.bind(this)
        this.navigate = this.navigate.bind(this)
        this.onNewTabWithFile = this.onNewTabWithFile.bind(this)
        this.onNewEmptyTab = this.onNewEmptyTab.bind(this)
        this.onCloseOtherTabs = this.onCloseOtherTabs.bind(this)
        this.onCloseTab = this.onCloseTab.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onProjectIndexed = this.onProjectIndexed.bind(this)
        this.onGitStatus = this.onGitStatus.bind(this)
        this.renameFile = this.renameFile.bind(this)
        this.reloadFile = this.reloadFile.bind(this)
        this.togglePinned = this.togglePinned.bind(this)
        this.setActive = this.setActive.bind(this)
        this.activate = this.activate.bind(this)
        this.delTab = this.delTab.bind(this)
        this.cleanTabs = this.cleanTabs.bind(this)
        this.addTab = this.addTab.bind(this)
        this.onEditorFocus = this.onEditorFocus.bind(this)
        this.activeKorePrj = this.activeKorePrj.bind(this)
        this.activeKoreTab = this.activeKoreTab.bind(this)
        this.onKoreTabs = this.onKoreTabs.bind(this)
        this.refreshTabs = this.refreshTabs.bind(this)
        this.setKoreTabs = this.setKoreTabs.bind(this)
        this.emptyid = 0
        this.tabs = []
        this.div = $('title')
        this.div.classList.add('tabs')
        this.div.addEventListener('click',this.onClick)
        this.div.addEventListener('contextmenu',this.onContextMenu)
        this.drag = new drag({target:this.div,onStart:this.onDragStart,onMove:this.onDragMove,onStop:this.onDragStop})
        post.on('newTabWithFile',this.onNewTabWithFile)
        post.on('newEmptyTab',this.onNewEmptyTab)
        post.on('fileRemoved',this.delTab)
        post.on('fileRenamed',this.renameFile)
        post.on('fileCreated',this.reloadFile)
        post.on('fileChanged',this.reloadFile)
        post.on('reloadFile',this.reloadFile)
        post.on('saveAll',this.onSaveAll)
        post.on('closeTab',this.onCloseTab)
        post.on('closeOtherTabs',this.onCloseOtherTabs)
        post.on('dirty',this.onDirty)
        post.on('storeState',this.onStoreState)
        post.on('clearState',this.onClearState)
        post.on('revertFile',this.revertFile)
        post.on('editorFocus',this.onEditorFocus)
        post.on('stashLoaded',this.refreshTabs)
        post.on('projectIndexed',this.onProjectIndexed)
        post.on('gitStatus',this.onGitStatus)
        kore.on('tabs',this.onKoreTabs)
        kore.on('editor|file',this.addTab)
    }

    tab (id)
    {
        var tabDiv

        if (_k_.isNum(id))
        {
            return this.tabs[id]
        }
        if (elem.isElement(id))
        {
            tabDiv = elem.upElem(id,{class:'tab'})
            return this.tabs.find(function (t)
            {
                return t.div === tabDiv
            })
        }
        if (_k_.isStr(id))
        {
            return this.tabs.find(function (t)
            {
                return t.path === id
            })
        }
    }

    tabAtX (x)
    {
        return this.tabs.find(function (t)
        {
            var br

            br = t.div.getBoundingClientRect()
            return (br.left <= x && x <= br.left + br.width)
        })
    }

    koreTabs ()
    {
        var tabs

        tabs = kore.get('tabs')
        return (tabs != null ? tabs : [])
    }

    koreTabForPath (path, tabs)
    {
        var tab

        tabs = (tabs != null ? tabs : this.koreTabs())
        var list = _k_.list(tabs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            if (slash.samePath(tab.path,path))
            {
                return tab
            }
        }
    }

    fileTabsForPath (path)
    {
        return this.fileTabs(this.koreTabs()).filter(function (t)
        {
            return t.path.startsWith(path)
        })
    }

    fileTabs (tabs)
    {
        return tabs.filter(function (t)
        {
            return t.type === 'file'
        })
    }

    prjTabs ()
    {
        return this.koreTabs().filter(function (t)
        {
            return t.type === 'prj'
        })
    }

    numFileTabs ()
    {
        return this.fileTabs(this.koreTabs()).length
    }

    prjTabForPath (path)
    {
        var tab

        var list = _k_.list(this.prjTabs())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            if (path.startsWith(tab.path))
            {
                return tab
            }
        }
    }

    setKoreTabs (tabs)
    {
        kore.set('tabs',tabs)
        return tabs
    }

    refreshTabs ()
    {
        return this.onKoreTabs(this.koreTabs())
    }

    onKoreTabs (tabs)
    {
        var koreTab

        this.div.innerHTML = ''
        this.tabs = []
        var list = _k_.list(tabs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            koreTab = list[_a_]
            this.tabs.push(new Tab(this,koreTab))
        }
    }

    activeKoreTab ()
    {
        var tab

        var list = _k_.list(this.koreTabs())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            if (tab.active)
            {
                return tab
            }
        }
    }

    activeKorePrj ()
    {
        var fileTab, tab

        if (fileTab = this.activeKoreTab())
        {
            var list = _k_.list(this.koreTabs())
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                tab = list[_a_]
                if (tab.type === 'prj' && fileTab.path.startsWith(tab.path))
                {
                    return tab
                }
            }
        }
    }

    onEditorFocus (editor)
    {
        var tab, tabs

        if (editor.name === 'editor')
        {
            if (tab = this.koreTabForPath(kore.get('editor|file')))
            {
                tabs = this.setActive(tab.path)
                var list = _k_.list(tabs)
                for (var _a_ = 0; _a_ < list.length; _a_++)
                {
                    tab = list[_a_]
                    delete tab.tmp
                }
                return this.setKoreTabs(tabs)
            }
        }
    }

    addTab (path)
    {
        var prjPath, tab, tabs, _164_22_

        if (_k_.empty(path))
        {
            return
        }
        if (!this.koreTabForPath(path))
        {
            prjPath = Projects.dir(path)
            prjPath = (prjPath != null ? prjPath : slash.dir(path))
            if (_k_.empty(prjPath))
            {
                prjPath = kakao.bundle.path
            }
            tabs = this.koreTabs()
            if (!this.koreTabForPath(prjPath))
            {
                tabs.push({type:'prj',path:prjPath})
            }
            var list = _k_.list(tabs)
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                tab = list[_a_]
                delete tab.active
            }
            tabs.push({type:'file',path:path,active:true,tmp:!path.startsWith('untitled-')})
            this.cleanTabs(tabs)
            ;(this.tab(path) != null ? this.tab(path).div.scrollIntoViewIfNeeded() : undefined)
            return
        }
        this.cleanTabs(this.setActive(path))
        return this
    }

    cleanTabs (tabs)
    {
        var i, k, prjPath, prjTabs, remain, sorted, tab, v, _190_29_

        sorted = tabs.filter(function (t)
        {
            return t.type === 'prj'
        })
        remain = tabs.filter(function (t)
        {
            return t.type !== 'prj'
        })
        prjTabs = {}
        var list = _k_.list(sorted)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            prjTabs[tab.path] = [tab]
        }
        while (tab = remain.shift())
        {
            prjPath = Projects.dir(tab.path)
            prjPath = (prjPath != null ? prjPath : slash.dir(tab.path))
            if (_k_.empty(prjPath))
            {
                prjPath = kakao.bundle.path
            }
            prjTabs[prjPath] = ((_190_29_=prjTabs[prjPath]) != null ? _190_29_ : [{type:'prj',path:prjPath}])
            prjTabs[prjPath].push(tab)
        }
        for (k in prjTabs)
        {
            v = prjTabs[k]
            if (v.length <= 1)
            {
                delete prjTabs[k]
            }
        }
        tabs = []
        for (k in prjTabs)
        {
            v = prjTabs[k]
            if (v.slice(-1)[0].tmp)
            {
                for (var _b_ = i = v.length - 2, _c_ = 0; (_b_ <= _c_ ? i <= 0 : i >= 0); (_b_ <= _c_ ? ++i : --i))
                {
                    if (v[i].tmp)
                    {
                        v.splice(i,1)
                    }
                }
            }
            tabs = tabs.concat(v)
        }
        return this.setKoreTabs(tabs)
    }

    delTab (path)
    {
        var ftabs, index, tab, tabs

        if (tab = this.koreTabForPath(path))
        {
            tabs = this.koreTabs()
            ftabs = this.fileTabs(tabs)
            index = ftabs.indexOf(tab)
            if (tab.active)
            {
                if (index + 1 < ftabs.length)
                {
                    ftabs[index + 1].active = true
                }
                else if (index - 1 >= 0)
                {
                    ftabs[index - 1].active = true
                }
            }
            index = tabs.indexOf(tab)
            tabs.splice(index,1)
            this.cleanTabs(tabs)
            return this.activate(this.activeKoreTab().path)
        }
    }

    activate (path)
    {
        var tab, tabs

        if (tab = this.koreTabForPath(path))
        {
            if (tab.type === 'file')
            {
                this.cleanTabs(this.setActive(path))
                return post.emit('jumpToFile',path)
            }
            else
            {
                tabs = this.koreTabs()
                tab = this.koreTabForPath(path,tabs)
                tab.collapsed = !tab.collapsed
                return this.setKoreTabs(tabs)
            }
        }
    }

    setActive (path)
    {
        var tab, tabs, _265_26_, _265_31_

        tabs = this.koreTabs()
        var list = _k_.list(tabs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            delete tab.active
            if (slash.samePath(tab.path,path))
            {
                tab.active = true
                ;((_265_26_=this.tab(path)) != null ? (_265_31_=_265_26_.div) != null ? _265_31_.scrollIntoViewIfNeeded() : undefined : undefined)
            }
        }
        return tabs
    }

    togglePinned (path)
    {
        var tab, tabs

        tabs = this.koreTabs()
        var list = _k_.list(tabs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            if (slash.samePath(tab.path,path))
            {
                if (tab.tmp)
                {
                    delete tab.tmp
                }
                else if (tab.pinned)
                {
                    delete tab.pinned
                }
                else
                {
                    tab.pinned = true
                }
                return this.setKoreTabs(tabs)
            }
        }
        return tabs
    }

    reloadFile (file)
    {
        var tab, tabs

        file = (file != null ? file : kore.get('editor|file'))
        tabs = this.koreTabs()
        if (tab = this.koreTabForPath(file,tabs))
        {
            delete tab.dirty
            return this.cleanTabs(tabs)
        }
    }

    renameFile (file, src)
    {
        var tab

        if (src)
        {
            if (tab = this.koreTabForPath(src))
            {
                post.emit('loadFile',file)
                this.delTab(src)
                return
            }
        }
        if (file === kore.get('editor|file') && (tab = this.koreTabForPath(file)))
        {
            return post.emit('loadFile',file)
        }
    }

    onGitStatus (status)
    {
        var tab

        if (tab = this.koreTabForPath(status.gitDir))
        {
            if (tab.type === 'prj')
            {
                return this.tab(status.gitDir).onGitStatus(status)
            }
        }
    }

    onProjectIndexed (path)
    {
        var tabs

        tabs = this.koreTabs()
        tabs.push({type:'prj',path:path})
        return this.cleanTabs(tabs)
    }

    onClick (event)
    {
        var state, tab

        if (tab = this.tab(event.target))
        {
            if (event.target.classList.contains('dot'))
            {
                this.delTab(tab.path)
            }
            else if (event.target.classList.contains('unsaved-icon'))
            {
                tab = this.koreTabForPath(tab.path)
                if (tab.dirty)
                {
                    if (tab.active)
                    {
                        post.emit('saveFile')
                    }
                    else
                    {
                        if (tab.path.startsWith('untitled'))
                        {
                            post.emit('saveFileAs')
                        }
                        else
                        {
                            delete tab.dirty
                            if (state = tab.state)
                            {
                                File.save(state.file,state.state.text(),(function (file)
                                {
                                    if (!file)
                                    {
                                        return console.error(`Tabs.onClick failed to save ${state.file}`)
                                    }
                                    delete tab.state
                                    delete tab.dirty
                                    return this.refreshTabs()
                                }).bind(this))
                            }
                        }
                    }
                }
            }
            else
            {
                if (tab.type === 'prj')
                {
                    if (event.target.classList.contains('git-status-icon'))
                    {
                        return post.emit('git.diff',tab.path)
                    }
                }
                this.activate(tab.path)
            }
        }
        return true
    }

    onCloseTab ()
    {
        var tab

        if (this.numFileTabs() <= 1)
        {
            return post.emit('menuAction','close')
        }
        else
        {
            if (this.koreTabForPath(kore.get('editor|file')))
            {
                return this.delTab(kore.get('editor|file'))
            }
            else if (tab = this.activeKoreTab())
            {
                return this.delTab(tab.path)
            }
        }
    }

    onCloseOtherTabs ()
    {
        var active, index, tab, tabs

        active = this.activeKoreTab()
        tabs = this.koreTabs()
        for (var _a_ = index = tabs.length - 1, _b_ = 0; (_a_ <= _b_ ? index <= 0 : index >= 0); (_a_ <= _b_ ? ++index : --index))
        {
            tab = tabs[index]
            if (tab === active)
            {
                continue
            }
            if (!tab.pinned && tab.type === 'file')
            {
                tabs.splice(index,1)
            }
        }
        return this.cleanTabs(tabs)
    }

    onNewEmptyTab ()
    {
        console.log('onNewEmptyTab')
        this.emptyid += 1
        this.addTab(`untitled-${this.emptyid}`)
        return this.activate(`untitled-${this.emptyid}`)
    }

    onNewTabWithFile (file)
    {
        var col, line, path, prjPath, tabs

        var _a_ = slash.splitFileLine(file); path = _a_[0]; line = _a_[1]; col = _a_[2]

        if (!this.koreTabForPath(path))
        {
            tabs = this.koreTabs()
            if (prjPath = Projects.dir(path))
            {
                if (!this.koreTabForPath(prjPath))
                {
                    tabs.push({type:'prj',path:prjPath})
                }
            }
            tabs.push({type:'file',path:path})
            return this.cleanTabs(tabs)
        }
    }

    navigate (key)
    {
        var index, tab, tabs

        if (tab = this.activeKoreTab())
        {
            tabs = this.fileTabs(this.koreTabs())
            index = tabs.indexOf(tab)
            index += ((function ()
            {
                switch (key)
                {
                    case 'left':
                        return -1

                    case 'right':
                        return 1

                }

            }).bind(this))()
            if ((0 <= index && index < tabs.length))
            {
                return this.activate(tabs[index].path)
            }
        }
    }

    move (key)
    {
        var tab

        if (tab = this.activeKoreTab())
        {
            switch (key)
            {
                case 'left':
                    return this.shiftTab(tab,-1)

                case 'right':
                    return this.shiftTab(tab,1)

            }

        }
    }

    shiftTab (tab, delta)
    {
        var index, tabs

        tabs = this.koreTabs()
        index = tabs.indexOf(tab)
        tabs.splice(index,1)
        tabs.splice(index + delta,0,tab)
        return this.cleanTabs(tabs)
    }

    onDragStart (d, event)
    {
        var br

        if (event.target.classList.contains('tab'))
        {
            return 'skip'
        }
        if (event.target.classList.contains('tabstate'))
        {
            return 'skip'
        }
        this.dragTab = this.tab(event.target)
        if (_k_.empty(this.dragTab))
        {
            return 'skip'
        }
        if (event.button !== 0)
        {
            return 'skip'
        }
        this.dragIndex = this.dragTab.index()
        this.dragDiv = this.dragTab.div.cloneNode(true)
        this.dragTab.div.style.opacity = '0'
        br = this.dragTab.div.getBoundingClientRect()
        this.dragDiv.style.position = 'absolute'
        this.dragDiv.style.top = `${br.top}px`
        this.dragDiv.style.left = `${br.left}px`
        this.dragDiv.style.width = `${br.width}px`
        this.dragDiv.style.height = `${br.height}px`
        this.dragDiv.style.flex = 'unset'
        this.dragDiv.style.pointerEvents = 'none'
        return document.body.appendChild(this.dragDiv)
    }

    onDragMove (d, e)
    {
        var dragIndex, hovrIndex, swap, tab

        swap = (function (ta, tb)
        {
            if ((ta != null) && (tb != null))
            {
                if (ta.index() > tb.index())
                {
                    var _a_ = [tb,ta]; ta = _a_[0]; tb = _a_[1]

                }
                this.tabs[ta.index()] = tb
                this.tabs[tb.index() + 1] = ta
                return this.div.insertBefore(tb.div,ta.div)
            }
        }).bind(this)
        this.dragDiv.style.transform = `translateX(${d.deltaSum.x}px)`
        if (tab = this.tabAtX(d.pos.x))
        {
            dragIndex = this.dragTab.index()
            hovrIndex = tab.index()
            if (dragIndex > hovrIndex)
            {
                return swap(this.tabs[hovrIndex],this.tabs[dragIndex])
            }
            else if (dragIndex < hovrIndex)
            {
                return swap(this.tabs[dragIndex],this.tabs[hovrIndex])
            }
        }
    }

    onDragStop (d, e)
    {
        var index

        index = this.dragTab.index()
        this.dragTab.div.style.opacity = ''
        this.dragDiv.remove()
        if (index !== this.dragIndex)
        {
            return this.shiftTab(this.koreTabs()[this.dragIndex],index - this.dragIndex)
        }
    }

    toggleExtension ()
    {
        var tab

        prefs.toggle('tabs|extension')
        var list = _k_.list(this.tabs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            tab.update()
        }
    }

    onDirty (dirty)
    {
        var tab

        if (tab = this.activeKoreTab())
        {
            return this.setDirty(tab.path,dirty)
        }
    }

    setDirty (path, dirty)
    {
        var tab, tabs

        tabs = this.koreTabs()
        if (tab = this.koreTabForPath(path,tabs))
        {
            if (dirty)
            {
                tab.dirty = true
            }
            else
            {
                delete tab.dirty
            }
            return this.setKoreTabs(tabs)
        }
    }

    onStoreState (path, state)
    {
        var tab, tabStates

        tabStates = kore.get('tabStates',{})
        if (tab = this.koreTabForPath(path))
        {
            if (!_k_.empty(state))
            {
                tabStates[path] = state
                kore.set('tabStates',tabStates)
                return
            }
        }
        return this.onClearState(path)
    }

    onClearState (path)
    {
        var tabStates

        this.setDirty(path,false)
        tabStates = kore.get('tabStates',{})
        delete tabStates[path]
        return kore.set('tabStates',tabStates)
    }

    revertFile (path)
    {
        var tab, tabs, tabStates

        tabs = this.koreTabs()
        if (tab = this.koreTabForPath(path,tabs))
        {
            delete tab.dirty
            tabStates = kore.get('tabStates',{})
            delete tabStates[path]
            kore.set('tabStates',tabStates)
            return this.setKoreTabs(tabs)
        }
    }

    onSaveAll ()
    {
        var state, tab, tabStates, unsavedTabPath

        var list = _k_.list(this.koreTabs())
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            tab = list[_a_]
            if (tab.dirty)
            {
                if (tab.active)
                {
                    post.emit('saveFile')
                }
                else
                {
                    if (tab.path.startsWith('untitled'))
                    {
                        continue
                    }
                    tabStates = kore.get('tabStates')
                    if (state = tabStates[tab.path])
                    {
                        unsavedTabPath = tab.path
                        ffs.read(tab.path).then((function (textOnDisk)
                        {
                            var textWithChangesApplied

                            textWithChangesApplied = Do.applyStateToText(state,textOnDisk)
                            return ffs.write(unsavedTabPath,textWithChangesApplied).then((function (file)
                            {
                                var tabs

                                if (!file)
                                {
                                    return console.error(`Tabs.onSaveAll failed to save ${file}`)
                                }
                                tabs = this.koreTabs()
                                if (tab = this.koreTabForPath(file,tabs))
                                {
                                    delete tab.dirty
                                    tabStates = kore.get('tabStates')
                                    delete tabStates[file]
                                    kore.set('tabStates',tabStates)
                                    return this.setKoreTabs(tabs)
                                }
                            }).bind(this))
                        }).bind(this))
                    }
                }
            }
        }
    }

    onContextMenu (event)
    {
        var tab

        if (tab = this.tab(event.target))
        {
            this.activate(tab.path)
        }
        stopEvent(event)
        return this.showContextMenu(kpos(event))
    }

    showContextMenu (absPos)
    {
        var opt

        if (!(absPos != null))
        {
            absPos = kpos(this.view.getBoundingClientRect().left,this.view.getBoundingClientRect().top)
        }
        opt = {items:[{text:'Close Other Tabs',combo:'alt+cmdctrl+w'},{text:'New Window',combo:'cmdctrl+shift+n'},{text:'Toggle Tab Extensions',combo:'alt+cmdctrl+t'}]}
        opt.x = absPos.x
        opt.y = absPos.y
        return popup.menu(opt)
    }
}

export default Tabs;
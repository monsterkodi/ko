var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isObj: function (o) {return !(o == null || typeof o != 'object' || o.constructor.name !== 'Object')}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clone: function (o,v) { v ??= new Map(); if (Array.isArray(o)) { if (!v.has(o)) {var r = []; v.set(o,r); for (var i=0; i < o.length; i++) {if (!v.has(o[i])) { v.set(o[i],_k_.clone(o[i],v)) }; r.push(v.get(o[i]))}}; return v.get(o) } else if (typeof o == 'string') { if (!v.has(o)) {v.set(o,''+o)}; return v.get(o) } else if (o != null && typeof o == 'object' && o.constructor.name == 'Object') { if (!v.has(o)) { var k, r = {}; v.set(o,r); for (k in o) { if (!v.has(o[k])) { v.set(o[k],_k_.clone(o[k],v)) }; r[k] = v.get(o[k]) }; }; return v.get(o) } else {return o} }}

var FileEditor

import kxk from "../../kxk.js"
let deleteBy = kxk.deleteBy
let findIf = kxk.findIf
let ffs = kxk.ffs
let kpos = kxk.kpos
let post = kxk.post
let popup = kxk.popup
let slash = kxk.slash
let stopEvent = kxk.stopEvent
let elem = kxk.elem
let setStyle = kxk.setStyle
let kstr = kxk.kstr

import File from "../tools/File.js"

import Syntax from "./Syntax.js"
import TextEditor from "./TextEditor.js"


FileEditor = (function ()
{
    _k_.extend(FileEditor, TextEditor)
    function FileEditor (viewElem)
    {
        this["showContextMenu"] = this["showContextMenu"].bind(this)
        this["onContextMenu"] = this["onContextMenu"].bind(this)
        this["jumpTo"] = this["jumpTo"].bind(this)
        this["jumpToFile"] = this["jumpToFile"].bind(this)
        this["jumpToFilePos"] = this["jumpToFilePos"].bind(this)
        this["onCommandline"] = this["onCommandline"].bind(this)
        this["setText"] = this["setText"].bind(this)
        FileEditor.__super__.constructor.call(this,viewElem,{features:['Diffbar','Scrollbar','Numbers','Minimap','Meta','AutoComplete','Brackets','Strings','CursorLine','FuncList'],fontSize:19})
        this.currentFile = null
        this.view.addEventListener('contextmenu',this.onContextMenu)
        post.on('commandline',this.onCommandline)
        post.on('jumpTo',this.jumpTo)
        post.on('jumpToFile',this.jumpToFile)
        post.on('jumpToFilePos',this.jumpToFilePos)
        this.setText('')
        this.initInvisibles()
        this.initPigments()
    }

    FileEditor.prototype["changed"] = function (changeInfo)
    {
        FileEditor.__super__.changed.call(this,changeInfo)
    
        if (changeInfo.changes.length)
        {
            this.dirty = this.do.hasChanges()
            return post.emit('dirty',this.dirty)
        }
    }

    FileEditor.prototype["clear"] = function ()
    {
        var _70_16_, _71_13_

        this.dirty = false
        this.setSalterMode(false)
        ;(this.diffbar != null ? this.diffbar.clear() : undefined)
        ;(this.meta != null ? this.meta.clear() : undefined)
        this.setLines([''])
        return this.do.reset()
    }

    FileEditor.prototype["setCurrentFile"] = function (file)
    {
        this.clear()
        this.currentFile = file
        this.setupFileType()
        if (this.currentFile)
        {
            return ffs.read(this.currentFile).then(this.setText)
        }
    }

    FileEditor.prototype["setText"] = function (text = "")
    {
        FileEditor.__super__.setText.call(this,text)
    
        var tab, tabStates

        tabStates = kore.get('tabStates')
        if (tab = window.tabs.koreTabForPath(this.currentFile))
        {
            if (tab.dirty && tabStates[this.currentFile])
            {
                this.do.setTabState(tabStates[this.currentFile])
            }
        }
        this.restoreFilePosition()
        post.emit('file',this.currentFile)
        return this.emit('file',this.currentFile)
    }

    FileEditor.prototype["currentDir"] = function ()
    {
        var _103_23_

        if ((this.currentFile != null))
        {
            return slash.dir(this.currentFile)
        }
        else
        {
            return slash.path(kakao.bundle.path)
        }
    }

    FileEditor.prototype["shebangFileType"] = function ()
    {
        var ext, fileType, _118_27_

        if (this.numLines())
        {
            fileType = Syntax.shebang(this.line(0))
        }
        if (fileType === 'txt')
        {
            if ((this.currentFile != null))
            {
                ext = slash.ext(this.currentFile)
                if (_k_.in(ext,Syntax.syntaxNames))
                {
                    return ext
                }
            }
        }
        else if (fileType)
        {
            return fileType
        }
        return FileEditor.__super__.shebangFileType.call(this)
    }

    FileEditor.prototype["onCommandline"] = function (e)
    {
        var d

        switch (e)
        {
            case 'hidden':
            case 'shown':
                d = window.split.commandlineHeight + window.split.flex.handleSize
                d = Math.min(d,this.scroll.scrollMax - this.scroll.scroll)
                if (e === 'hidden')
                {
                    d *= -1
                }
                return this.scroll.by(d)

        }

    }

    FileEditor.prototype["saveFilePosition"] = function ()
    {
        var cursor, filePositions

        if (!this.currentFile)
        {
            return
        }
        filePositions = window.stash.get('filePositions',{})
        if (!(_k_.isObj(filePositions)))
        {
            filePositions = {}
        }
        cursor = this.mainCursor()
        if (cursor[0] || cursor[1])
        {
            filePositions[this.currentFile] = `${cursor[0]} ${cursor[1]} ${this.scroll.scroll}`
        }
        else
        {
            delete filePositions[this.currentFile]
        }
        deleteBy(filePositions,function (f, fp)
        {
            return fp.startsWith('0 0 ')
        })
        return window.stash.set('filePositions',filePositions)
    }

    FileEditor.prototype["restoreFilePosition"] = function ()
    {
        var cursor, filePositions, posScroll, _194_16_

        if (!this.currentFile)
        {
            return
        }
        filePositions = window.stash.get('filePositions',{})
        if (cursor = filePositions[this.currentFile])
        {
            posScroll = cursor.split(' ').map(function (c)
            {
                return parseInt(c)
            })
            this.singleCursorAtPos(posScroll)
            if (posScroll.length === 3)
            {
                this.scroll.scroll = 0
                this.scroll.by(_k_.last(posScroll))
            }
        }
        else
        {
            this.singleCursorAtPos([0,0])
            if (this.mainCursor()[1] === 0)
            {
                this.scroll.top = 0
            }
            this.scroll.bot = this.scroll.top - 1
            this.scroll.to(0)
        }
        this.updateLayers()
        ;(this.numbers != null ? this.numbers.updateColors() : undefined)
        this.minimap.onEditorScroll()
        return this.emit('selection')
    }

    FileEditor.prototype["jumpToFilePos"] = function (opt)
    {
        if (opt.path === this.currentFile)
        {
            this.singleCursorAtPos([opt.col,opt.line - 1])
            return this.scroll.cursorToTop()
        }
        else
        {
            console.log('FileEditor.jumpToFilePos loadFile?',opt)
        }
    }

    FileEditor.prototype["jumpToFile"] = function (opt)
    {
        var file, fpos, _234_21_

        opt = (opt != null ? opt : {})
        if (_k_.isStr(opt))
        {
            opt = {path:opt}
        }
        if (File.isImage(opt.path))
        {
            return
        }
        if (window.lastFocus === 'editor')
        {
            var _a_ = slash.splitFilePos(opt.path); file = _a_[0]; fpos = _a_[1]

            opt.pos = fpos
            if (opt.col)
            {
                opt.pos[0] = opt.col
            }
            if (opt.line)
            {
                opt.pos[1] = opt.line - 1
            }
            opt.winID = window.winID
            opt.oldPos = this.cursorPos()
            opt.oldFile = this.currentFile
            opt.file = ((_234_21_=opt.file) != null ? _234_21_ : opt.path)
            return window.navigate.gotoFilePos(opt)
        }
        else
        {
            file = slash.joinFileLine(opt.path,opt.line,opt.col)
            return post.emit('loadFile',file)
        }
    }

    FileEditor.prototype["jumpTo"] = function (word, opt)
    {
        var classes, clss, file, files, find, func, funcs, i, info, infos, type, _257_19_

        console.log('FileEditor jumpTo',word,opt)
        if (typeof(word) === 'object' && !(opt != null))
        {
            opt = word
            word = opt.word
        }
        opt = (opt != null ? opt : {})
        if ((opt.path != null))
        {
            this.jumpToFile(opt)
            return true
        }
        if (_k_.empty(word))
        {
            return console.error('nothing to jump to?')
        }
        word = word.trim()
        find = word.toLowerCase()
        if (find[0] === '@')
        {
            find = find.slice(1)
        }
        if (_k_.empty(find))
        {
            return console.error('FileEditor.jumpTo -- nothing to find?')
        }
        type = (opt != null ? opt.type : undefined)
        console.log('FileEditor jumpTo',word,type)
        if (!type || type === 'class')
        {
            classes = window.indexer.classes
            for (clss in classes)
            {
                info = classes[clss]
                if (clss.toLowerCase() === find)
                {
                    this.jumpToFile(info)
                    return true
                }
            }
        }
        if (!type || type === 'func')
        {
            funcs = window.indexer.funcs
            console.log('funcs',funcs)
            if (infos = funcs[word])
            {
                console.log('direct func infos',infos)
                info = findIf(infos,(function (info)
                {
                    return info.file === this.currentFile
                }).bind(this))
                info = (info != null ? info : findIf(infos,(function (info)
                {
                    return slash.ext(info.file) === slash.ext(this.currentFile)
                }).bind(this)))
                info = (info != null ? info : _k_.first(infos))
                console.log('FileEditor jumpTo jumpToFile direct',info)
                this.jumpToFile(info)
                return true
            }
            for (func in funcs)
            {
                infos = funcs[func]
                if (func.toLowerCase() === find)
                {
                    info = infos[0]
                    var list = _k_.list(infos)
                    for (var _a_ = 0; _a_ < list.length; _a_++)
                    {
                        i = list[_a_]
                        if (i.file === this.currentFile)
                        {
                            info = i
                        }
                    }
                    console.log('FileEditor jumpTo jumpToFile indirect',info)
                    this.jumpToFile(info)
                    return true
                }
            }
        }
        if (!type || type === 'file')
        {
            files = window.indexer.files
            for (file in files)
            {
                info = files[file]
                if (slash.name(file).toLowerCase() === find && file !== this.currentFile)
                {
                    this.jumpToFile({path:file,line:6})
                }
            }
        }
        window.commandline.commands.search.start('search')
        window.commandline.commands.search.execute(word)
        window.split.do('show terminal')
        return true
    }

    FileEditor.prototype["jumpToCounterpart"] = async function ()
    {
        var counter, counterparts, cp, currext, ext, file, _348_41_, _354_41_, _363_41_

        cp = this.cursorPos()
        currext = slash.ext(this.currentFile)
        counterparts = {mm:['h'],cpp:['hpp','h'],cc:['hpp','h'],h:['cpp','c','mm'],hpp:['cpp','c'],coffee:['js','mjs'],kode:['js','mjs'],js:['coffee','kode'],mjs:['coffee','kode'],pug:['html'],noon:['json'],json:['noon'],html:['pug'],css:['styl'],styl:['css']}
        var list = ((_348_41_=counterparts[currext]) != null ? _348_41_ : [])
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            ext = list[_a_]
            if (await ffs.fileExists(slash.swapExt(this.currentFile,ext)))
            {
                post.emit('loadFile',slash.swapExt(this.currentFile,ext))
                return true
            }
        }
        var list1 = ((_354_41_=counterparts[currext]) != null ? _354_41_ : [])
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            ext = list1[_b_]
            counter = slash.swapExt(this.currentFile,ext)
            file = this.swapLastDir(counter,currext,ext)
            if (await ffs.fileExists(file))
            {
                post.emit('loadFile',file)
                return true
            }
        }
        var list2 = ((_363_41_=counterparts[currext]) != null ? _363_41_ : [])
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            ext = list2[_c_]
            counter = slash.swapExt(this.currentFile,ext)
            if (_k_.in(currext,['noon']))
            {
                file = this.swapLastDir(counter,'kode','js')
                if (await ffs.fileExists(file))
                {
                    post.emit('loadFile',file)
                    return true
                }
            }
            if (_k_.in(currext,['json']))
            {
                file = this.swapLastDir(counter,'js','kode')
                if (await ffs.fileExists(file))
                {
                    post.emit('loadFile',file)
                    return true
                }
            }
        }
        console.log('cant find counterpart',this.currentFile)
        return true
    }

    FileEditor.prototype["swapLastDir"] = function (path, from, to)
    {
        var lastIndex

        lastIndex = path.lastIndexOf(`/${from}/`)
        if (lastIndex >= 0)
        {
            path = path.slice(0, typeof lastIndex === 'number' ? lastIndex+1 : Infinity) + to + path.slice(lastIndex + (`/${from}`).length)
        }
        return path
    }

    FileEditor.prototype["centerText"] = function (center, animate = 300)
    {
        var br, l, layers, newOffset, offsetX, resetTrans, t, transi, visCols

        this.size.centerText = center
        this.updateLayers()
        this.size.offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth)
        if (center)
        {
            br = this.view.getBoundingClientRect()
            visCols = parseInt(br.width / this.size.charWidth)
            newOffset = parseInt(this.size.charWidth * (visCols - 100) / 2)
            this.size.offsetX = Math.max(this.size.offsetX,newOffset)
            this.size.centerText = true
        }
        else
        {
            this.size.centerText = false
        }
        this.updateLinePositions(animate)
        if (animate)
        {
            layers = ['.selections','.highlights','.cursors']
            transi = ['.selection','.highlight','.cursor'].concat(layers)
            resetTrans = (function ()
            {
                var l, t

                var list = _k_.list(layers)
                for (var _a_ = 0; _a_ < list.length; _a_++)
                {
                    l = list[_a_]
                    setStyle('.editor .layers ' + l,'transform',"translateX(0)")
                }
                var list1 = _k_.list(transi)
                for (var _b_ = 0; _b_ < list1.length; _b_++)
                {
                    t = list1[_b_]
                    setStyle('.editor .layers ' + t,'transition',"initial")
                }
                return this.updateLayers()
            }).bind(this)
            if (center)
            {
                offsetX = this.size.offsetX - this.size.numbersWidth - this.size.charWidth / 2
            }
            else
            {
                offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth)
                offsetX -= this.size.numbersWidth + this.size.charWidth / 2
                offsetX *= -1
            }
            var list = _k_.list(layers)
            for (var _c_ = 0; _c_ < list.length; _c_++)
            {
                l = list[_c_]
                setStyle('.editor .layers ' + l,'transform',`translateX(${offsetX}px)`)
            }
            var list1 = _k_.list(transi)
            for (var _d_ = 0; _d_ < list1.length; _d_++)
            {
                t = list1[_d_]
                setStyle('.editor .layers ' + t,'transition',`all ${animate / 1000}s`)
            }
            return setTimeout(resetTrans,animate)
        }
        else
        {
            return this.updateLayers()
        }
    }

    FileEditor.prototype["onContextMenu"] = function (event)
    {
        return stopEvent(event,this.showContextMenu(kpos(event)))
    }

    FileEditor.prototype["showContextMenu"] = function (absPos)
    {
        var act, bi, f, fileMenu, fileSpan, getMenu, opt, pup, qiq, quiq, recent, RecentMenu, ti

        if (!(absPos != null))
        {
            absPos = kpos(this.view.getBoundingClientRect().left,this.view.getBoundingClientRect().top)
        }
        opt = {}
        opt.items = _k_.clone(kakao.menuTemplate)
        RecentMenu = []
        fileSpan = function (f)
        {
            var span

            if ((f != null))
            {
                span = Syntax.spanForTextAndSyntax(slash.tilde(slash.dir(f)),'browser')
                span += Syntax.spanForTextAndSyntax('/' + slash.name(f),'browser')
            }
            return span
        }
        recent = window.stash.get('recentFiles',[])
        recent = (recent != null ? recent : [])
        var list = _k_.list(recent)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            f = list[_a_]
            RecentMenu.unshift({html:fileSpan(f),arg:f,cb:function (arg)
            {
                return post.emit('loadFile',arg)
            }})
        }
        getMenu = function (template, name)
        {
            var item

            var list1 = _k_.list(template)
            for (var _b_ = 0; _b_ < list1.length; _b_++)
            {
                item = list1[_b_]
                if (item.text === name)
                {
                    return item
                }
            }
        }
        if (RecentMenu.length)
        {
            if (fileMenu = getMenu(opt.items,'File'))
            {
                fileMenu.menu = [{text:'Recent',menu:RecentMenu},{text:''}].concat(fileMenu.menu)
            }
        }
        opt.x = absPos.x
        opt.y = absPos.y
        opt.selectFirstItem = false
        pup = popup.menu(opt)
        act = function (event, fnc)
        {
            stopEvent(event)
            fnc()
            return pup.close({all:true,focus:true})
        }
        ti = (split.terminalVisible() ? '' : '')
        bi = (split.browserVisible() ? '' : '')
        qiq = (prefs.get('list|active') ? '' : ' quickmenu-inactive')
        quiq = elem({class:'quickmenu',children:[elem({text:bi,class:'quickmenu-item quickmenu-browser',mouseup:(function (e)
        {
            return act(e,window.quickMenu.onBrowser)
        })}),elem({text:ti,class:'quickmenu-item quickmenu-terminal',mouseup:(function (e)
        {
            return act(e,window.quickMenu.onTerminal)
        })}),elem({text:'',class:'quickmenu-item quickmenu-devtools',mouseup:(function (e)
        {
            return act(e,window.quickMenu.onDevTools)
        })}),elem({text:'',class:'quickmenu-item quickmenu-kalk',mouseup:(function (e)
        {
            return act(e,window.quickMenu.onKalk)
        })}),elem({text:'',class:`quickmenu-item quickmenu-list${qiq}`,mouseup:(function (e)
        {
            return act(e,window.quickMenu.onList)
        })})]})
        if (window.navigate.canNavigateBack())
        {
            quiq.appendChild(elem({text:'',class:'quickmenu-item quickmenu-navigate',mouseup:function (e)
            {
                return act(e,function ()
                {
                    return post.emit('menuAction','Navigate Backward')
                })
            }}))
        }
        if (window.navigate.canNavigateForward())
        {
            quiq.appendChild(elem({text:'',class:'quickmenu-item quickmenu-navigate',mouseup:function (e)
            {
                return act(e,function ()
                {
                    return post.emit('menuAction','Navigate Forward')
                })
            }}))
        }
        pup.items.insertBefore(quiq,pup.items.firstChild)
        pup.select(quiq)
        return pup
    }

    FileEditor.prototype["clickAtPos"] = function (p, event)
    {
        if (event.metaKey)
        {
            if (kpos(event).x <= this.size.numbersWidth)
            {
                this.singleCursorAtPos(p)
                return
            }
        }
        return FileEditor.__super__.clickAtPos.call(this,p,event)
    }

    FileEditor.prototype["handleModKeyComboCharEvent"] = function (mod, key, combo, char, event)
    {
        var split

        if ('unhandled' !== FileEditor.__super__.handleModKeyComboCharEvent.call(this,mod,key,combo,char,event))
        {
            return
        }
        switch (combo)
        {
            case 'alt+ctrl+enter':
                return window.commandline.commands.coffee.executeText(this.textOfSelectionForClipboard())

            case 'alt+ctrl+shift+enter':
                return window.commandline.commands.coffee.executeTextInMain(this.textOfSelectionForClipboardt())

            case 'esc':
                split = window.split
                if (split.terminalVisible())
                {
                    split.hideTerminal()
                }
                else if (split.commandlineVisible())
                {
                    split.hideCommandline()
                }
                return

        }

        return 'unhandled'
    }

    return FileEditor
})()

export default FileEditor;
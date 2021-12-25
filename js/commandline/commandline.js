// monsterkodi/kode 0.223.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, noon: function (obj) { var pad = function (s, l) { while (s.length < l) { s += ' ' }; return s }; var esc = function (k, arry) { var es, sp; if (0 <= k.indexOf('\n')) { sp = k.split('\n'); es = sp.map(function (s) { return esc(s,arry) }); es.unshift('...'); es.push('...'); return es.join('\n') } if (k === '' || k === '...' || _k_.in(k[0],[' ','#','|']) || _k_.in(k[k.length - 1],[' ','#','|'])) { k = '|' + k + '|' } else if (arry && /  /.test(k)) { k = '|' + k + '|' }; return k }; var pretty = function (o, ind, seen) { var k, kl, l, v, mk = 4; if (Object.keys(o).length > 1) { for (k in o) { if (Object.hasOwn(o,k)) { kl = parseInt(Math.ceil((k.length + 2) / 4) * 4); mk = Math.max(mk,kl); if (mk > 32) { mk = 32; break } } } }; l = []; var keyValue = function (k, v) { var i, ks, s, vs; s = ind; k = esc(k,true); if (k.indexOf('  ') > 0 && k[0] !== '|') { k = `|${k}|` } else if (k[0] !== '|' && k[k.length - 1] === '|') { k = '|' + k } else if (k[0] === '|' && k[k.length - 1] !== '|') { k += '|' }; ks = pad(k,Math.max(mk,k.length + 2)); i = pad(ind + '    ',mk); s += ks; vs = toStr(v,i,false,seen); if (vs[0] === '\n') { while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) } }; s += vs; while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) }; return s }; for (k in o) { if (Object.hasOwn(o,k)) { l.push(keyValue(k,o[k])) } }; return l.join('\n') }; var toStr = function (o, ind = '', arry = false, seen = []) { var s, t, v; if (!(o != null)) { if (o === null) { return 'null' }; if (o === undefined) { return 'undefined' }; return '<?>' }; switch (t = typeof(o)) { case 'string': {return esc(o,arry)}; case 'object': { if (_k_.in(o,seen)) { return '<v>' }; seen.push(o); if ((o.constructor != null ? o.constructor.name : undefined) === 'Array') { s = ind !== '' && arry && '.' || ''; if (o.length && ind !== '') { s += '\n' }; s += (function () { var result = []; var list = _k_.list(o); for (var li = 0; li < list.length; li++)  { v = list[li];result.push(ind + toStr(v,ind + '    ',true,seen))  } return result }).bind(this)().join('\n') } else if ((o.constructor != null ? o.constructor.name : undefined) === 'RegExp') { return o.source } else { s = (arry && '.\n') || ((ind !== '') && '\n' || ''); s += pretty(o,ind,seen) }; return s } default: return String(o) }; return '<???>' }; return toStr(obj) }}

var $, Commandline, elem, filelist, kerror, kxk, post, slash, stopEvent, TextEditor

kxk = require('kxk')
$ = kxk.$
elem = kxk.elem
filelist = kxk.filelist
kerror = kxk.kerror
noon = kxk.noon
post = kxk.post
slash = kxk.slash
stopEvent = kxk.stopEvent

TextEditor = require('../editor/texteditor')

Commandline = (function ()
{
    _k_.extend(Commandline, TextEditor)
    function Commandline (viewElem)
    {
        this["onCmmdClick"] = this["onCmmdClick"].bind(this)
        this["onSplit"] = this["onSplit"].bind(this)
        this["restore"] = this["restore"].bind(this)
        this["stash"] = this["stash"].bind(this)
        this["onSearchText"] = this["onSearchText"].bind(this)
        Commandline.__super__.constructor.call(this,viewElem,{features:[],fontSize:24,syntaxName:'commandline'})
        this.mainCommands = ['browse','goto','open','search','find','macro']
        this.hideCommands = ['selecto','Browse','shelf']
        this.size.lineHeight = 30
        this.scroll.setLineHeight(this.size.lineHeight)
        this.button = $('commandline-button')
        this.button.classList.add('empty')
        this.button.addEventListener('mousedown',this.onCmmdClick)
        this.commands = {}
        this.command = null
        this.loadCommands()
        post.on('split',this.onSplit)
        post.on('restore',this.restore)
        post.on('stash',this.stash)
        post.on('searchText',this.onSearchText)
        this.view.onblur = (function ()
        {
            var _42_17_, _44_20_

            this.button.classList.remove('active')
            ;(this.list != null ? this.list.remove() : undefined)
            this.list = null
            return (this.command != null ? this.command.onBlur() : undefined)
        }).bind(this)
        this.view.onfocus = (function ()
        {
            var _1_8_

            return this.button.className = `commandline-button active ${(this.command != null ? this.command.prefsID : undefined)}`
        }).bind(this)
    }

    Commandline.prototype["onSearchText"] = function (text)
    {
        var _58_23_

        if (window.split.commandlineVisible())
        {
            if (!(_k_.in((this.command != null ? this.command.prefsID : undefined),['search','find'])))
            {
                this.startCommand('find')
            }
        }
        this.commands.find.currentText = text
        this.commands.search.currentText = text
        return this.setAndSelectText(text)
    }

    Commandline.prototype["stash"] = function ()
    {
        var _72_19_

        if ((this.command != null))
        {
            return window.stash.set('commandline',this.command.state())
        }
    }

    Commandline.prototype["restore"] = function ()
    {
        var activeID, name, state, _79_29_, _81_27_, _89_41_

        state = window.stash.get('commandline')
        this.setText(((_79_29_=(state != null ? state.text : undefined)) != null ? _79_29_ : ""))
        name = ((_81_27_=(state != null ? state.name : undefined)) != null ? _81_27_ : 'open')
        if (this.command = this.commandForName(name))
        {
            activeID = document.activeElement.id
            if (activeID.startsWith('column'))
            {
                activeID = 'editor'
            }
            this.command.setReceiver(activeID !== 'commandline-editor' && activeID || null)
            this.setName(name)
            this.button.className = `commandline-button active ${this.command.prefsID}`
            return (this.commands[name] != null ? typeof (_89_41_=this.commands[name].restoreState) === "function" ? _89_41_(state) : undefined : undefined)
        }
    }

    Commandline.prototype["loadCommands"] = function ()
    {
        var command, commandClass, file, files

        files = filelist(`${__dirname}/../commands`)
        var list = _k_.list(files)
        for (var _100_17_ = 0; _100_17_ < list.length; _100_17_++)
        {
            file = list[_100_17_]
            if (slash.ext(file) !== 'js')
            {
                continue
            }
            try
            {
                commandClass = require(file)
                command = new commandClass(this)
                command.setPrefsID(commandClass.name.toLowerCase())
                this.commands[command.prefsID] = command
            }
            catch (err)
            {
                _k_.noon(err)
                kerror(`can't load command from file '${file}': ${err}`)
                throw err
            }
        }
    }

    Commandline.prototype["setName"] = function (name)
    {
        this.button.innerHTML = name
        return this.layers.style.width = this.view.style.width
    }

    Commandline.prototype["setLines"] = function (l)
    {
        this.scroll.reset()
        return Commandline.__super__.setLines.call(this,l)
    }

    Commandline.prototype["setAndSelectText"] = function (t)
    {
        this.setLines([(t != null ? t : '')])
        this.selectAll()
        return this.selectSingleRange(this.rangeForLineAtIndex(0))
    }

    Commandline.prototype["setText"] = function (t)
    {
        this.setLines([(t != null ? t : '')])
        return this.singleCursorAtPos([this.line(0).length,0])
    }

    Commandline.prototype["changed"] = function (changeInfo)
    {
        var _1_8_, _145_20_

        this.hideList()
        Commandline.__super__.changed.call(this,changeInfo)
        if (changeInfo.changes.length)
        {
            this.button.className = `commandline-button active ${(this.command != null ? this.command.prefsID : undefined)}`
            return (this.command != null ? this.command.changed(this.line(0)) : undefined)
        }
    }

    Commandline.prototype["onSplit"] = function (s)
    {
        var _149_16_, _149_23_

        ;((_149_16_=this.command) != null ? typeof (_149_23_=_149_16_.onBot) === "function" ? _149_23_(s[1]) : undefined : undefined)
        return this.positionList()
    }

    Commandline.prototype["startCommand"] = function (name)
    {
        var activeID, r, _160_20_

        r = (this.command != null ? this.command.cancel(name) : undefined)
        if ((r != null ? r.status : undefined) === 'ok')
        {
            this.results(r)
            return
        }
        window.split.showCommandline()
        if (this.command = this.commandForName(name))
        {
            activeID = document.activeElement.id
            if (activeID.startsWith('column'))
            {
                activeID = 'editor'
            }
            if (activeID && activeID !== 'commandline-editor')
            {
                this.command.setReceiver(activeID)
            }
            this.lastFocus = window.lastFocus
            this.view.focus()
            this.setName(name)
            this.results(this.command.start(name))
            if (_k_.in(name,['search','find']))
            {
                window.textEditor.highlightTextOfSelectionOrWordAtCursor()
                this.view.focus()
            }
            return this.button.className = `commandline-button active ${this.command.prefsID}`
        }
        else
        {
            return kerror(`no command ${name}`)
        }
    }

    Commandline.prototype["commandForName"] = function (name)
    {
        var c, n

        for (n in this.commands)
        {
            c = this.commands[n]
            if (n === name || _k_.in(name,c.names))
            {
                return c
            }
        }
    }

    Commandline.prototype["execute"] = function ()
    {
        var _199_33_

        return this.results((this.command != null ? this.command.execute(this.line(0)) : undefined))
    }

    Commandline.prototype["results"] = function (r)
    {
        var _209_34_, _210_34_, _212_47_, _213_48_, _214_45_

        if (((r != null ? r.name : undefined) != null))
        {
            this.setName(r.name)
        }
        if (((r != null ? r.text : undefined) != null))
        {
            this.setText(r.text)
        }
        ;(r != null ? r.select : undefined) ? this.selectAll() : this.selectNone()
        if (((r != null ? r.show : undefined) != null))
        {
            window.split.show(r.show)
        }
        if (((r != null ? r.focus : undefined) != null))
        {
            window.split.focus(r.focus)
        }
        if (((r != null ? r.do : undefined) != null))
        {
            window.split.do(r.do)
        }
        return this
    }

    Commandline.prototype["cancel"] = function ()
    {
        var _217_32_

        return this.results((this.command != null ? this.command.cancel() : undefined))
    }

    Commandline.prototype["clear"] = function ()
    {
        var _220_29_

        if (this.text() === '')
        {
            return this.results((this.command != null ? this.command.clear() : undefined))
        }
        else
        {
            return Commandline.__super__.clear.call(this)
        }
    }

    Commandline.prototype["onCmmdClick"] = function (event)
    {
        var _232_20_, _236_16_, _236_26_

        if (!(this.list != null))
        {
            this.list = elem({class:'list commands'})
            this.positionList()
            window.split.elem.appendChild(this.list)
        }
        ;((_236_16_=this.command) != null ? typeof (_236_26_=_236_16_.hideList) === "function" ? _236_26_() : undefined : undefined)
        this.listCommands()
        this.focus()
        this.positionList()
        return stopEvent(event)
    }

    Commandline.prototype["listCommands"] = function ()
    {
        var ci, cmmd, cname, div, name, namespan, start

        this.list.innerHTML = ""
        this.list.style.display = 'unset'
        var list = _k_.list(this.mainCommands)
        for (var _246_17_ = 0; _246_17_ < list.length; _246_17_++)
        {
            name = list[_246_17_]
            cmmd = this.commands[name]
            for (var _248_23_ = ci = 0, _248_27_ = cmmd.names.length; (_248_23_ <= _248_27_ ? ci < cmmd.names.length : ci > cmmd.names.length); (_248_23_ <= _248_27_ ? ++ci : --ci))
            {
                cname = cmmd.names[ci]
                if (_k_.in(cname,this.hideCommands))
                {
                    continue
                }
                div = elem({class:"list-item"})
                namespan = `<span class=\"ko command ${cmmd.prefsID}\" style=\"position:absolute; left: ${ci > 0 && 80 || 12}px\">${cname}</span>`
                div.innerHTML = namespan
                start = (function (name)
                {
                    return (function (event)
                    {
                        this.hideList()
                        this.startCommand(name)
                        return stopEvent(event)
                    }).bind(this)
                }).bind(this)
                div.addEventListener('mousedown',start(cname))
                this.list.appendChild(div)
            }
        }
    }

    Commandline.prototype["hideList"] = function ()
    {
        var _263_13_

        ;(this.list != null ? this.list.remove() : undefined)
        return this.list = null
    }

    Commandline.prototype["positionList"] = function ()
    {
        var flex, listHeight, listTop, spaceAbove, spaceBelow, _274_27_

        if (!(this.list != null))
        {
            return
        }
        listHeight = this.list.getBoundingClientRect().height
        flex = window.split.flex
        listTop = flex.posOfPane(2)
        spaceBelow = flex.size() - listTop
        spaceAbove = flex.sizeOfPane(0)
        if (spaceBelow < listHeight && spaceAbove > spaceBelow)
        {
            listTop = spaceAbove - listHeight
        }
        if (this.list)
        {
            return this.list.style.top = `${listTop}px`
        }
    }

    Commandline.prototype["resized"] = function ()
    {
        var _286_13_, _286_22_, _287_16_, _287_29_

        ;((_286_13_=this.list) != null ? typeof (_286_22_=_286_13_.resized) === "function" ? _286_22_() : undefined : undefined)
        ;((_287_16_=this.command) != null ? (_287_29_=_287_16_.commandList) != null ? _287_29_.resized() : undefined : undefined)
        return Commandline.__super__.resized.call(this)
    }

    Commandline.prototype["focusTerminal"] = function ()
    {
        if (window.terminal.numLines() === 0)
        {
            window.terminal.singleCursorAtPos([0,0])
        }
        return window.split.do("focus terminal")
    }

    Commandline.prototype["handleMenuAction"] = function (name, opt)
    {
        if ((opt != null ? opt.command : undefined))
        {
            if (this.commandForName(opt.command))
            {
                this.startCommand(opt.command)
                return
            }
        }
        return 'unhandled'
    }

    Commandline.prototype["globalModKeyComboEvent"] = function (mod, key, combo, event)
    {
        var _317_19_

        if (combo === 'esc')
        {
            if (document.activeElement === this.view)
            {
                stopEvent(event)
                return this.cancel()
            }
        }
        if ((this.command != null))
        {
            return this.command.globalModKeyComboEvent(mod,key,combo,event)
        }
        return 'unhandled'
    }

    Commandline.prototype["handleModKeyComboCharEvent"] = function (mod, key, combo, char, event)
    {
        var split, _1_8_, _324_19_, _332_55_, _333_55_, _343_58_

        if ((this.command != null))
        {
            if ('unhandled' !== this.command.handleModKeyComboEvent(mod,key,combo,event))
            {
                return
            }
        }
        split = window.split
        switch (combo)
        {
            case 'enter':
                return this.execute()

            case 'command+enter':
                return this.execute() + window.split.do(`focus ${(this.command != null ? this.command.focus : undefined)}`)

            case 'command+shift+enter':
                return this.focusTerminal()

            case 'up':
                return (this.command != null ? this.command.selectListItem('up') : undefined)

            case 'down':
                return (this.command != null ? this.command.selectListItem('down') : undefined)

            case 'esc':
                return this.cancel()

            case 'command+k':
                return this.clear()

            case 'shift+tab':
                return

            case 'home':
            case 'command+up':
                return split.do('maximize editor')

            case 'end':
            case 'command+down':
                return split.do('minimize editor')

            case 'alt+up':
                return split.do('enlarge editor')

            case 'ctrl+up':
                return split.do('enlarge editor by 20')

            case 'alt+down':
                return split.do('reduce editor')

            case 'ctrl+down':
                return split.do('reduce editor by 20')

            case 'right':
            case 'tab':
                if ((this.command != null ? this.command.onTabCompletion(combo) : undefined))
                {
                    return
                }
                break
        }

        return Commandline.__super__.handleModKeyComboCharEvent.call(this,mod,key,combo,char,event)
    }

    return Commandline
})()

module.exports = Commandline
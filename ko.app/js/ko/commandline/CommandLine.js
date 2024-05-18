var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, dir: function () { let url = import.meta.url.substring(7); let si = url.lastIndexOf('/'); return url.substring(0, si); }, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, trim: function (s,c=' ') {return _k_.ltrim(_k_.rtrim(s,c),c)}, ltrim: function (s,c=' ') { while (_k_.in(s[0],c)) { s = s.slice(1) } return s}, rtrim: function (s,c=' ') {while (_k_.in(s.slice(-1)[0],c)) { s = s.slice(0, s.length - 1) } return s}}

var CommandLine

import kxk from "../../kxk.js"
let ffs = kxk.ffs
let elem = kxk.elem
let post = kxk.post
let slash = kxk.slash
let stopEvent = kxk.stopEvent
let $ = kxk.$

import TextEditor from "../editor/TextEditor.js"


CommandLine = (function ()
{
    _k_.extend(CommandLine, TextEditor)
    CommandLine["commandModules"] = {}
    CommandLine["init"] = async function ()
    {
        var commandModule, file, files

        files = await ffs.list(slash.path(_k_.dir(),'../commands'))
        var list = _k_.list(files)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            file = list[_a_]
            if (!(_k_.in(slash.ext(file.path),['js','mjs'])))
            {
                continue
            }
            try
            {
                commandModule = await import(file.path)
            }
            catch (err)
            {
                console.error(`can't import command from file '${file.path}': ${err}`)
                throw err
            }
            try
            {
                CommandLine.commandModules[commandModule.default.name.toLowerCase()] = commandModule.default
            }
            catch (err)
            {
                console.error(`can't create command '${commandClass}': ${err}`)
                throw err
            }
        }
    }

    function CommandLine (viewElem)
    {
        var commandModule, name

        this["onCmmdClick"] = this["onCmmdClick"].bind(this)
        this["onSplit"] = this["onSplit"].bind(this)
        this["onSearchText"] = this["onSearchText"].bind(this)
        this["onStashLoaded"] = this["onStashLoaded"].bind(this)
        this["stash"] = this["stash"].bind(this)
        CommandLine.__super__.constructor.call(this,viewElem,{features:[],fontSize:24,syntaxName:'commandline'})
        this.mainCommands = ['goto','open','macro','browse','search','find']
        this.hideCommands = ['selecto','shelf']
        this.size.lineHeight = 30
        this.scroll.setLineHeight(this.size.lineHeight)
        this.button = $('commandline-button')
        this.button.classList.add('empty')
        this.button.addEventListener('mousedown',this.onCmmdClick)
        this.commands = {}
        for (name in CommandLine.commandModules)
        {
            commandModule = CommandLine.commandModules[name]
            this.commands[name] = new commandModule(this)
            this.commands[name].prefsID = name
        }
        this.command = null
        post.on('split',this.onSplit)
        post.on('stashLoaded',this.onStashLoaded)
        post.on('stash',this.stash)
        post.on('searchText',this.onSearchText)
        this.view.onblur = (function ()
        {
            var _75_17_, _77_20_

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

    CommandLine.prototype["stash"] = function ()
    {
        var _90_19_

        if ((this.command != null))
        {
            return window.stash.set('commandline',this.command.state())
        }
    }

    CommandLine.prototype["onStashLoaded"] = function ()
    {
        var activeID, name, state, _107_41_, _97_29_, _99_27_

        state = window.stash.get('commandline')
        this.setText(((_97_29_=(state != null ? state.text : undefined)) != null ? _97_29_ : ""))
        name = ((_99_27_=(state != null ? state.name : undefined)) != null ? _99_27_ : 'open')
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
            return (this.commands[name] != null ? typeof (_107_41_=this.commands[name].restoreState) === "function" ? _107_41_(state) : undefined : undefined)
        }
    }

    CommandLine.prototype["onSearchText"] = function (text)
    {
        var _118_23_

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

    CommandLine.prototype["setName"] = function (name)
    {
        this.button.innerHTML = name
        return this.layers.style.width = this.view.style.width
    }

    CommandLine.prototype["setLines"] = function (l)
    {
        this.scroll.reset()
        return CommandLine.__super__.setLines.call(this,l)
    }

    CommandLine.prototype["setAndSelectText"] = function (t)
    {
        this.setLines([(t != null ? t : '')])
        this.selectAll()
        return this.selectSingleRange(this.rangeForLineAtIndex(0))
    }

    CommandLine.prototype["setText"] = function (t)
    {
        var _143_26_

        this.setLines([(t != null ? t : '')])
        return (typeof this.singleCursorAtPos === "function" ? this.singleCursorAtPos([this.line(0).length,0]) : undefined)
    }

    CommandLine.prototype["changed"] = function (changeInfo)
    {
        var _1_8_, _157_20_

        this.hideList()
        CommandLine.__super__.changed.call(this,changeInfo)
        if (changeInfo.changes.length)
        {
            this.button.className = `commandline-button active ${(this.command != null ? this.command.prefsID : undefined)}`
            return (this.command != null ? this.command.changed(this.line(0)) : undefined)
        }
    }

    CommandLine.prototype["onSplit"] = function (s)
    {
        var _161_16_, _161_23_

        ;((_161_16_=this.command) != null ? typeof (_161_23_=_161_16_.onBot) === "function" ? _161_23_(s[1]) : undefined : undefined)
        return this.positionList()
    }

    CommandLine.prototype["startCommand"] = function (name)
    {
        var activeID, r, _172_20_

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
            console.error(`no command ${name}`)
        }
    }

    CommandLine.prototype["commandForName"] = function (name)
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

    CommandLine.prototype["execute"] = function ()
    {
        var _212_33_

        return this.results((this.command != null ? this.command.execute(this.line(0)) : undefined))
    }

    CommandLine.prototype["results"] = function (r)
    {
        var _222_34_, _223_34_, _225_47_, _226_48_, _227_45_

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

    CommandLine.prototype["cancel"] = function ()
    {
        var _230_32_

        return this.results((this.command != null ? this.command.cancel() : undefined))
    }

    CommandLine.prototype["clear"] = function ()
    {
        var _233_29_

        if (this.text() === '')
        {
            return this.results((this.command != null ? this.command.clear() : undefined))
        }
        else
        {
            return CommandLine.__super__.clear.call(this)
        }
    }

    CommandLine.prototype["onCmmdClick"] = function (event)
    {
        var _245_20_, _249_16_

        if (!(this.list != null))
        {
            this.list = elem({class:'list commands'})
            this.positionList()
            window.split.elem.appendChild(this.list)
        }
        ;(this.command != null ? this.command.hideList() : undefined)
        this.listCommands()
        this.focus()
        this.positionList()
        return stopEvent(event)
    }

    CommandLine.prototype["listCommands"] = function ()
    {
        var ci, cmmd, cname, div, name, start

        this.list.innerHTML = ""
        this.list.style.display = 'unset'
        var list = _k_.list(this.mainCommands)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            name = list[_a_]
            cmmd = this.commands[name]
            if (_k_.empty(cmmd))
            {
                continue
            }
            for (var _b_ = ci = 0, _c_ = cmmd.names.length; (_b_ <= _c_ ? ci < cmmd.names.length : ci > cmmd.names.length); (_b_ <= _c_ ? ++ci : --ci))
            {
                cname = cmmd.names[ci]
                if (_k_.in(cname,this.hideCommands))
                {
                    continue
                }
                div = elem({class:'list-item'})
                div.innerHTML = `<span class=\"ko command ${cmmd.prefsID}\" style=\"position:absolute; left: ${ci > 0 && 80 || 12}px\">${cname}</span>`
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

    CommandLine.prototype["hideList"] = function ()
    {
        var _278_13_

        ;(this.list != null ? this.list.remove() : undefined)
        return this.list = null
    }

    CommandLine.prototype["positionList"] = function ()
    {
        var flex, listHeight, listTop, spaceAbove, spaceBelow, _289_27_

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

    CommandLine.prototype["resized"] = function ()
    {
        var _301_13_, _301_22_, _302_16_, _302_29_

        ;((_301_13_=this.list) != null ? typeof (_301_22_=_301_13_.resized) === "function" ? _301_22_() : undefined : undefined)
        ;((_302_16_=this.command) != null ? (_302_29_=_302_16_.commandList) != null ? _302_29_.resized() : undefined : undefined)
        return CommandLine.__super__.resized.call(this)
    }

    CommandLine.prototype["focusTerminal"] = function ()
    {
        if (window.terminal.numLines() === 0)
        {
            window.terminal.singleCursorAtPos([0,0])
        }
        return window.split.do("focus terminal")
    }

    CommandLine.prototype["handleMenuAction"] = function (name, trail)
    {
        var cmd, cmdName, rest, st

        if ((trail != null ? trail.split('Command▸').length : undefined) > 1)
        {
            rest = trail.split('Command▸')[1]
            cmdName = rest.split('▸')[0]
            if (name !== 'Case Sensitive')
            {
                cmdName = cmdName.toLowerCase()
            }
        }
        else if ((trail != null ? trail.endsWith('Command') : undefined))
        {
            cmdName = name.toLowerCase()
        }
        if (cmd = this.commandForName(cmdName))
        {
            this.startCommand(cmdName)
            if (_k_.in(cmdName,['goto','open','macro']))
            {
                true
            }
            else if (_k_.in(cmdName,['search','Search']))
            {
                st = _k_.trim(this.text())
                if (st.length > 1)
                {
                    this.command.execute(this.text())
                    window.split.do('show terminal')
                }
            }
            else
            {
                this.command.execute(name)
            }
            return
        }
        return 'unhandled'
    }

    CommandLine.prototype["globalModKeyComboEvent"] = function (mod, key, combo, event)
    {
        var _354_19_

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

    CommandLine.prototype["handleModKeyComboCharEvent"] = function (mod, key, combo, char, event)
    {
        var split, _1_8_, _362_19_, _370_55_, _371_55_, _381_58_

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

        return CommandLine.__super__.handleModKeyComboCharEvent.call(this,mod,key,combo,char,event)
    }

    return CommandLine
})()

export default CommandLine;
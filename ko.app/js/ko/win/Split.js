var _k_

import kxk from "../../kxk.js"
let post = kxk.post
let $ = kxk.$

import flex from "./flex/flex.js"

class Split
{
    constructor ()
    {
        this.resized = this.resized.bind(this)
        this.hideTerminal = this.hideTerminal.bind(this)
        this.hideEditor = this.hideEditor.bind(this)
        this.onStashLoaded = this.onStashLoaded.bind(this)
        this.stash = this.stash.bind(this)
        this.emitSplit = this.emitSplit.bind(this)
        this.onDrag = this.onDrag.bind(this)
        2 + 2
        this.commandlineHeight = 30
        this.elem = $('split')
        this.terminal = $('terminal')
        this.browser = $('browser')
        this.commandline = $('commandline')
        this.editor = $('editor')
        post.on('focus',this.focus)
        post.on('stash',this.stash)
        post.on('stashLoaded',this.onStashLoaded)
        this.flex = new flex({panes:[{div:this.terminal,collapsed:true},{div:this.commandline,fixed:this.commandlineHeight},{div:this.editor}],direction:'vertical',onDrag:this.onDrag,onDragEnd:this.onDrag,onPaneSize:this.onDrag,snapFirst:20,snapLast:100})
    }

    onDrag ()
    {
        var _51_23_

        if ((this.flex != null))
        {
            return this.emitSplit()
        }
    }

    emitSplit ()
    {
        return post.emit('split',this.flex.panePositions())
    }

    stash ()
    {
        stash.set('split|flex',this.flex.getState())
        stash.set('split|browser',this.flex.panes[0].div === this.browser)
        console.log('Split.stash',stash.get('split'))
    }

    onStashLoaded ()
    {
        var state

        console.log('onStashLoaded',stash.get('split|flex'))
        if (state = window.stash.get('split|flex'))
        {
            this.flex.restoreState(state)
            this.emitSplit()
        }
        else
        {
            this.do('maximize editor')
        }
        if (this.flex.panes[0].div !== this.browser && window.stash.get('split|browser'))
        {
            return this.raise('browser')
        }
    }

    do (sentence)
    {
        var action, delta, pos, what, words

        sentence = sentence.trim()
        if (!sentence.length)
        {
            return
        }
        words = sentence.split(/\s+/)
        action = words[0]
        what = words[1]
        switch (action)
        {
            case 'show':
                return this.show(what)

            case 'focus':
                return this.focus(what)

            case 'half':
                pos = this.flex.size() / 2
                break
            case 'third':
                pos = this.flex.size() / 3
                break
            case 'quart':
                pos = this.flex.size() / 4
                break
            case 'maximize':
                if (what === 'editor')
                {
                    return this.maximizeEditor()
                }
                if (what === 'terminal')
                {
                    return this.maximizeTerminal()
                }
                delta = this.flex.size()
                break
            case 'minimize':
                if (what === 'editor')
                {
                    return this.minimizeEditor()
                }
                delta = -this.flex.size()
                break
            case 'enlarge':
                if (words[2] === 'by')
                {
                    delta = parseInt(words[3])
                }
                else
                {
                    delta = parseInt(0.25 * this.termEditHeight())
                }
                break
            case 'reduce':
                if (words[2] === 'by')
                {
                    delta = -
                    parseInt(words[3])
                }
                else
                {
                    delta = -
                    parseInt(0.25 * this.termEditHeight())
                }
                break
            default:
                return console.error(`Split.do -- unknown action '${action}'`)
        }

        switch (what)
        {
            case 'editor':
                if ((delta != null))
                {
                    return this.moveCommandLineBy(-delta)
                }
                if ((pos != null))
                {
                    return this.flex.moveHandleToPos(this.flex.handles[0],pos)
                }
                break
            case 'terminal':
            case 'browser':
            case 'commandline':
                if (what !== 'commandline')
                {
                    this.raise(what)
                }
                if ((delta != null))
                {
                    return this.moveCommandLineBy(delta)
                }
                if ((pos != null))
                {
                    return this.flex.moveHandleToPos(this.flex.handles[0],pos)
                }
                break
            default:
                console.error(`Split.do -- unhandled do command? ${sentence}?`)
        }

    }

    maximizeTerminal ()
    {
        this.focus('terminal')
        this.flex.expand('terminal')
        this.hideEditor()
        this.flex.resized()
        return this.stash()
    }

    maximizeEditor ()
    {
        this.focus('editor')
        this.flex.expand('editor')
        if (this.terminalHeight() > 0)
        {
            this.hideTerminal()
        }
        else
        {
            this.hideCommandline()
        }
        this.flex.resized()
        return this.stash()
    }

    minimizeEditor ()
    {
        this.showCommandline()
        this.focus('commandline')
        this.flex.moveHandleToPos(this.flex.handles[1],this.flex.size())
        return this.stash()
    }

    show (n)
    {
        switch (n)
        {
            case 'terminal':
            case 'browser':
                this.raise(n)
                break
            case 'editor':
                this.flex.expand('editor')
                if (this.editorHeight() < this.flex.size() / 3)
                {
                    if ((this.flex.handles[1] != null ? this.flex.handles[1].pos() : undefined) > this.flex.size() / 3)
                    {
                        this.flex.moveHandleToPos(this.flex.handles[1],this.flex.size() / 3)
                    }
                    if ((this.flex.handles[2] != null ? this.flex.handles[2].pos() : undefined) < 2 * this.flex.size() / 3)
                    {
                        this.flex.moveHandleToPos(this.flex.handles[2],2 * this.flex.size() / 3)
                    }
                }
                break
            case 'command':
                this.flex.expand('commandline')
                break
            default:
                console.error(`split.show -- unhandled: ${n}!`)
        }

        return this.stash()
    }

    hideEditor ()
    {
        return this.flex.collapse('editor')
    }

    hideTerminal ()
    {
        return this.flex.collapse('terminal')
    }

    swap (old, nju)
    {
        if (this.flex.panes[0].div !== nju)
        {
            nju.style.height = `${this.flex.sizeOfPane(0)}px`
            old.style.display = 'none'
            nju.style.display = 'block'
            return this.flex.panes[0].div = nju
        }
    }

    raise (n)
    {
        switch (n)
        {
            case 'terminal':
                this.swap(this.browser,this.terminal)
                break
            case 'browser':
                this.swap(this.terminal,this.browser)
                break
        }

        this.flex.calculate()
        if (n === 'editor')
        {
            if (this.editorHeight() < this.flex.size() / 8)
            {
                return this.flex.moveHandleToPos(this.flex.handles[0],3 * this.flex.size() / 4)
            }
        }
        else
        {
            if (this.terminalHeight() < this.flex.size() / 8)
            {
                return this.flex.moveHandleToPos(this.flex.handles[0],this.flex.size() / 4)
            }
        }
    }

    moveCommandLineBy (deta)
    {
        return this.flex.moveHandle({index:1,pos:this.flex.posOfHandle(1) + delta})
    }

    hideCommandline ()
    {
        if (!this.flex.isCollapsed('commandline'))
        {
            this.flex.collapse('terminal')
            this.flex.collapse('commandline')
            return post.emit('commandline','hidden')
        }
    }

    showCommandline ()
    {
        if (this.flex.isCollapsed('commandline'))
        {
            this.flex.expand('commandline')
            return post.emit('commandline','shown')
        }
    }

    focus (n)
    {
        var e, _255_31_, _259_22_

        if (n === 'commandline')
        {
            n = 'commandline-editor'
        }
        if (n === '.' || !($(n) != null))
        {
            return console.error(`Split.focus -- can't find element '${n}'`)
        }
        if (e = $(n))
        {
            if ((e.focus != null))
            {
                window.setLastFocus(n)
                return e.focus()
            }
        }
    }

    focusAnything ()
    {
        if (this.editorVisible())
        {
            return this.focus('editor')
        }
        if (this.terminalVisible())
        {
            return this.focus('terminal')
        }
        return this.focus('commandline-editor')
    }

    resized ()
    {
        var main

        main = $('main')
        this.elem.style.width = `${main.clientWidth}px`
        this.elem.style.height = `${main.clientHeight}px`
        this.flex.resized()
        return this.emitSplit()
    }

    elemHeight ()
    {
        return this.elem.getBoundingClientRect().height - this.flex.handleSize
    }

    splitPosY (i)
    {
        return this.flex.posOfHandle(i)
    }

    terminalHeight ()
    {
        return this.flex.sizeOfPane(0)
    }

    editorHeight ()
    {
        return this.flex.sizeOfPane(2)
    }

    termEditHeight ()
    {
        return this.terminalHeight() + this.commandlineHeight + this.editorHeight()
    }

    commandlineVisible ()
    {
        return !this.flex.isCollapsed('commandline')
    }

    editorMaximized ()
    {
        return this.flex.isCollapsed('terminal') || this.terminalHeight() <= 0
    }

    editorVisible ()
    {
        return !this.flex.isCollapsed('editor' && this.editorHeight() > 0)
    }

    browserVisible ()
    {
        return this.terminalHeight() > 0 && this.flex.panes[0].div === this.browser
    }

    terminalVisible ()
    {
        return this.terminalHeight() > 0 && this.flex.panes[0].div === this.terminal
    }
}

export default Split;
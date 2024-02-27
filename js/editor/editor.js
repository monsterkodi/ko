// monsterkodi/kode 0.256.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, isFunc: function (o) {return typeof o === 'function'}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var Buffer, Do, Editor, filelist, kerror, kxk, slash, Syntax, _

kxk = require('kxk')
_ = kxk._
filelist = kxk.filelist
kerror = kxk.kerror
slash = kxk.slash

Buffer = require('./buffer')
Syntax = require('./syntax')
Do = require('./do')

Editor = (function ()
{
    _k_.extend(Editor, Buffer)
    Editor["actions"] = null
    function Editor (name, config)
    {
        Editor.__super__.constructor.call(this)
    
        var _26_27_, _28_50_

        this.name = name
        this.config = (config != null ? config : {})
        this.config.syntaxName = ((_26_27_=this.config.syntaxName) != null ? _26_27_ : 'txt')
        if (!(Editor.actions != null))
        {
            Editor.initActions()
        }
        this.indentString = _.padStart("",4)
        this.stickySelection = false
        this.syntax = new Syntax(this.config.syntaxName,this.line,this.lines)
        this.do = new Do(this)
        this.setupFileType()
    }

    Editor.prototype["del"] = function ()
    {
        return this.do.del()
    }

    Editor["initActions"] = function ()
    {
        var actionFile, actions, k, key, v, value, _62_50_

        this.actions = []
        var list = _k_.list(filelist(slash.join(__dirname,'actions')))
        for (var _53_23_ = 0; _53_23_ < list.length; _53_23_++)
        {
            actionFile = list[_53_23_]
            if (!(_k_.in(slash.ext(actionFile),['js','mjs','coffee','kode'])))
            {
                continue
            }
            actions = require(actionFile)
            for (key in actions)
            {
                value = actions[key]
                if (_k_.isFunc(value))
                {
                    this.prototype[key] = value
                }
                else if (key === 'actions')
                {
                    for (k in value)
                    {
                        v = value[k]
                        if (!_.isString(v))
                        {
                            if (!(v.key != null))
                            {
                                v.key = k
                            }
                            this.actions.push(v)
                        }
                    }
                }
            }
        }
    }

    Editor["actionWithName"] = function (name)
    {
        var action

        var list = _k_.list(Editor.actions)
        for (var _70_19_ = 0; _70_19_ < list.length; _70_19_++)
        {
            action = list[_70_19_]
            if (action.name === name)
            {
                return action
            }
        }
        return null
    }

    Editor.prototype["shebangFileType"] = function ()
    {
        var _81_31_, _81_44_

        return ((_81_44_=(this.config != null ? this.config.syntaxName : undefined)) != null ? _81_44_ : 'txt')
    }

    Editor.prototype["setupFileType"] = function ()
    {
        var newType, oldType

        oldType = this.fileType
        newType = this.shebangFileType()
        if (this.syntax)
        {
            this.syntax.name = newType
        }
        this.setFileType(newType)
        if (oldType !== this.fileType)
        {
            return this.emit('fileTypeChanged',this.fileType)
        }
    }

    Editor.prototype["setFileType"] = function (fileType)
    {
        var cstr, k, key, reg, v

        this.fileType = fileType
    
        this.stringCharacters = {"'":'single','"':'double'}
        switch (this.fileType)
        {
            case 'md':
                this.stringCharacters['*'] = 'bold'
                break
            case 'noon':
                this.stringCharacters['|'] = 'pipe'
                break
        }

        this.bracketCharacters = {open:{'[':']','{':'}','(':')'},close:{},regexps:[]}
        switch (this.fileType)
        {
            case 'html':
                this.bracketCharacters.open['<'] = '>'
                break
        }

        for (k in this.bracketCharacters.open)
        {
            v = this.bracketCharacters.open[k]
            this.bracketCharacters.close[v] = k
        }
        this.bracketCharacters.regexp = []
        var list = ['open','close']
        for (var _123_16_ = 0; _123_16_ < list.length; _123_16_++)
        {
            key = list[_123_16_]
            cstr = _.keys(this.bracketCharacters[key]).join('')
            reg = new RegExp(`[${_.escapeRegExp(cstr)}]`)
            this.bracketCharacters.regexps.push([reg,key])
        }
        this.initSurround()
        this.indentNewLineMore = null
        this.indentNewLineLess = null
        this.insertIndentedEmptyLineBetween = '{}'
        switch (this.fileType)
        {
            case 'coffee':
            case 'kode':
                this.indentNewLineMore = {lineEndsWith:['->','=>',':','='],lineRegExp:/^(\s+when|\s*if|\s*else\s+if\s+)(?!.*\sthen\s)|(^|\s)(else\s*$|switch\s|for\s|while\s|class\s)/}
                break
        }

        this.multiComment = ((function ()
        {
            switch (this.fileType)
            {
                case 'coffee':
                case 'kode':
                    return {open:'###',close:'###'}

                case 'html':
                case 'md':
                    return {open:'<!--',close:'-->'}

                case 'styl':
                case 'cpp':
                case 'mm':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'mjs':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return {open:'/*',close:'*/'}

            }

        }).bind(this))()
        this.lineComment = ((function ()
        {
            switch (this.fileType)
            {
                case 'coffee':
                case 'kode':
                case 'sh':
                case 'bat':
                case 'noon':
                case 'ko':
                case 'txt':
                case 'fish':
                    return '#'

                case 'styl':
                case 'cpp':
                case 'mm':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'mjs':
                case 'scss':
                case 'ts':
                case 'swift':
                case 'frag':
                case 'vert':
                    return '//'

                case 'iss':
                case 'ini':
                    return ';'

            }

        }).bind(this))()
        if (this.lineComment)
        {
            return this.headerRegExp = new RegExp(`^(\\s*${_.escapeRegExp(this.lineComment)}\\s*)?(\\s*0[0\\s]+)$`)
        }
    }

    Editor.prototype["setText"] = function (text = "")
    {
        var lines

        if (this.syntax.name === 'txt')
        {
            this.syntax.name = Syntax.shebang(text.slice(0,text.search(/\r?\n/)))
        }
        lines = text.split(/\n/)
        this.newlineCharacters = '\n'
        if (!_k_.empty(lines))
        {
            if (lines[0].endsWith('\r'))
            {
                lines = text.split(/\r?\n/)
                this.newlineCharacters = '\r\n'
            }
        }
        return this.setLines(lines)
    }

    Editor.prototype["setLines"] = function (lines)
    {
        this.syntax.setLines(lines)
        Editor.__super__.setLines.call(this,lines)
        return this.emit('linesSet',lines)
    }

    Editor.prototype["textOfSelectionForClipboard"] = function ()
    {
        if (this.numSelections())
        {
            return this.textOfSelection()
        }
        else
        {
            return this.textInRanges(this.rangesForCursorLines())
        }
    }

    Editor.prototype["splitStateLineAtPos"] = function (state, pos)
    {
        var l

        l = state.line(pos[1])
        if (!(l != null))
        {
            kerror(`no line at pos ${pos}?`)
        }
        if (!(l != null))
        {
            return ['','']
        }
        return [l.slice(0,pos[0]),l.slice(pos[0])]
    }

    Editor.prototype["emitEdit"] = function (action)
    {
        var line, mc

        mc = this.mainCursor()
        line = this.line(mc[1])
        return this.emit('edit',{action:action,line:line,before:line.slice(0,mc[0]),after:line.slice(mc[0]),cursor:mc})
    }

    Editor.prototype["indentStringForLineAtIndex"] = function (li)
    {
        var e, il, indentLength, line, thisIndent, _240_33_, _241_50_, _247_52_

        while (_k_.empty((this.line(li).trim())) && li > 0)
        {
            li--
        }
        if ((0 <= li && li < this.numLines()))
        {
            il = 0
            line = this.line(li)
            thisIndent = this.indentationAtLineIndex(li)
            indentLength = this.indentString.length
            if ((this.indentNewLineMore != null))
            {
                if ((this.indentNewLineMore.lineEndsWith != null ? this.indentNewLineMore.lineEndsWith.length : undefined))
                {
                    var list = _k_.list(this.indentNewLineMore.lineEndsWith)
                    for (var _242_26_ = 0; _242_26_ < list.length; _242_26_++)
                    {
                        e = list[_242_26_]
                        if (line.trim().endsWith(e))
                        {
                            il = thisIndent + indentLength
                            break
                        }
                    }
                }
                if (il === 0)
                {
                    if ((this.indentNewLineMore.lineRegExp != null) && this.indentNewLineMore.lineRegExp.test(line))
                    {
                        il = thisIndent + indentLength
                    }
                }
            }
            if (il === 0)
            {
                il = thisIndent
            }
            il = Math.max(il,this.indentationAtLineIndex(li + 1))
            return _.padStart("",il)
        }
        else
        {
            return ''
        }
    }

    return Editor
})()

module.exports = Editor
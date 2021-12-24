// monsterkodi/kode 0.212.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var Command, fs, GitInfo, indexer, kerror, kxk, Macro, post, prefs, req, reversed, salt, slash, syntax, Transform, _

kxk = require('kxk')
_ = kxk._
fs = kxk.fs
kerror = kxk.kerror
post = kxk.post
prefs = kxk.prefs
reversed = kxk.reversed
slash = kxk.slash

indexer = require('../main/indexer')
salt = require('../tools/salt')
req = require('../tools/req')
GitInfo = require('../win/gitinfo')
Command = require('../commandline/command')
syntax = require('../editor/syntax')
Transform = require('../editor/actions/transform')

Macro = (function ()
{
    _k_.extend(Macro, Command)
    Macro["macroNames"] = ['clean','help','dbg','class','req','inv','blink','color','fps','cwd','git','unix']
    function Macro (commandline)
    {
        Macro.__super__.constructor.call(this,commandline)
    
        this.macros = Macro.macroNames
        this.macros = this.macros.concat(Transform.transformNames)
        this.names = ['macro']
    }

    Macro.prototype["start"] = function (name)
    {
        Macro.__super__.start.call(this,name)
    
        var text

        text = this.last()
        if (!(text != null ? text.length : undefined))
        {
            text = 'dbg'
        }
        return {text:text,select:true}
    }

    Macro.prototype["listItems"] = function ()
    {
        var i, items

        items = _.uniq(_.concat(reversed(this.history),this.macros))
        return (function () { var _56__74_ = []; var list = _k_.list(items); for (var _56_74_ = 0; _56_74_ < list.length; _56_74_++)  { i = list[_56_74_];_56__74_.push({text:i,line:_k_.in(i,this.macros) && '◼' || '◆',type:'macro'})  } return _56__74_ }).bind(this)()
    }

    Macro.prototype["execute"] = function (command)
    {
        var cleaned, clss, cmds, cmmd, cp, dir, editor, file, indent, insert, l, li, line, lines, lst, num, s, step, t, terminal, text, ti, words, wordsInArgsOrCursorsOrSelection, _121_40_, _122_40_, _208_40_

        if (_k_.empty(command))
        {
            return kerror('no command!')
        }
        command = Macro.__super__.execute.call(this,command)
        editor = window.editor
        cp = editor.cursorPos()
        cmds = command.split(/\s+/)
        cmmd = cmds.shift()
        wordsInArgsOrCursorsOrSelection = function (argl, opt)
        {
            var cw, ws

            if (argl.length)
            {
                return argl
            }
            else
            {
                cw = editor.wordsAtCursors(positionsNotInRanges(editor.cursors(),editor.selections()),opt)
                ws = _.uniq(cw.concat(editor.textsInRanges(editor.selections())))
                return ws.filter(function (w)
                {
                    return w.trim().length
                })
            }
        }
        switch (cmmd)
        {
            case 'inv':
                window.textEditor.toggleInvisibles()
                break
            case 'blink':
                editor.toggleBlink()
                if (prefs.get('blink'))
                {
                    this.commandline.startBlink()
                }
                else
                {
                    this.commandline.stopBlink()
                }
                break
            case 'color':
            case 'colors':
                editor.togglePigments()
                break
            case 'fps':
                (window.fps != null ? window.fps.toggle() : undefined)
                break
            case 'cwd':
                (window.cwd != null ? window.cwd.toggle() : undefined)
                break
            case 'git':
                GitInfo.start()
                break
            case 'err':
                post.toMain('throwError')
                throw new Error('err')
                break
            case 'help':
                terminal = window.terminal
                text = fs.readFileSync(`${__dirname}/../../bin/cheet.noon`,{encoding:'utf8'})
                terminal.clear()
                var list = _k_.list(text.split('\n'))
                for (var _139_22_ = 0; _139_22_ < list.length; _139_22_++)
                {
                    l = list[_139_22_]
                    terminal.appendLineDiss(l,syntax.dissForTextAndSyntax(l,'noon'))
                }
                terminal.scroll.cursorToTop(1)
                window.split.do('show terminal')
                break
            case 'req':
                if (!(_k_.in(slash.ext(editor.currentFile),['coffee','kode'])))
                {
                    return
                }
                lines = req(editor.currentFile,editor.lines(),editor)
                if (!_k_.empty(lines))
                {
                    editor.do.start()
                    var list1 = _k_.list(lines)
                    for (var _158_29_ = 0; _158_29_ < list1.length; _158_29_++)
                    {
                        line = list1[_158_29_]
                        if (line.op === 'insert')
                        {
                            editor.do.insert(line.index,line.text)
                        }
                        else
                        {
                            editor.do.change(line.index,line.text)
                        }
                    }
                    editor.do.end()
                    return {do:"focus editor"}
                }
                break
            case 'dbg':
                li = cp[1]
                indent = editor.indentStringForLineAtIndex(li)
                if (!editor.isCursorInIndent() && !editor.isCursorInLastLine())
                {
                    li += 1
                }
                insert = indent + 'log "'
                insert += editor.funcInfoAtLineIndex(li)
                lst = cmds.length && parseInt(cmds[0]) || 0
                if (lst)
                {
                    cmds.shift()
                }
                words = wordsInArgsOrCursorsOrSelection(cmds,{include:"#@.-"})
                for (var _183_27_ = ti = 0, _183_31_ = words.length - lst; (_183_27_ <= _183_31_ ? ti < words.length - lst : ti > words.length - lst); (_183_27_ <= _183_31_ ? ++ti : --ti))
                {
                    t = words[ti]
                    insert += `${t}:\#{kstr ${t}} `
                }
                insert = insert.trimRight()
                insert += '"'
                if (lst)
                {
                    insert += (function () { var _189__61_ = []; for (var _189_65_ = ti = words.length - lst, _189_86_ = words.length; (_189_65_ <= _189_86_ ? ti < words.length : ti > words.length); (_189_65_ <= _189_86_ ? ++ti : --ti))  { _189__61_.push(`, kstr(${words[ti]})`)  } return _189__61_ }).bind(this)().join('')
                }
                editor.do.start()
                editor.do.insert(li,insert)
                editor.singleCursorAtPos([editor.line(li).length,li])
                editor.do.end()
                {focus:editor.name}
                break
            case 'class':
                clss = cmds.length && cmds[0] || _.last(editor.textsInRanges(editor.selections()))
                clss = (clss != null ? clss : 'Class')
                dir = (editor.currentFile != null) && slash.dir(editor.currentFile) || process.cwd()
                file = slash.join(dir,clss.toLowerCase() + '.coffee')
                if (slash.fileExists(file))
                {
                    return {text:`file ${file} exists!`}
                }
                text = "###\n"
                text += (function () { var _213__33_ = []; var list2 = _k_.list(salt(clss).split('\n')); for (var _213_33_ = 0; _213_33_ < list2.length; _213_33_++)  { s = list2[_213_33_];_213__33_.push(s)  } return _213__33_ }).bind(this)().join('\n')
                text += "\n###\n"
                text += `
class ${clss}

    @: () ->


module.exports = ${clss}
`
                fs.writeFile(file,text,{encoding:'utf8'},function (err)
                {
                    if ((err != null))
                    {
                        kerror('writing class skeleton failed',err)
                        return
                    }
                    return post.emit('newTabWithFile',file)
                })
                return {focus:editor.name}

            case 'clean':
                editor.do.start()
                for (var _241_27_ = li = 0, _241_31_ = editor.numLines(); (_241_27_ <= _241_31_ ? li < editor.numLines() : li > editor.numLines()); (_241_27_ <= _241_31_ ? ++li : --li))
                {
                    line = editor.line(li)
                    cleaned = line.trimRight()
                    if (line !== cleaned)
                    {
                        editor.do.change(li,cleaned)
                    }
                }
                editor.do.end()
                break
            case 'unix':
                editor.newlineCharacters = '\n'
                post.emit('saveFile')
                break
            case 'header':
                editor.toggleHeader()
                break
            case 'col':
                num = cmds.length > 0 && parseInt(cmds[0]) || 10
                step = cmds.length > 1 && parseInt(cmds[1]) || 1
                editor.cursorColumns(num,step)
                break
            case 'line':
                num = cmds.length > 0 && parseInt(cmds[0]) || 10
                step = cmds.length > 1 && parseInt(cmds[1]) || 1
                editor.cursorLines(num,step)
                break
            default:
                if (Transform.transformNames && _k_.in(cmmd,Transform.transformNames))
            {
                window.textEditor.Transform.do.apply(null,[window.textEditor,cmmd].concat(cmds))
            }
            else
            {
                kerror('unhandled macro',cmmd,Transform.transformNames)
                if (_.last(this.history) === command.trim())
                {
                    this.history.pop()
                }
            }
        }

        return {select:true}
    }

    return Macro
})()

module.exports = Macro
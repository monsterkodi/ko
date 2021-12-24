// monsterkodi/kode 0.212.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var Command, Find

Command = require('../commandline/command')

Find = (function ()
{
    _k_.extend(Find, Command)
    function Find (commandline)
    {
        Find.__super__.constructor.call(this,commandline)
    
        this.types = ['str','Str','reg','Reg','fuzzy','glob']
        this.names = ['find','Find','/find/','/Find/','fiZd','f*nd']
    }

    Find.prototype["historyKey"] = function ()
    {
        return this.name
    }

    Find.prototype["start"] = function (name)
    {
        var editor

        if (name === 'find')
        {
            editor = this.receivingEditor()
            window.split.focus('commandline')
            if (this.getText() !== editor.textOfHighlight() && !_k_.empty(editor.textOfHighlight()))
            {
                this.setText(editor.textOfHighlight())
            }
        }
        this.type = this.types[this.names.indexOf(name)]
        return Find.__super__.start.call(this,name)
    }

    Find.prototype["cancel"] = function ()
    {
        this.hideList()
        return {focus:this.receiver,show:'editor'}
    }

    Find.prototype["changed"] = function (command)
    {
        Find.__super__.changed.call(this,command)
    
        if (command.length)
        {
            if (_k_.in(this.type,['reg','Reg']) && _k_.in(command.trim(),['^','$','^$','.','?','\\','\\b']))
            {
                return window.textEditor.clearHighlights()
            }
            else if (!command.trim().startsWith('|') && !command.trim().endsWith('|'))
            {
                return window.textEditor.highlightText(command,{type:this.type,select:'keep'})
            }
        }
        else
        {
            return window.textEditor.clearHighlights()
        }
    }

    Find.prototype["execute"] = function (command)
    {
        command = Find.__super__.execute.call(this,command)
        window.textEditor.highlightText(command,{type:this.type,select:'after'})
        return {text:command,select:true}
    }

    Find.prototype["handleModKeyComboEvent"] = function (mod, key, combo, event)
    {
        switch (combo)
        {
            case 'shift+enter':
            case 'command+shift+g':
                window.textEditor.highlightText(this.getText(),{type:this.type,select:'before'})
                return

            case 'command+g':
                this.execute(this.getText())
                return

            case 'tab':
                window.textEditor.focus()
                return

        }

        return Find.__super__.handleModKeyComboEvent.call(this,mod,key,combo,event)
    }

    return Find
})()

module.exports = Find
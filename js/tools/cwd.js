// monsterkodi/kode 0.223.0

var _k_

var $, elem, post, slash, syntax

$ = require('kxk').$
elem = require('kxk').elem
post = require('kxk').post
slash = require('kxk').slash

syntax = require('../editor/syntax')
class CWD
{
    constructor ()
    {
        this.stash = this.stash.bind(this)
        this.restore = this.restore.bind(this)
        this.onCwdSet = this.onCwdSet.bind(this)
        this.elem = elem({class:'cwd'})
        $('commandline-span').appendChild(this.elem)
        post.on('stash',this.stash)
        post.on('restore',this.restore)
        post.on('cwdSet',this.onCwdSet)
        this.restore()
    }

    onCwdSet (cwd)
    {
        var html, text

        this.cwd = cwd
    
        text = slash.tilde(this.cwd)
        html = syntax.spanForTextAndSyntax(text,'browser')
        return this.elem.innerHTML = html
    }

    visible ()
    {
        return this.elem.style.display !== 'none'
    }

    restore ()
    {
        if (window.stash.get('cwd',false) !== this.visible())
        {
            return this.toggle()
        }
    }

    stash ()
    {
        return window.stash.set('cwd',this.visible())
    }

    toggle ()
    {
        this.elem.style.display = this.visible() && 'none' || 'unset'
        return this.stash()
    }
}

module.exports = CWD
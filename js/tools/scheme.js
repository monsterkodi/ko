// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isStr: function (o) {return typeof o === 'string' || o instanceof String}}

var $, elem, post, prefs, slash

$ = require('kxk').$
elem = require('kxk').elem
post = require('kxk').post
prefs = require('kxk').prefs
slash = require('kxk').slash

class Scheme
{
    static colors = {}

    static toggle (schemes = ['dark','bright'])
    {
        var currentScheme, link, nextScheme, nextSchemeIndex

        link = $('.scheme-link')
        currentScheme = slash.basename(slash.dir(link.href))
        nextSchemeIndex = (schemes.indexOf(currentScheme) + 1) % schemes.length
        nextScheme = schemes[nextSchemeIndex]
        return Scheme.set(nextScheme)
    }

    static set (scheme)
    {
        var css, link, newlink

        this.colors = {}
        var list = _k_.list(document.querySelectorAll('.scheme-link'))
        for (var _29_17_ = 0; _29_17_ < list.length; _29_17_++)
        {
            link = list[_29_17_]
            css = slash.basename(link.href)
            newlink = elem('link',{href:`css/${scheme}/${css}`,rel:'stylesheet',type:'text/css',class:'scheme-link'})
            link.parentNode.replaceChild(newlink,link)
        }
        prefs.set('scheme',scheme)
        return post.emit('schemeChanged',scheme)
    }

    static colorForClass (clss)
    {
        var color, div

        if (!(this.colors[clss] != null))
        {
            div = elem({class:clss})
            document.body.appendChild(div)
            color = window.getComputedStyle(div).color
            this.colors[clss] = color
            div.remove()
        }
        return this.colors[clss]
    }

    static fadeColor (a, b, f)
    {
        var av, bv, fv, i

        av = this.parseColor(a)
        bv = this.parseColor(b)
        fv = [0,0,0]
        for (i = 0; i < 3; i++)
        {
            fv[i] = Math.round((1 - f) * av[i] + f * bv[i])
        }
        return `rgb(${fv[0]}, ${fv[1]}, ${fv[2]})`
    }

    static parseColor (c)
    {
        var e, s, v

        if (_k_.isStr(c) && c.startsWith('rgb'))
        {
            s = c.indexOf('(')
            e = c.indexOf(')')
            c = c.slice(s + 1,e)
            v = c.split(',')
            return [parseInt(v[0]),parseInt(v[1]),parseInt(v[2])]
        }
    }
}

module.exports = Scheme
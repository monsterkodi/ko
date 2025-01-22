var _k_ = {isFunc: function (o) {return typeof o === 'function'}, noon: function (obj) { var pad = function (s, l) { while (s.length < l) { s += ' ' }; return s }; var esc = function (k, arry) { var es, sp; if (0 <= k.indexOf('\n')) { sp = k.split('\n'); es = sp.map(function (s) { return esc(s,arry) }); es.unshift('...'); es.push('...'); return es.join('\n') } if (k === '' || k === '...' || _k_.in(k[0],[' ','#','|']) || _k_.in(k[k.length - 1],[' ','#','|'])) { k = '|' + k + '|' } else if (arry && /  /.test(k)) { k = '|' + k + '|' }; return k }; var pretty = function (o, ind, seen) { var k, kl, l, v, mk = 4; if (Object.keys(o).length > 1) { for (k in o) { if (Object.prototype.hasOwnProperty(o,k)) { kl = parseInt(Math.ceil((k.length + 2) / 4) * 4); mk = Math.max(mk,kl); if (mk > 32) { mk = 32; break } } } }; l = []; var keyValue = function (k, v) { var i, ks, s, vs; s = ind; k = esc(k,true); if (k.indexOf('  ') > 0 && k[0] !== '|') { k = `|${k}|` } else if (k[0] !== '|' && k[k.length - 1] === '|') { k = '|' + k } else if (k[0] === '|' && k[k.length - 1] !== '|') { k += '|' }; ks = pad(k,Math.max(mk,k.length + 2)); i = pad(ind + '    ',mk); s += ks; vs = toStr(v,i,false,seen); if (vs[0] === '\n') { while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) } }; s += vs; while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) }; return s }; for (k in o) { if (Object.hasOwn(o,k)) { l.push(keyValue(k,o[k])) } }; return l.join('\n') }; var toStr = function (o, ind = '', arry = false, seen = []) { var s, t, v; if (!(o != null)) { if (o === null) { return 'null' }; if (o === undefined) { return 'undefined' }; return '<?>' }; switch (t = typeof(o)) { case 'string': {return esc(o,arry)}; case 'object': { if (_k_.in(o,seen)) { return '<v>' }; seen.push(o); if ((o.constructor != null ? o.constructor.name : undefined) === 'Array') { s = ind !== '' && arry && '.' || ''; if (o.length && ind !== '') { s += '\n' }; s += (function () { var result = []; var list = _k_.list(o); for (var li = 0; li < list.length; li++)  { v = list[li];result.push(ind + toStr(v,ind + '    ',true,seen))  } return result }).bind(this)().join('\n') } else if ((o.constructor != null ? o.constructor.name : undefined) === 'RegExp') { return o.source } else { s = (arry && '.\n') || ((ind !== '') && '\n' || ''); s += pretty(o,ind,seen) }; return s } default: return String(o) }; return '<???>' }; return toStr(obj) }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Delegate

import version from "../konrad/version.js"

import dom from "./dom.js"
let $ = dom.$
let stopEvent = dom.stopEvent

import util from "./util.js"
import ffs from "./ffs.js"
import elem from "./elem.js"
import post from "./post.js"
import prefs from "./prefs.js"
import slash from "./slash.js"
import stash from "./stash.js"
import keyinfo from "./keyinfo.js"
import title from "./title.js"


Delegate = (function ()
{
    function Delegate ()
    {}

    Delegate.prototype["onWindowWillLoadStash"] = function (win)
    {}

    Delegate.prototype["onWindowDidLoadStash"] = function (win)
    {}

    Delegate.prototype["onWindowWithoutStash"] = function (win)
    {}

    Delegate.prototype["onWindowWillShow"] = function (win)
    {}

    Delegate.prototype["onWindowCreated"] = function (win)
    {}

    Delegate.prototype["onWindowAnimationTick"] = function (win, tickInfo)
    {}

    Delegate.prototype["onWindowResize"] = function (win, event)
    {}

    Delegate.prototype["onWindowFocus"] = function (win)
    {}

    Delegate.prototype["onWindowBlur"] = function (win)
    {}

    Delegate.prototype["onWindowKeyDown"] = function (keyInfo)
    {}

    Delegate.prototype["onWindowKeyUp"] = function (keyInfo)
    {}

    Delegate.prototype["onWindowClose"] = function (win)
    {}

    Delegate.prototype["onWindowMenuTemplate"] = function (win, template)
    {}

    return Delegate
})()

class Win
{
    static Delegate = Delegate

    constructor (delegate)
    {
        var main, menuIcon, menuNoon, _45_18_, _60_38_, _61_38_, _87_17_, _87_34_

        this.delegate = delegate
    
        this.onKeyUp = this.onKeyUp.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onMenuAction = this.onMenuAction.bind(this)
        this.onWindowClose = this.onWindowClose.bind(this)
        this.onWindowWillResize = this.onWindowWillResize.bind(this)
        this.onWindowFrame = this.onWindowFrame.bind(this)
        this.onWindowBlur = this.onWindowBlur.bind(this)
        this.onWindowFocus = this.onWindowFocus.bind(this)
        this.onResize = this.onResize.bind(this)
        this.animate = this.animate.bind(this)
        this.onWindowDidReload = this.onWindowDidReload.bind(this)
        this.onStashMissing = this.onStashMissing.bind(this)
        this.onStashLoaded = this.onStashLoaded.bind(this)
        window.name = slash.name(window.location.pathname)
        window.prefs = prefs
        window.prefs.init()
        this.saveStashOnClose = true
        this.delegate = ((_45_18_=this.delegate) != null ? _45_18_ : new Delegate)
        post.on('window.blur',this.onWindowBlur)
        post.on('window.focus',this.onWindowFocus)
        post.on('window.close',this.onWindowClose)
        post.on('window.frame',this.onWindowFrame)
        post.on('menuAction',this.onMenuAction)
        post.on('stashLoaded',this.onStashLoaded)
        post.on('stashMissing',this.onStashMissing)
        post.on('saveStash',this.saveStash)
        post.on('window.willReload',this.saveStash)
        post.on('window.willResize',this.onWindowWillResize)
        post.on('window.didReload',this.onWindowDidReload)
        post.on('menu.init',(function (template)
        {
            var _58_54_, _58_76_

            return ((_58_54_=this.delegate) != null ? typeof (_58_76_=_58_54_.onWindowMenuTemplate) === "function" ? _58_76_(this,template) : undefined : undefined)
        }).bind(this))
        menuIcon = ((_60_38_=this.delegate.menuIcon) != null ? _60_38_ : kakao.bundle.img('menu_kakao.png'))
        menuNoon = ((_61_38_=this.delegate.menuNoon) != null ? _61_38_ : kakao.bundle.res('menu_kakao.noon'))
        window.titlebar = new title({icon:menuIcon,menu:menuNoon})
        window.addEventListener('keydown',this.onKeyDown)
        window.addEventListener('keyup',this.onKeyUp)
        window.addEventListener('resize',this.onResize)
        if (!this.delegate.noAnimation)
        {
            window.requestAnimationFrame(this.animate)
        }
        if (main = $('main'))
        {
            main.focus()
        }
        this.id = window.winID
        console.log('stash',`win/${this.id}_${window.name}`)
        window.stash = new stash(`win/${this.id}_${window.name}`)
        ;((_87_17_=this.delegate) != null ? typeof (_87_34_=_87_17_.onWindowCreated) === "function" ? _87_34_(this) : undefined : undefined)
    }

    async onStashLoaded ()
    {
        var frame, _91_20_, _93_28_, _93_59_

        if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowDidLoadStash : undefined)))
        {
            await this.delegate.onWindowDidLoadStash(this)
        }
        if (true !== ((_93_28_=this.delegate) != null ? typeof (_93_59_=_93_28_.onWindowRestoreFrameFromStash) === "function" ? _93_59_(this,window.stash.get('frame')) : undefined : undefined))
        {
            if (frame = window.stash.get('frame'))
            {
                kakao('window.setFrame',frame,true)
            }
        }
        return this.showWindow()
    }

    async onStashMissing ()
    {
        var list, old, other, otherApp, sameApp, _112_24_, _122_24_

        list = await ffs.list(kakao.bundle.app('.stash/old'))
        var _a_ = util.splitWith(list,function (i)
        {
            return slash.name(i.path).endsWith('_' + window.name)
        }); sameApp = _a_[0]; otherApp = _a_[1]

        console.log('onStashMissing',list,window.name,`same ${_k_.noon(sameApp)} other ${_k_.noon(otherApp)}`)
        if (!_k_.empty(sameApp))
        {
            old = sameApp.shift()
            if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowWillLoadStash : undefined)))
            {
                await this.delegate.onWindowWillLoadStash(this)
            }
            await window.stash.load(old.path)
            await ffs.remove(old.path)
        }
        else
        {
            if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowWithoutStash : undefined)))
            {
                await this.delegate.onWindowWithoutStash(this)
            }
            this.showWindow()
        }
        if (!_k_.empty(sameApp))
        {
            return kakao('window.new',`${window.name}.html`)
        }
        else if (!_k_.empty(otherApp))
        {
            other = slash.name(otherApp[0].path).split('_')[1]
            return kakao('window.new',`${other}.html`)
        }
    }

    async showWindow ()
    {
        var _141_20_

        document.body.style.display = 'inherit'
        if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowWillShow : undefined)))
        {
            return await this.delegate.onWindowWillShow(this)
        }
    }

    onWindowDidReload ()
    {
        return document.body.style.display = 'inherit'
    }

    saveStash ()
    {
        post.emit('saveChanges')
        post.emit('stash')
        return window.stash.save()
    }

    animate ()
    {
        var delta, fps, now, _168_37_, _168_60_

        now = window.performance.now()
        delta = (now - this.lastAnimationTime)
        this.lastAnimationTime = now
        fps = parseInt(1000 / delta)
        if (fps < 20)
        {
            kakao("window.framerateDrop",fps)
        }
        if ('stop' === ((_168_37_=this.delegate) != null ? typeof (_168_60_=_168_37_.onWindowAnimationTick) === "function" ? _168_60_(this,{delta:delta,fps:fps,time:now}) : undefined : undefined))
        {
            return
        }
        return window.requestAnimationFrame(this.animate)
    }

    onResize (event)
    {
        var _172_36_, _172_52_

        return ((_172_36_=this.delegate) != null ? typeof (_172_52_=_172_36_.onWindowResize) === "function" ? _172_52_(this,event) : undefined : undefined)
    }

    onWindowFocus ()
    {
        var _173_36_, _173_51_

        return ((_173_36_=this.delegate) != null ? typeof (_173_51_=_173_36_.onWindowFocus) === "function" ? _173_51_(this) : undefined : undefined)
    }

    onWindowBlur ()
    {
        var _174_36_, _174_50_

        return ((_174_36_=this.delegate) != null ? typeof (_174_50_=_174_36_.onWindowBlur) === "function" ? _174_50_(this) : undefined : undefined)
    }

    onWindowFrame (info)
    {
        return window.stash.set('frame',info.frame)
    }

    onWindowWillResize (info, newSize)
    {}

    onWindowClose (save)
    {
        var _185_17_, _185_32_

        if (save)
        {
            post.emit('saveStash')
        }
        else
        {
            window.stash.clear()
        }
        window.prefs.save()
        return ((_185_17_=this.delegate) != null ? typeof (_185_32_=_185_17_.onWindowClose) === "function" ? _185_32_(this) : undefined : undefined)
    }

    onMenuAction (action)
    {
        var url, vrs, _197_27_, _197_47_

        if (((_197_27_=this.delegate) != null ? typeof (_197_47_=_197_27_.onWindowMenuAction) === "function" ? _197_47_(this,action) : undefined : undefined))
        {
            return
        }
        switch (action.toLowerCase())
        {
            case 'focus next':
                kakao('window.focusNext')
                break
            case 'focus previous':
                kakao('window.focusPrev')
                break
            case 'new window':
                kakao('window.new',slash.file(document.URL))
                break
            case 'maximize':
                kakao('window.maximize')
                break
            case 'minimize':
                kakao('window.minimize')
                break
            case 'screenshot':
                kakao('window.snapshot')
                break
            case 'fullscreen':
                kakao('window.fullscreen')
                break
            case 'reload':
                kakao('window.reload')
                break
            case 'devtools':
                kakao('window.toggleInspector')
                break
            case 'quit':
                kakao('app.quit')
                break
            case 'open ...':
                kakao('window.new','ko.html')
                break
            case 'close':
                kakao('window.close')
                break
            case 'about':
                vrs = ` window.aboutVersion = \"${(this.delegate.aboutVersion ? this.delegate.aboutVersion : version)}\";`
                url = (this.delegate.aboutURL ? ` window.aboutURL = \"${this.delegate.aboutURL}\";` : '')
                if (this.delegate.aboutImage)
                {
                    kakao('window.new','about.html',`window.aboutImage = \"${this.delegate.aboutImage}\";${vrs}${url}`)
                }
                else
                {
                    kakao('window.new','about.html',`window.aboutImage = \"${kakao.bundle.img('about_kakao.png')}\";${vrs}${url}`)
                }
                break
        }

        return 0
    }

    onKeyDown (event)
    {
        var info, _235_26_, _238_20_, _239_62_, _239_79_

        info = keyinfo.forEvent(event)
        info.event = event
        if (_k_.isFunc((window.titlebar != null ? window.titlebar.handleKeyInfo : undefined)))
        {
            if ('unhandled' !== window.titlebar.handleKeyInfo(info))
            {
                return stopEvent(event)
            }
        }
        if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowKeyDown : undefined)))
        {
            if ('unhandled' !== ((_239_62_=this.delegate) != null ? typeof (_239_79_=_239_62_.onWindowKeyDown) === "function" ? _239_79_(info) : undefined : undefined))
            {
                return stopEvent(event)
            }
        }
    }

    onKeyUp (event)
    {
        var info, _246_20_, _247_46_, _247_61_

        info = keyinfo.forEvent(event)
        info.event = event
        if (_k_.isFunc((this.delegate != null ? this.delegate.onWindowKeyUp : undefined)))
        {
            if ('unhandled' !== ((_247_46_=this.delegate) != null ? typeof (_247_61_=_247_46_.onWindowKeyUp) === "function" ? _247_61_(info) : undefined : undefined))
            {
                return
            }
        }
    }
}

export default Win;
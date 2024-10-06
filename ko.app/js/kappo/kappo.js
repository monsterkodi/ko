var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var addToHistory, allKeys, appHist, apps, backspace, biggerWindow, cancelSearchOrClose, clampFrame, clearSearch, clickID, complete, currentApp, currentIndex, currentIsApp, currentIsScript, currentName, Delegate, doSearch, downID, getIcon, listHistory, moveWindow, openCurrent, openInFinder, results, scripts, search, select, selectName, showDots, sizeWindow, smallerWindow, toggleAppToggle, toggleDoubleActivation, wheelAccu, winHide

import kakao from "../kakao.js"

import kxk from "../kxk.js"
let win = kxk.win
let krzl = kxk.krzl
let childIndex = kxk.childIndex
let post = kxk.post
let popup = kxk.popup
let args = kxk.args
let setStyle = kxk.setStyle
let stopEvent = kxk.stopEvent
let keyinfo = kxk.keyinfo
let prefs = kxk.prefs
let elem = kxk.elem
let ffs = kxk.ffs
let slash = kxk.slash
let kpos = kxk.kpos
let $ = kxk.$

import appfind from "./appfind.js"
import appicon from "./appicon.js"

appHist = null
results = []
apps = {}
scripts = {}
allKeys = []
search = ''
currentName = ''
currentIndex = 0
post.on('appsFound',function (info)
{
    apps = info.apps
    scripts = info.scripts
    allKeys = info.allKeys

    return info
})

Delegate = (function ()
{
    function Delegate ()
    {}

    Delegate.prototype["onWindowWillShow"] = function ()
    {
        kakao('window.setAspectRatio',1,1)
        return post.emit('findApps')
    }

    Delegate.prototype["onWindowKeyDown"] = function (info)
    {
        var combo, _79_20_

        combo = info.combo
        console.log('onWindowKeyDown',combo)
        if ((info.char != null) && combo.length === 1)
        {
            complete(info.key)
            return
        }
        switch (combo)
        {
            case 'f1':
                return preventKeyRepeat()

            case 'backspace':
                return backspace()

            case 'command+backspace':
            case 'ctrl+backspace':
                return doSearch('')

            case 'esc':
                return cancelSearchOrClose()

            case 'down':
            case 'right':
                return select(currentIndex + 1)

            case 'up':
            case 'left':
                return select(currentIndex - 1)

            case 'enter':
                return openCurrent()

            case 'command+alt+i':
            case 'ctrl+alt+i':
                return kakao('window.toggleInspector')

            case 'command+=':
            case '=':
                return biggerWindow()

            case 'command+-':
            case '-':
                return smallerWindow()

            case 'command+0':
            case '0':
                return sizeWindow(-550)

            case 'command+r':
            case 'ctrl+r':
                return post.emit('findApps')

            case 'command+h':
            case 'alt+h':
                return listHistory()

            case 'command+f':
            case 'ctrl+f':
                return openInFinder()

            case 'command+t':
            case 'ctrl+t':
                return toggleAppToggle()

            case 'command+d':
            case 'ctrl+d':
                return toggleDoubleActivation()

            case 'alt+command+/':
            case 'alt+ctrl+/':
                return post.toMain('about')

            case 'command+,':
            case 'ctrl+,':
                return open(prefs.store.file)

            case 'command+up':
            case 'ctrl+up':
                return moveWindow(0,-20)

            case 'command+down':
            case 'ctrl+down':
                return moveWindow(0,20)

            case 'command+left':
            case 'ctrl+left':
                return moveWindow(-20,0)

            case 'command+right':
            case 'ctrl+right':
                return moveWindow(20,0)

        }

    }

    return Delegate
})()


winHide = function ()
{
    console.log('window.hide')
}

openCurrent = function ()
{
    var _128_38_

    if (currentIndex > 0 && search.length)
    {
        prefs.set(`search:${search}:${currentName}`,1 + prefs.get(`search:${search}:${currentName}`,0))
    }
    if (currentIsApp())
    {
        addToHistory()
        return kakao('app.sh','/usr/bin/open',{arg:`-a ${apps[currentName]}`})
    }
    else if (((scripts[currentName] != null ? scripts[currentName].exec : undefined) != null))
    {
        console.log(currentName,scripts[currentName].exec)
        return kakao('app.sh',scripts[currentName].exec)
    }
}
post.on('openCurrent',openCurrent)

currentApp = function (appName)
{
    var lastMatches, name

    if (_k_.empty(currentName))
    {
        currentName = 'kappo'
    }
    if (_k_.empty(appName))
    {
        appName = 'kappo'
    }
    lastMatches = currentName.toLowerCase() === appName.toLowerCase()
    if (lastMatches && appHist.previous() && prefs.get('appToggle',true))
    {
        listHistory(1)
        search = ''
    }
    else
    {
        console.log(`currentApp ${appName} -> ${currentName}`,lastMatches)
        name = currentName
        doSearch('')
        if (!_k_.empty(name))
        {
            selectName(name)
        }
        search = ''
        $('appname').innerHTML = name
    }
    return $('#main').classList.add('fade')
}
post.on('currentApp',currentApp)

currentIsApp = (function ()
{
    return !currentIsScript()
}).bind(this)

currentIsScript = function ()
{
    var _163_50_

    return ((results[currentIndex] != null ? results[currentIndex].script : undefined) != null)
}

toggleAppToggle = function ()
{
    return prefs.set('appToggle',!prefs.get('appToggle',true))
}

toggleDoubleActivation = function ()
{
    return prefs.set('hideOnDoubleActivation',!prefs.get('hideOnDoubleActivation',false))
}

listHistory = function (offset = 0)
{
    var h, index, result, _193_26_

    console.log(`listHistory ${offset}`,appHist.list)
    results = []
    if (!_k_.empty(appHist))
    {
        var list = _k_.list(appHist.list)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            h = list[_a_]
            result = _.clone(h)
            result.string = ((_193_26_=result.string) != null ? _193_26_ : result.name)
            results.push(result)
        }
    }
    index = results.length - 1 - offset
    console.log(`listHistory index ${index}`,results)
    select(index)
    return showDots()
}

addToHistory = function ()
{
    console.log('addToHistory',results[currentIndex])
}

openInFinder = function ()
{
    return childp.spawn('osascript',['-e','tell application "Finder"','-e',`reveal POSIX file \"${apps[currentName]}\"`,'-e','activate','-e','end tell'])
}

clearSearch = function ()
{
    if (results.length)
    {
        search = ''
        results = [results[Math.min(currentIndex,results.length - 1)]]
        results[0].string = currentName
        $('appname').innerHTML = currentName
        currentIndex = 0
        return showDots()
    }
    else
    {
        return doSearch('')
    }
}
post.on('clearSearch',clearSearch)

getIcon = async function (appName)
{
    var iconPath

    if ((scripts[appName] != null ? scripts[appName].img : undefined))
    {
        iconPath = scripts[appName].img
    }
    else
    {
        iconPath = await appicon.get({appPath:apps[appName],size:512})
    }
    return $('appicon').style.backgroundImage = `url(\"${slash.fileUrl(iconPath)}\")`
}

select = (function (index)
{
    var _270_17_, _271_28_

    currentIndex = (index + results.length) % results.length
    if (_k_.empty(results[currentIndex]))
    {
        console.log('dafuk? index:',index,'results:',results)
        return
    }
    currentName = results[currentIndex].name
    $('appname').innerHTML = results[currentIndex].string
    ;($('.current') != null ? $('.current').classList.remove('current') : undefined)
    ;($(`dot_${currentIndex}`) != null ? $(`dot_${currentIndex}`).classList.add('current') : undefined)
    return getIcon(currentName)
}).bind(this)

selectName = function (name)
{
    if (_k_.empty(name))
    {
        return
    }
    return select(results.findIndex(function (r)
    {
        return (r != null ? r.name.toLowerCase() : undefined) === name.toLowerCase()
    }))
}

showDots = function ()
{
    var dot, dotr, dots, i, s, winWidth

    dots = $('appdots')
    dots.innerHTML = ''
    winWidth = $('main').getBoundingClientRect().width
    if (results.length < 2)
    {
        return
    }
    dotr = elem({id:'appdotr'})
    dots.appendChild(dotr)
    s = winWidth / results.length
    s = _k_.clamp(1,winWidth / 100,s)
    s = parseInt(s)
    setStyle('.appdot','width',`${s}px`)
    setStyle('.appdot','height',`${s}px`)
    for (var _b_ = i = 0, _c_ = results.length; (_b_ <= _c_ ? i < results.length : i > results.length); (_b_ <= _c_ ? ++i : --i))
    {
        dot = elem('span',{class:'appdot',id:`dot_${i}`})
        if (i === currentIndex)
        {
            dot.classList.add('current')
        }
        dotr.appendChild(dot)
    }
}

doSearch = function (s)
{
    var f, fuzz, fuzzied, names, r

    search = s
    names = allKeys
    console.log('doSearch',s,names)
    fuzz = new krzl(names)
    fuzzied = fuzz.filter(s)
    console.log('fuzzied',fuzzied)
    results = []
    var list = _k_.list(fuzzied)
    for (var _d_ = 0; _d_ < list.length; _d_++)
    {
        f = list[_d_]
        r = {name:f,string:s}
        if (scripts[f])
        {
            r.script = scripts[f]
        }
        results.push(r)
    }
    if (!_k_.empty(results))
    {
        if (s === '')
        {
            selectName('Finder')
        }
        else
        {
            select(0)
        }
        return showDots()
    }
    else
    {
        $('appdots').innerHTML = ''
        return $('appname').innerHTML = `<b>${search}</b>`
    }
}

complete = function (key)
{
    return doSearch(search + key)
}

backspace = function ()
{
    return doSearch(search.substr(0,search.length - 1))
}

cancelSearchOrClose = function ()
{
    ipc.send('closeAbout')
    if (search.length)
    {
        return doSearch('')
    }
    else
    {
        return post.toMain('cancel')
    }
}
clickID = downID = 0

window.onmousedown = function (e)
{
    clickID += 1
    return downID = clickID
}

window.onmouseup = function (e)
{
    if (downID === clickID)
    {
        return openCurrent()
    }
}

window.onmousemove = function (e)
{
    if (e.buttons)
    {
        return downID = -1
    }
}

window.onunload = function ()
{
    return document.onkeydown = null
}

window.onblur = function ()
{
    return winHide()
}

window.onresize = function ()
{
    return showDots()
}
wheelAccu = 0

window.onwheel = function (event)
{
    wheelAccu += (event.deltaX + event.deltaY) / 44
    if (wheelAccu > 1)
    {
        select(currentIndex + 1 % results.length)
        while (wheelAccu > 1)
        {
            wheelAccu -= 1
        }
    }
    else if (wheelAccu < -1)
    {
        select(currentIndex + results.length - 1 % results.length)
        while (wheelAccu < -1)
        {
            wheelAccu += 1
        }
    }
}

clampFrame = function (f)
{
    f.w = _k_.clamp(200,600,f.w)
    f.h = _k_.clamp(200,600,f.h)
    return f
}

sizeWindow = async function (d)
{
    var cx, frame, info

    info = await kakao('window.frame')
    frame = info.frame
    cx = frame.x + frame.w / 2
    frame.w += d
    frame.h += d
    clampFrame(frame)
    frame.x = cx - frame.w / 2
    clampFrame(frame)
    return kakao('window.setFrame',frame,true)
}

moveWindow = function (dx, dy)
{
    return kakao('window.moveBy',{x:dx,y:-dy})
}

biggerWindow = function ()
{
    return sizeWindow(50)
}

smallerWindow = function ()
{
    return sizeWindow(-50)
}
kakao.init(function ()
{
    new win(new Delegate)
    return this
})
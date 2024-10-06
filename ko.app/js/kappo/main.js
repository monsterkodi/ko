var _k_ = {dir: function () { let url = import.meta.url.substring(7); let si = url.lastIndexOf('/'); return url.substring(0, si); }}

var activateApp, activeApp, activeWin, allKeys, appName, apps, findApps, getActiveApp, scripts

apps = {}
allKeys = []
scripts = {sleep:{exec:"pmset sleepnow",img:`${_k_.dir()}/../scripts/sleep.png`},shutdown:{exec:"osascript -e 'tell app \"System Events\" to shut down'",img:`${_k_.dir()}/../scripts/shutdown.png`},restart:{exec:"osascript -e 'tell app \"System Events\" to restart'",img:`${_k_.dir()}/../scripts/restart.png`}}
post.on('runScript',function (name)
{
    return scripts[name].cb()
})
post.on('hideWin',function ()
{
    return (win != null ? win.hide() : undefined)
})
post.on('cancel',function ()
{
    return activateApp()
})
post.on('about',function ()
{
    return showAbout()
})
post.on('findApps',function ()
{
    return findApps()
})
post.on('devTools',function ()
{
    return (win != null ? win.webContents.openDevTools({mode:'detach'}) : undefined)
})

findApps = function ()
{
    var sortKeys

    sortKeys = function ()
    {
        var hideWin

        allKeys = Object.keys(apps).concat(Object.keys(scripts))
        allKeys.sort(function (a, b)
        {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
        if (win)
        {
            return post.toWins('appsFound')
        }
        else
        {
            createWindow()
            hideWin = function ()
            {
                return (win != null ? win.hide() : undefined)
            }
            if (!args.debug)
            {
                return setTimeout(hideWin,1000)
            }
        }
    }
    return appFind(function (appl)
    {
        apps = appl
        return sortKeys()
    })
}
appName = null
activeApp = null
activeWin = null

getActiveApp = function ()
{
    var top, wxw, _93_20_

    if (slash.win())
    {
        wxw = require('wxw')
        top = wxw('info','top')[0]
        if (((top != null ? top.path : undefined) != null))
        {
            appName = activeApp = slash.base(top.path)
        }
    }
    else
    {
        activeApp = childp.execSync(`${_k_.dir()}/../bin/appswitch -P`,{encoding:'utf8'})
    }
    klog('getActiveApp appName',appName,'-> activeApp',activeApp)
    if ((win != null))
    {
        if ((appName != null))
        {
            klog('getActiveApp post.currentApp',appName)
            post.toWins('currentApp',appName)
        }
        else
        {
            klog('getActiveApp clearSearch',appName)
            post.toWins('clearSearch')
        }
        return post.toWins('fade')
    }
    else
    {
        return createWindow()
    }
}

activateApp = function ()
{
    if (activeApp)
    {
        return childp.exec(`${_k_.dir()}/../bin/appswitch -fp ${activeApp}`,function (err)
        {
            return (win != null ? win.hide() : undefined)
        })
    }
}
export default {findApps:findApps,getActiveApp:getActiveApp,activateApp:activateApp}
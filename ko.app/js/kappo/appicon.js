var _k_ = {dir: function () { let url = import.meta.url.substring(7); let si = url.lastIndexOf('/'); return url.substring(0, si); }}

import kxk from "../kxk.js"
let slash = kxk.slash
let ffs = kxk.ffs

class AppIcon
{
    static cache = {}

    static pngPath (opt)
    {
        return slash.path(opt.iconDir,slash.name(opt.appPath) + ".png")
    }

    static async get (opt)
    {
        var pngPath, _21_20_

        opt.iconDir = ((_21_20_=opt.iconDir) != null ? _21_20_ : kakao.bundle.app('.stash/appIcons'))
        await ffs.mkdir(opt.iconDir)
        pngPath = AppIcon.pngPath(opt)
        if (AppIcon.cache[pngPath])
        {
            return pngPath
        }
        else
        {
            if (await ffs.fileExists(pngPath))
            {
                AppIcon.cache[pngPath] = true
                return pngPath
            }
            else
            {
                return await AppIcon.getIcon(opt)
            }
        }
    }

    static async getIcon (opt)
    {
        var appPath, close, icnsPath, idx, infoPath, open, text

        appPath = opt.appPath
        infoPath = slash.path(appPath,'Contents','Info.plist')
        text = await ffs.read(infoPath)
        idx = text.indexOf('CFBundleIconFile')
        if (idx > 0)
        {
            text = text.slice(idx)
            open = text.indexOf('<string>')
            close = text.indexOf('</string>')
            text = text.slice(open + 8, typeof close === 'number' ? close : -1)
            icnsPath = slash.path(slash.dir(infoPath),'Resources',text)
            if (!icnsPath.endsWith('.icns'))
            {
                icnsPath += ".icns"
            }
            console.log('icnsPath',icnsPath)
            if (await ffs.fileExists(icnsPath))
            {
                return await AppIcon.saveIcon(icnsPath,opt)
            }
        }
        else
        {
            return AppIcon.brokenIcon(opt)
        }
    }

    static async saveIcon (icnsPath, opt)
    {
        var arg, pngPath, sips

        pngPath = AppIcon.pngPath(opt)
        console.log('saveIcon',icnsPath,pngPath,opt)
        arg = `-Z ${opt.size} -s format png ${icnsPath} --out ${pngPath}`
        console.log("/usr/bin/sips " + arg)
        sips = await kakao('app.sh','/usr/bin/sips',{arg:arg})
        console.log('sips',sips)
        return pngPath
    }

    static brokenIcon (opt)
    {
        var brokenPath

        brokenPath = slash.join(_k_.dir(),'..','img','broken.png')
        return opt.cb(brokenPath,opt.cbArg)
    }
}

export default AppIcon;
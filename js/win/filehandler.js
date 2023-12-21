// monsterkodi/kode 0.245.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}}

var electron, File, filelist, kerror, klog, post, prefs, reversed, slash, _

_ = require('kxk')._
filelist = require('kxk').filelist
first = require('kxk').first
kerror = require('kxk').kerror
klog = require('kxk').klog
post = require('kxk').post
prefs = require('kxk').prefs
reversed = require('kxk').reversed
slash = require('kxk').slash

File = require('../tools/file')
electron = require('electron')
class FileHandler
{
    constructor ()
    {
        this.saveFileAs = this.saveFileAs.bind(this)
        this.openFile = this.openFile.bind(this)
        this.saveChanges = this.saveChanges.bind(this)
        this.saveFile = this.saveFile.bind(this)
        this.saveAll = this.saveAll.bind(this)
        this.removeFile = this.removeFile.bind(this)
        this.reloadFile = this.reloadFile.bind(this)
        this.reloadTab = this.reloadTab.bind(this)
        this.openFiles = this.openFiles.bind(this)
        this.loadFile = this.loadFile.bind(this)
        post.on('reloadFile',this.reloadFile)
        post.on('removeFile',this.removeFile)
        post.on('saveFileAs',this.saveFileAs)
        post.on('saveFile',this.saveFile)
        post.on('saveAll',this.saveAll)
        post.on('saveChanges',this.saveChanges)
        post.on('reloadTab',this.reloadTab)
        post.on('loadFile',this.loadFile)
        post.on('openFile',this.openFile)
        post.on('openFiles',this.openFiles)
    }

    loadFile (file, opt = {})
    {
        var activeTab, fileExists, filePos, tab

        if ((file != null) && file.length <= 0)
        {
            file = null
        }
        editor.saveScrollCursorsAndSelections()
        if ((file != null))
        {
            var _42_28_ = slash.splitFilePos(file); file = _42_28_[0]; filePos = _42_28_[1]

            if (!file.startsWith('untitled'))
            {
                file = slash.resolve(file)
                try
                {
                    process.chdir(slash.dir(file))
                }
                catch (err)
                {
                    kerror(err)
                }
            }
        }
        if (file !== (editor != null ? editor.currentFile : undefined) || (opt != null ? opt.reload : undefined))
        {
            if (fileExists = slash.fileExists(file))
            {
                this.addToRecent(file)
            }
            tab = tabs.tab(file)
            if (_k_.empty(tab))
            {
                tab = tabs.addTmpTab(file)
            }
            if (activeTab = tabs.activeTab())
            {
                if (tab !== activeTab)
                {
                    activeTab.clearActive()
                    if (activeTab.dirty)
                    {
                        activeTab.storeState()
                    }
                }
            }
            editor.setCurrentFile(file)
            tab.finishActivation()
            editor.restoreScrollCursorsAndSelections()
            if (fileExists)
            {
                post.toOtherWins('fileLoaded',file)
                post.emit('cwdSet',slash.dir(file))
            }
        }
        split.raise('editor')
        if ((filePos != null) && (filePos[0] || filePos[1]))
        {
            editor.singleCursorAtPos(filePos)
            return editor.scroll.cursorToTop()
        }
    }

    openFiles (ofiles, options)
    {
        var file, files, maxTabs

        options = (options != null ? options : {})
        if ((ofiles != null ? ofiles.length : undefined))
        {
            files = filelist(ofiles,{ignoreHidden:false})
            maxTabs = prefs.get('maximalNumberOfTabs',8)
            if (!options.newWindow)
            {
                files = files.slice(0, typeof maxTabs === 'number' ? maxTabs : -1)
            }
            if (files.length >= Math.max(11,maxTabs) && !options.skipCheck)
            {
                window.win.messageBox({type:'warning',buttons:['Cancel','Open All'],defaultId:1,cancelId:0,title:'A Lot of Files Warning',message:`You have selected ${files.length} files.`,detail:'Are you sure you want to open that many files?',cb:(function (answer)
                {
                    if (answer === 1)
                    {
                        options.skipCheck = true
                        return this.openFiles(ofiles,options)
                    }
                }).bind(this)})
                return
            }
            if (files.length === 0)
            {
                return []
            }
            window.stash.set('openFilePath',slash.dir(files[0]))
            if (!options.newWindow && !options.newTab)
            {
                file = slash.resolve(files.shift())
                this.loadFile(file)
            }
            var list = _k_.list(files)
            for (var _124_21_ = 0; _124_21_ < list.length; _124_21_++)
            {
                file = list[_124_21_]
                if (options.newWindow)
                {
                    post.toMain('newWindowWithFile',file)
                }
                else
                {
                    post.emit('newTabWithFile',file)
                }
            }
            return ofiles
        }
    }

    reloadTab (file)
    {
        if (file === (editor != null ? editor.currentFile : undefined))
        {
            return this.loadFile((editor != null ? editor.currentFile : undefined),{reload:true})
        }
        else
        {
            return post.emit('revertFile',file)
        }
    }

    reloadFile (file)
    {
        var tab

        if (!file)
        {
            return this.reloadActiveTab()
        }
        else if (tab = tabs.tab(file))
        {
            if (tab === tabs.activeTab())
            {
                return this.reloadActiveTab()
            }
            else
            {
                return tab.reload()
            }
        }
    }

    reloadActiveTab ()
    {
        var tab, _168_29_

        if (tab = tabs.activeTab())
        {
            tab.reload()
        }
        this.loadFile(editor.currentFile,{reload:true})
        if ((editor.currentFile != null))
        {
            return post.toOtherWins('reloadTab',editor.currentFile)
        }
    }

    removeFile (file)
    {
        var neighborTab, tab

        if (tab = tabs.tab(file))
        {
            if (tab === tabs.activeTab())
            {
                if (neighborTab = tab.nextOrPrev())
                {
                    neighborTab.activate()
                }
            }
            return tabs.closeTab(tab)
        }
    }

    saveAll ()
    {
        var tab

        var list = _k_.list(tabs.tabs)
        for (var _193_16_ = 0; _193_16_ < list.length; _193_16_++)
        {
            tab = list[_193_16_]
            if (tab.dirty)
            {
                if (tab === tabs.activeTab())
                {
                    this.saveFile(tab.file)
                }
                else
                {
                    if (!tab.file.startsWith('untitled'))
                    {
                        tab.saveChanges()
                    }
                }
            }
        }
    }

    saveFile (file)
    {
        var tabState

        file = (file != null ? file : editor.currentFile)
        if (!(file != null) || file.startsWith('untitled'))
        {
            this.saveFileAs()
            return
        }
        post.emit('unwatch',file)
        tabState = editor.do.tabState()
        try
        {
            post.emit('menuAction','doMacro',{actarg:'req'})
        }
        catch (err)
        {
            kerror(`macro req failed ${err}`)
        }
        return File.save(file,editor.text(),function (err, saved)
        {
            editor.saveScrollCursorsAndSelections()
            if (!_k_.empty(err))
            {
                kerror(`saving '${file}' failed:`,err)
            }
            else
            {
                editor.setCurrentFile(saved)
                editor.do.history = tabState.history
                editor.do.saveIndex = tabState.history.length
                post.toOtherWins('fileSaved',saved,window.winID)
                post.emit('saved',saved)
                post.emit('watch',saved)
            }
            return editor.restoreScrollCursorsAndSelections()
        })
    }

    addToRecent (file)
    {
        var recent

        recent = window.state.get('recentFiles',[])
        if (file === _k_.first(recent))
        {
            return
        }
        _.pull(recent,file)
        recent.unshift(file)
        while (recent.length > prefs.get('recentFilesLength',15))
        {
            recent.pop()
        }
        window.state.set('recentFiles',recent)
        return commandline.commands.open.setHistory(reversed(recent))
    }

    saveChanges ()
    {
        var _266_29_

        if ((editor.currentFile != null) && editor.do.hasChanges() && slash.fileExists(editor.currentFile))
        {
            return File.save(editor.currentFile,editor.text(),function (err)
            {
                if (err)
                {
                    return kerror(`FileHandler.saveChanges failed ${err}`)
                }
            })
        }
    }

    openFile (opt)
    {
        var cb, dir, _282_18_

        cb = function (files)
        {
            return post.emit('openFiles',files,opt)
        }
        if ((editor != null ? editor.currentFile : undefined))
        {
            dir = slash.dir(editor.currentFile)
        }
        dir = (dir != null ? dir : slash.resolve('.'))
        return (window.win != null ? window.win.openFileDialog({title:'Open File',defaultPath:window.stash.get('openFilePath',dir),properties:['openFile','multiSelections'],cb:cb}) : undefined)
    }

    saveFileAs ()
    {
        var cb, _302_18_

        cb = (function (file)
        {
            klog('saveFileAs',file)
            this.addToRecent(file)
            return this.saveFile(file)
        }).bind(this)
        return (window.win != null ? window.win.saveFileDialog({title:'Save File As',defaultPath:slash.unslash((editor != null ? editor.currentDir() : undefined)),cb:cb}) : undefined)
    }
}

module.exports = FileHandler
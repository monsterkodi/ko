###
00000000  000  000      00000000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000       000  000      000       000   000  000   000  0000  000  000   000  000      000       000   000
000000    000  000      0000000   000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000       000  000      000       000   000  000   000  000  0000  000   000  000      000       000   000
000       000  0000000  00000000  000   000  000   000  000   000  0000000    0000000  00000000  000   000
###

{ _, empty, filelist, first, kerror, klog, post, prefs, reversed, slash, valid } = require 'kxk'

File     = require '../tools/file'
electron = require 'electron'

class FileHandler

    @: ->

        post.on 'reloadFile'  @reloadFile
        post.on 'removeFile'  @removeFile
        post.on 'saveFileAs'  @saveFileAs
        post.on 'saveFile'    @saveFile
        post.on 'saveAll'     @saveAll
        post.on 'saveChanges' @saveChanges
        post.on 'reloadTab'   @reloadTab
        post.on 'loadFile'    @loadFile
        post.on 'openFile'    @openFile
        post.on 'openFiles'   @openFiles
        
    # 000       0000000    0000000   0000000          00000000  000  000      00000000  
    # 000      000   000  000   000  000   000        000       000  000      000       
    # 000      000   000  000000000  000   000        000000    000  000      0000000   
    # 000      000   000  000   000  000   000        000       000  000      000       
    # 0000000   0000000   000   000  0000000          000       000  0000000  00000000  
    
    loadFile: (file, opt={}) =>
    
        file = null if file? and file.length <= 0
    
        editor.saveScrollCursorsAndSelections()
    
        if file?
            [file, filePos] = slash.splitFilePos file
            if not file.startsWith 'untitled'
                file = slash.resolve file
                try
                    process.chdir slash.dir file
                catch err
                    kerror err
    
        if file != editor?.currentFile or opt?.reload
    
            if fileExists = slash.fileExists file
                @addToRecent file
            
            tab = tabs.tab file
            if empty tab
                tab = tabs.addTab file
            
            if activeTab = tabs.activeTab()
                if tab != activeTab
                    activeTab.clearActive()
                    if activeTab.dirty
                        activeTab.storeState()
                
            editor.setCurrentFile file
    
            tab.finishActivation() # setActive, restore state, update tabs
            
            editor.restoreScrollCursorsAndSelections()
            
            if fileExists
                post.toOtherWins 'fileLoaded' file # indexer
                post.emit 'cwdSet' slash.dir file
                
        split.raise 'editor'
    
        if filePos? and (filePos[0] or filePos[1])
            editor.singleCursorAtPos filePos
            editor.scroll.cursorToTop()

    #  0000000   00000000   00000000  000   000        00000000  000  000      00000000   0000000
    # 000   000  000   000  000       0000  000        000       000  000      000       000
    # 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   0000000
    # 000   000  000        000       000  0000        000       000  000      000            000
    #  0000000   000        00000000  000   000        000       000  0000000  00000000  0000000
    
    openFiles: (ofiles, options) => # called from file dialog, open command and browser
    
        options ?= {}
        
        if ofiles?.length
    
            files = filelist ofiles, ignoreHidden: false
            
            maxTabs = prefs.get 'maximalNumberOfTabs' 8
            
            if not options.newWindow
                files = files[0...maxTabs]
    
            if files.length >= Math.max(11, maxTabs) and not options.skipCheck
                window.win.messageBox
                    type:       'warning'
                    buttons:    ['Cancel' 'Open All']
                    defaultId:  1
                    cancelId:   0
                    title:      'A Lot of Files Warning'
                    message:    "You have selected #{files.length} files."
                    detail:     'Are you sure you want to open that many files?'
                    cb: (answer) => 
                        if answer == 1 
                            options.skipCheck = true
                            @openFiles ofiles, options
                return
                
    
            if files.length == 0
                return []
    
            window.stash.set 'openFilePath' slash.dir files[0]
    
            if not options.newWindow and not options.newTab
                file = slash.resolve files.shift()
                @loadFile file
    
            for file in files
                if options.newWindow
                    post.toMain 'newWindowWithFile' file
                else
                    post.emit 'newTabWithFile' file
    
            return ofiles
          
    # 00000000   00000000  000       0000000    0000000   0000000    
    # 000   000  000       000      000   000  000   000  000   000  
    # 0000000    0000000   000      000   000  000000000  000   000  
    # 000   000  000       000      000   000  000   000  000   000  
    # 000   000  00000000  0000000   0000000   000   000  0000000    
    
    reloadTab: (file) =>
        
        if file == editor?.currentFile
            @loadFile editor?.currentFile, reload:true
        else
            post.emit 'revertFile' file
                
    # 00000000   00000000  000       0000000    0000000   0000000          00000000  000  000      00000000  
    # 000   000  000       000      000   000  000   000  000   000        000       000  000      000       
    # 0000000    0000000   000      000   000  000000000  000   000        000000    000  000      0000000   
    # 000   000  000       000      000   000  000   000  000   000        000       000  000      000       
    # 000   000  00000000  0000000   0000000   000   000  0000000          000       000  0000000  00000000  
    
    reloadFile: (file) =>
        
        if not file
            @reloadActiveTab()
        else if tab = tabs.tab file
            if tab == tabs.activeTab()
                @reloadActiveTab()
            else
                tab.reload()
            
    reloadActiveTab: ->
        
        if tab = tabs.activeTab()
            tab.reload()
        
        @loadFile editor.currentFile, reload:true
    
        if editor.currentFile?
            post.toOtherWins 'reloadTab', editor.currentFile

    # 00000000   00000000  00     00   0000000   000   000  00000000        00000000  000  000      00000000  
    # 000   000  000       000   000  000   000  000   000  000             000       000  000      000       
    # 0000000    0000000   000000000  000   000   000 000   0000000         000000    000  000      0000000   
    # 000   000  000       000 0 000  000   000     000     000             000       000  000      000       
    # 000   000  00000000  000   000   0000000       0      00000000        000       000  0000000  00000000  
    
    removeFile: (file) =>
        
        if tab = tabs.tab file
            if tab == tabs.activeTab()
                if neighborTab = tab.nextOrPrev()
                    neighborTab.activate()
            tabs.closeTab tab
            
    #  0000000   0000000   000   000  00000000         0000000   000      000      
    # 000       000   000  000   000  000             000   000  000      000      
    # 0000000   000000000   000 000   0000000         000000000  000      000      
    #      000  000   000     000     000             000   000  000      000      
    # 0000000   000   000      0      00000000        000   000  0000000  0000000  
    
    saveAll: =>
        
        for tab in tabs.tabs
            if tab.dirty 
                if tab == tabs.activeTab()
                    @saveFile tab.file
                else
                    if not tab.file.startsWith 'untitled'
                        tab.saveChanges()

    #  0000000   0000000   000   000  00000000        00000000  000  000      00000000  
    # 000       000   000  000   000  000             000       000  000      000       
    # 0000000   000000000   000 000   0000000         000000    000  000      0000000   
    #      000  000   000     000     000             000       000  000      000       
    # 0000000   000   000      0      00000000        000       000  0000000  00000000  
    
    saveFile: (file) =>
    
        file ?= editor.currentFile
        
        if not file? or file.startsWith 'untitled'
            @saveFileAs()
            return
              
        post.emit 'unwatch' file
        
        tabState = editor.do.tabState()
        
        try
            post.emit 'menuAction' 'doMacro' actarg:'req' # !!!!!!!
        catch err
            kerror "macro req failed #{err}"
        
        File.save file, editor.text(), (err, saved) ->
            
            editor.saveScrollCursorsAndSelections()
            
            if valid err
                kerror "saving '#{file}' failed:" err
            else
                editor.setCurrentFile     saved
                editor.do.history   = tabState.history
                editor.do.saveIndex = tabState.history.length
                post.toOtherWins 'fileSaved' saved, window.winID
                # post.toMain 'fileSaved' saved, window.winID
                post.emit     'saved'     saved
                post.emit     'watch'     saved

            editor.restoreScrollCursorsAndSelections()
                  
    #  0000000   0000000    0000000          00000000   00000000   0000000  00000000  000   000  000000000  
    # 000   000  000   000  000   000        000   000  000       000       000       0000  000     000     
    # 000000000  000   000  000   000        0000000    0000000   000       0000000   000 0 000     000     
    # 000   000  000   000  000   000        000   000  000       000       000       000  0000     000     
    # 000   000  0000000    0000000          000   000  00000000   0000000  00000000  000   000     000     
    
    addToRecent: (file) ->
    
        recent = window.state.get 'recentFiles' []
        return if file == first recent
        _.pull recent, file
        recent.unshift file
        while recent.length > prefs.get 'recentFilesLength' 15
            recent.pop()
    
        window.state.set 'recentFiles' recent
        # window.titlebar.refreshMenu()
        commandline.commands.open.setHistory reversed recent
                
    #  0000000   0000000   000   000  00000000         0000000  000   000   0000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000             000       000   000  000   000  0000  000  000        000       000       
    # 0000000   000000000   000 000   0000000         000       000000000  000000000  000 0 000  000  0000  0000000   0000000   
    #      000  000   000     000     000             000       000   000  000   000  000  0000  000   000  000            000  
    # 0000000   000   000      0      00000000         0000000  000   000  000   000  000   000   0000000   00000000  0000000   
    
    saveChanges: =>
        
        if editor.currentFile? and editor.do.hasChanges() and slash.fileExists editor.currentFile
            File.save editor.currentFile, editor.text(), (err) ->
                kerror "FileHandler.saveChanges failed #{err}" if err
    
    #  0000000   00000000   00000000  000   000        00000000  000  000      00000000  
    # 000   000  000   000  000       0000  000        000       000  000      000       
    # 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   
    # 000   000  000        000       000  0000        000       000  000      000       
    #  0000000   000        00000000  000   000        000       000  0000000  00000000  
    
    openFile: (opt) =>
    
        dir = slash.dir editor.currentFile if editor?.currentFile
        dir ?= slash.resolve '.'
        window.win?.openFileDialog(
            title: 'Open File'
            defaultPath: window.stash.get('openFilePath' dir)
            properties: ['openFile' 'multiSelections'] 
            cb: (files) => post.emit 'openFiles' files, opt
            )
                
    #  0000000   0000000   000   000  00000000        00000000  000  000      00000000          0000000    0000000  
    # 000       000   000  000   000  000             000       000  000      000              000   000  000       
    # 0000000   000000000   000 000   0000000         000000    000  000      0000000          000000000  0000000   
    #      000  000   000     000     000             000       000  000      000              000   000       000  
    # 0000000   000   000      0      00000000        000       000  0000000  00000000         000   000  0000000   
    
    saveFileAs: =>
    
        window.win?.saveFileDialog(
            title: 'Save File As' 
            defaultPath: slash.unslash editor?.currentDir()
            cb: (file) =>
                klog 'saveFileAs' file
                @addToRecent file
                @saveFile file
            )
            
module.exports = FileHandler

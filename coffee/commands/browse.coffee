###
0000000    00000000    0000000   000   000   0000000  00000000  
000   000  000   000  000   000  000 0 000  000       000       
0000000    0000000    000   000  000000000  0000000   0000000   
000   000  000   000  000   000  000   000       000  000       
0000000    000   000   0000000   00     00  0000000   00000000  
###

{ post, slash, stopEvent, valid, empty, str, os, clamp, log, error, $ } = require 'kxk'

Command     = require '../commandline/command'
FileBrowser = require '../browser/filebrowser'
dirList     = require '../tools/dirlist'

class Browse extends Command
    
    constructor: (commandline) ->

        super commandline

        @cmdID     = 0
        @browser   = new FileBrowser window.area.view
        @commands  = Object.create null
        @names     = ["browse", "Browse", "shelf"]
        
        window.area.on 'resized', @onAreaResized
        post.on 'file', @onFile
        
        @browser.on 'itemActivated', @onBrowserItemActivated
        
        @syntaxName = 'browser'
        
    onFile: (file) =>
        
        if @isActive() and @getText() != slash.tilde file
            @setText slash.tilde file
        
    clear: ->
        return if @browser.cleanUp()
        super()
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (action) ->

        @browser.start()
        
        if action != 'shelf'
            # log 'browse.start', window.editor.currentFile
            if window.editor.currentFile?
                @browser.navigateToFile window.editor.currentFile 
            else 
                # log 'browse start process.cwd', process.cwd()
                post.emit 'filebrowser', 'loadItem', file:process.cwd(), type:'dir'
            @browser.focus()

        name = action
        name = 'browse' if action == 'shelf'
        
        super name

        select: true
        do:     @name == 'Browse' and 'half area' or 'quart area'
        focus:  action == 'shelf' and 'shelf' or null

    #  0000000   0000000   00     00  00000000   000      00000000  000000000  00000000  
    # 000       000   000  000   000  000   000  000      000          000     000       
    # 000       000   000  000000000  00000000   000      0000000      000     0000000   
    # 000       000   000  000 0 000  000        000      000          000     000       
    #  0000000   0000000   000   000  000        0000000  00000000     000     00000000  
    
    completeCallback: (err, files) =>
        
        if not err?
            if not empty @getText().trim()
                text = slash.resolve @getText().trim()
                matches = files.filter (f) -> f.file.startsWith text
                
                if not empty matches
                    @setText slash.tilde matches[0].file
                    
                if matches.length > 1
    
                    items = matches.map (m) -> 
                        
                        item = Object.create null
                        
                        switch m.type
                            when 'file'
                                item.line = ' '
                                item.clss = 'file'
                            when 'dir'
                                item.line = '▸'
                                item.clss = 'directory'
                                
                        item.text = slash.file m.file
                        item.file = m.file
                        item
    
                    @showItems items
                    @select 0
                    return
        @hideList()
    
    complete: ->
        
        text = @getText().trim()

        if not text.endsWith('/') and slash.dirExists text
            @setText text + '/'
            @hideList()
            true            
        else if text.endsWith '/'
            if slash.dirExists slash.resolve text
                dirList slash.resolve(text), @completeCallback
                true
        else if not empty slash.dir text
            if slash.dirExists slash.resolve slash.dir text
                dirList slash.resolve(slash.dir(text)), @completeCallback
                true

    onTabCompletion: ->
        
        @complete()
        true
            
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000      
    # 000       000   000  000   000  0000  000  000        000       000   000    
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000    
    # 000       000   000  000   000  000  0000  000   000  000       000   000    
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000      

    commonPrefix: (strA,strB) ->
        
        prefix = ''
        for i in [0...Math.min(strA.length, strB.length)]
            break if strA[i] != strB[i]
            prefix += strA[i]
        prefix
    
    clearBrokenPartForFiles: (files) ->
        
        brokenPath = slash.resolve @getText()
        longestMatch = ''
        for file in files
            file = file.file
            prefix = @commonPrefix file, brokenPath
            if prefix.length > longestMatch.length
                longestMatch = prefix 
        l = @getText().length
  
        if not empty longestMatch
            @setText slash.tilde longestMatch
            @complete()
                
    changedCallback: (err, files) =>
        
        if not err?

            if empty @getText().trim()
                @hideList()
                return
                
            path = slash.resolve @getText().trim()
            matches = files.filter (f) -> f.file.startsWith path
                                                
            if empty matches
                @clearBrokenPartForFiles files
                return

            s = slash.tilde(path).length
            
            text = slash.tilde slash.tilde matches[0].file
            @setText text
            
            l = text.length
            
            @commandline.selectSingleRange [0, [s,l]], before: true

            if matches.length < 2
                @hideList()
            else
                
                items = matches.map (m) -> 
                    
                    item = Object.create null
                    
                    switch m.type
                        when 'file'
                            item.line = ' '
                            item.clss = 'file'
                        when 'dir'
                            item.line = '▸'
                            item.clss = 'directory'
                            
                    item.text = slash.file m.file
                    item.file = m.file
                    item
    
                @showItems items
    
    changed: (command) ->
        
        text = @getText().trim()
        if not text.endsWith '/'
            @walker?.end()
            @walker = dirList slash.resolve(slash.dir(text)), @changedCallback
        else
            @hideList()
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        switch combo
            when 'backspace'
                if commandline.mainCursor()[0] == commandline.selection(0)?[1][0] # cursor is at selection start
                    commandline.do.start()         # force simultaneous 
                    commandline.deleteSelection()  # deletion of selection 
                    commandline.deleteBackward()   # and backspace. 
                    commandline.do.end()           # it should feel as if selection wasn't there.
                    return
            when 'enter'
                @execute @getText()
                focusBrowser = => @browser.focus()
                setTimeout focusBrowser, 100
                return
        'unhandled'
            
    # 000      000   0000000  000000000   0000000  000      000   0000000  000   000  
    # 000      000  000          000     000       000      000  000       000  000   
    # 000      000  0000000      000     000       000      000  000       0000000    
    # 000      000       000     000     000       000      000  000       000  000   
    # 0000000  000  0000000      000      0000000  0000000  000   0000000  000   000  
    
    listClick: (index) =>
        
        file = @commandList.items[index]?.file
        file = slash.tilde file if file?
        file ?= @commandList.line index
        log 'browse.listClick index, file', index, file
        @selected = index
        @execute file

    #  0000000  00000000  000      00000000   0000000  000000000  
    # 000       000       000      000       000          000     
    # 0000000   0000000   000      0000000   000          000     
    #      000  000       000      000       000          000     
    # 0000000   00000000  0000000  00000000   0000000     000     
    
    select: (i) -> 
        
        @selected = clamp -1, @commandList?.numLines()-1, i
        
        if @selected < 0
            log 'hideList'
            @hideList()
            return     

        @commandList?.selectSingleRange @commandList.rangeForLineAtIndex @selected
        @commandList?.do.cursors [[0, @selected]]
            
        text = slash.tilde @commandList.items[@selected].file
        @setText text
        s = slash.file(text).length
        l = text.length
        @commandline.selectSingleRange [0, [l-s,l]]
                
    selectListItem: (dir) ->
        
        return if not @commandList?
        
        switch dir
            when 'up'   then @select @selected-1
            when 'down' then @select @selected+1

    #  0000000   0000000   000   000   0000000  00000000  000      
    # 000       000   000  0000  000  000       000       000      
    # 000       000000000  000 0 000  000       0000000   000      
    # 000       000   000  000  0000  000       000       000      
    #  0000000  000   000  000   000   0000000  00000000  0000000  
    
    cancel: ->
        
        @hideList()
        focus: @receiver
        show: 'editor'
            
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (command) ->
        
        return error "no command?" if not command?
        
        @hideList()
        
        @cmdID += 1
        cmd = command.trim()
        if cmd.length 
            if slash.dirExists slash.removeLinePos cmd
                @browser.loadItem file:cmd, type:'dir'
                @commandline.setText cmd
                return
            else if slash.fileExists slash.removeLinePos cmd
                @commandline.setText cmd
                post.emit 'jumpToFile', file:cmd
                return

        error 'browse.execute -- unhandled', cmd     
    
    onBrowserItemActivated: (item) =>

        if not @isActive()
            @commandline.command?.onBrowserItemActivated? item
            return
        
        if item.file
            pth = slash.tilde item.file
            if item.type == 'dir' 
                pth += '/'
                if item.name == '..' and @browser.activeColumn()?.parent?.file
                    # show current path instead of updir when .. item was activated
                    pth = slash.tilde @browser.activeColumn()?.parent?.file
            
            @commandline.setText pth

    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse

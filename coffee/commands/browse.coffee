
# 0000000    00000000    0000000   000   000   0000000  00000000  
# 000   000  000   000  000   000  000 0 000  000       000       
# 0000000    0000000    000   000  000000000  0000000   0000000   
# 000   000  000   000  000   000  000   000       000  000       
# 0000000    000   000   0000000   00     00  0000000   00000000  

{ slash, fileList, post, stopEvent, empty, str, os, clamp, log, error, $ } = require 'kxk'

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
        
        @browser.on 'itemActivated', @onItemActivated
        
        @syntaxName = 'browser'
        
    restoreState: (state) -> 
        
        super state
        @browser.start()
        @browser.loadFile state.text, focus:false, dontJump:true
        window.split.swap $('terminal'), $('area')

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
            
            if window.editor.currentFile?
                @browser.loadFile window.editor.currentFile 
            else 
                @browser.loadDir process.cwd()

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
            # log 'completeCallback:', files.map (f) -> f.file
            if not empty @getText().trim()
                text = slash.resolve @getText().trim()
                matches = files.filter (f) -> f.file.startsWith text
                # log 'matches', matches
                
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
    
                    # log 'show items', items
                    @showItems items
                    @select 0
    
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

    changedCallback: (err, files) =>
        
        if not err?
            # log 'changedCallback:', files.map (f) -> f.file
            # log 'changedCallback:', @getText().trim().length, @getText().trim(), @commandline.mainCursor()
            
            if empty @getText().trim()
                @hideList()
                return
                
            path = slash.resolve @getText().trim()
            matches = files.filter (f) -> f.file.startsWith path
            # log 'matches', matches
                                                
            if empty matches
                @hideList()
                return

            s = slash.tilde(path).length
            
            text = slash.tilde slash.tilde matches[0].file
            @setText text
            
            l = text.length
            
            # log 'selectSingleRange', s, l
            
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
    
                # log 'show items', items
                @showItems items
    
    changed: (command) ->
        
        # log 'changed', command
        text = @getText().trim()
        if not text.endsWith '/'
            @walker?.end()
            @walker = dirList slash.resolve(slash.dir(text)), @changedCallback
        else
            @hideList()
        
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        
        # log "browse.coffee handleModKeyComboEvent #{key}"
        switch combo
            when 'backspace'
                cursorAtSelectionStart = commandline.mainCursor()[0] == commandline.selection(0)?[1][0]
                return 'unhandled' if not cursorAtSelectionStart
                
                commandline.do.start()         # force simultaneous deletion of selection 
                commandline.deleteSelection()  # and backspace. 
                commandline.deleteBackward()   # it should feel as if selection isn't there
                commandline.do.end()
                return #stopEvent event
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
        log 'browse.listClick', index, file
        @selected = index
        @execute file

    #  0000000  00000000  000      00000000   0000000  000000000  
    # 000       000       000      000       000          000     
    # 0000000   0000000   000      0000000   000          000     
    #      000  000       000      000       000          000     
    # 0000000   00000000  0000000  00000000   0000000     000     
    
    select: (i) -> 
        
        @selected = clamp -1, @commandList?.numLines()-1, i
        
        # log 'select', i, @selected
        
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
                            
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (command) ->
        
        return error "no command?" if not command?
        
        @cmdID += 1
        cmd = command.trim()
        if cmd.length 
            if slash.dirExists slash.removeLinePos cmd
                @browser.browse cmd
                @commandline.setText cmd
                return
            else if slash.fileExists slash.removeLinePos cmd
                @browser.loadFile cmd
                @commandline.setText cmd
                return

        error 'browse.execute -- unhandled', cmd     
    
    onItemActivated: (item) =>

        if item.file 
            pth = slash.tilde item.file
            if item.type == 'dir' 
                pth += '/'
                if item.name == '..' and @browser.activeColumn()?.parent?.file
                    # show current path instead of updir when .. item was acticated
                    pth = slash.tilde @browser.activeColumn()?.parent?.file
            
            @commandline.setText pth

    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse

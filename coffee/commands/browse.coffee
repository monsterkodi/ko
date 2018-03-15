
# 0000000    00000000    0000000   000   000   0000000  00000000  
# 000   000  000   000  000   000  000 0 000  000       000       
# 0000000    0000000    000   000  000000000  0000000   0000000   
# 000   000  000   000  000   000  000   000       000  000       
# 0000000    000   000   0000000   00     00  0000000   00000000  

{ slash, fileList, post, empty, str, log, os, $ } = require 'kxk'

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

                log 'show items', items
                @showItems items
    
    complete: ->
        
        text = @getText().trim()
        if not text.endsWith('/') and slash.dirExists text
            @setText text + '/'
            @changed @getText()
            true            
        else if text.endsWith '/'
            if slash.dirExists slash.resolve text
                dirList slash.resolve(text), @completeCallback
                true
            else
                super()
        else
            if slash.dirExists slash.resolve slash.dir text
                dirList slash.resolve(slash.dir(text)), @completeCallback
                true
            else
                super()
        
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
            if slash.dirExists cmd
                @browser.browse cmd
    
    onItemActivated: (item) =>
        
        if item.file 
            pth = slash.tilde item.file
            if item.type == 'dir' then pth += '/'
            @commandline.setText pth

    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse

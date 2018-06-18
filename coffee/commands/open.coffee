###
 0000000   00000000   00000000  000   000
000   000  000   000  000       0000  000
000   000  00000000   0000000   000 0 000
000   000  000        000       000  0000
 0000000   000        00000000  000   000
###

{ post, valid, empty, clamp, slash, fs, os, error, log, _ } = require 'kxk'
  
profile  = require '../tools/profile'
Projects = require '../tools/projects'
Command  = require '../commandline/command'
render   = require '../editor/render'
syntax   = require '../editor/syntax'
fuzzy    = require 'fuzzy'
        
relative = (rel, to) ->
    
    r = slash.relative rel, to

    if r.startsWith '../../' 
        tilde = slash.tilde rel
        if tilde.length < r.length
            r = tilde
    if rel.length < r.length    
        r = rel
    r    

class Open extends Command

    constructor: (commandline) ->
        
        super commandline
        
        post.on 'file', @onFile
        post.on 'dir',  @onDir
        
        @names      = ["open", "new window"]
        @files      = []
        @file       = null
        @dir        = null
        @pkg        = null
        @selected   = 0
          
    onFile: (file) =>
        
        if @isActive() 
            if empty file
                @setText ''
            else if @getText() != slash.file file
                @setText slash.file file
                
    onDir: (dir) =>
        
        if @isActive() 
            if empty dir
                @setText ''
            else if @getText() != slash.file dir
                @setText slash.file dir
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
        
        command = command.trim()

        [file, pos] = slash.splitFilePos command ? @getText().trim()
        # items = @listItems flat: true, currentText: file    
        items = @listItems flat: true, currentText:file, maxItems:10000
        # items = @listItems currentText:file, maxItems:10000
        if command.length
            fuzzied = fuzzy.filter slash.basename(file), items, extract: (o) -> o.text            
            items = (f.original for f in fuzzied)
            items.sort (a,b) -> b.weight - a.weight
                    
        if items.length
            @showItems items.slice 0, 200
            @select 0
            @positionList()

    #  0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
    # 000       000   000  000   000  000   000  000      000          000     000     
    # 000       000   000  000000000  00000000   000      0000000      000     0000000 
    # 000       000   000  000 0 000  000        000      000          000     000     
    #  0000000   0000000   000   000  000        0000000  00000000     000     00000000

    complete: -> 

        if @commandList? and @commandList.line(@selected).startsWith(slash.basename @getText()) and not @getText().trim().endsWith('/')
            @setText slash.join(slash.dir(@getText()), @commandList.line(@selected))
            if slash.dirExists @getText()
                @setText @getText() + '/'
                @changed @getText()
            true
        else if not @getText().trim().endsWith('/') and slash.dirExists @getText()
            @setText @getText() + '/'
            @changed @getText()
            true            
        else
            log 'post.get indexer projects'
            projects = post.get 'indexer', 'projects'
            for p in Object.keys(projects).sort()
                if p.startsWith @getText()
                    pdir = projects[p].dir
                    pdir = slash.join(pdir, 'coffee') if slash.dirExists slash.join pdir, 'coffee'
                    @setText pdir + '/'
                    @changed @getText()
                    return true
            super()
    
    # 000   000  00000000  000   0000000   000   000  000000000
    # 000 0 000  000       000  000        000   000     000   
    # 000000000  0000000   000  000  0000  000000000     000   
    # 000   000  000       000  000   000  000   000     000   
    # 00     00  00000000  000   0000000   000   000     000   

    weight: (item, opt) =>            
                
        return item.bonus if item.bonus?
        
        f = item.file
        r = item.text
        b = slash.file f
        n = slash.base f
                
        relBonus = 0
        nameBonus = 0
        if opt.currentText?.length
            relBonus  = r.startsWith(opt.currentText) and 65535 * (opt.currentText.length/r.length) or 0 
            nameBonus = n.startsWith(opt.currentText) and 2184  * (opt.currentText.length/n.length) or 0
           
        extensionBonus = switch slash.ext b
            when 'coffee'               then 1000
            when 'cpp', 'hpp', 'h'    then 90
            when 'md', 'styl', 'pug'  then 50
            when 'noon'                 then 25
            when 'js', 'json', 'html' then -10
            else 0 
        # extensionBonus -= 400 if b[0] == '.'
        
        if @file and slash.ext(@file) == slash.ext b
            extensionBonus += 1000
        
        lengthPenalty = slash.dir(f).length
                
        if opt.flat
            
            updirPenalty = r.split('../').length * 819
            
            item.weight = relBonus + nameBonus + extensionBonus - lengthPenalty - updirPenalty
            
        else
            
            directoryBonus = item.line == '▸' and 500 or 0
            
            if f.startsWith @dir
                localBonus = Math.max 0, (5-r.split('/').length) * 4095
            else
                localBonus = Math.max 0, (5-r.split('../').length) * 819
            
            item.weight = localBonus + directoryBonus + relBonus + nameBonus + extensionBonus - lengthPenalty
            
        item.weight     

    weightedItems: (items, opt) -> 
        # log 'weightedItems', items.length, opt
        items.sort (a,b) => @weight(b, opt) - @weight(a, opt)
        # for item in items.slice 0, 10
            # log item.weight, item.file, item.text, item.bonus ? ''
        items
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    listItems: (opt) ->
        
        opt ?= {}
        opt.maxItems ?= 200
        opt.flat ?= true
        
        # log 'listItems', opt
        
        items = []
        
        @lastFileIndex = 0
        
        @dir = slash.resolve '~' if not @dir?

        if @history? and not opt.currentText and @history.length > 1
            f = @history[@history.length-2]
            item = Object.create null
            item.text = relative f, @dir
            item.line = ' '
            item.file = f
            item.bonus = 1048575
            items.push item
            @lastFileIndex = 0
                
        for file in @files
            
            rel = relative file, @dir
            
            if rel.length
                item = Object.create null
                item.line = ' ' # < insert file type icon?
                item.text = rel
                item.file = file
                items.push item

        items = @weightedItems items, opt
        items = _.uniqBy items, (o) -> o.text
        
        # log 'listItems', items.length
        
        items.slice 0, opt.maxItems
    
    # 000   000  000   0000000  000000000   0000000   00000000   000   000  
    # 000   000  000  000          000     000   000  000   000   000 000   
    # 000000000  000  0000000      000     000   000  0000000      00000    
    # 000   000  000       000     000     000   000  000   000     000     
    # 000   000  000  0000000      000      0000000   000   000     000     
    
    showHistory: () ->

        if @history.length > 1 and @selected <= 0
            items = []
            bonus = 1048575
            for f in @history
                item = Object.create null
                item.text = relative f, @dir
                item.file = f
                item.bonus = bonus
                items.push item
                bonus -= 1 
            items.pop()
            @showItems items
            @select items.length-1
            @setAndSelectText items[@selected].text
        else
            'unhandled'

    showFirst: () ->
        
        if @commandList and @selected == @commandList.meta.metas.length - 1
            @showItems @listItems()
            @select 0
        else
            'unhandled'
                
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: (name) ->
        
        if name == @names[0] # command+p command+p to open previous file
            if @commandList? and @lastFileIndex == @selected
                return @execute()
                
        super name
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (name) -> 
        
        if @commandline.lastFocus == 'commandline-editor' == window.lastFocus
            
            @file = window.editor.currentFile
            if dir = slash.resolve @commandline.text()
                @dir = dir
            else
                @dir = slash.dir(@file) ? process.cwd()
        
        else if @commandline.lastFocus == 'shelf' or @commandline.lastFocus.startsWith 'FileBrowser'
            
            item = window.filebrowser.lastUsedColumn().parent
            
            switch item.type
                when 'dir'
                    @file = window.editor.currentFile
                    @dir  = item.file
                when 'file'
                    @file = item.file
                    @dir  = slash.dir @file
                    
        else if window.editor.currentFile?
            
            @file = window.editor.currentFile
            @dir  = slash.dir @file
            
        else 
            
            @file = null
            @dir  = process.cwd()
            
        # log 'open.start @dir', @dir
        
        @files = Projects.files @dir
        # log 'open.loadDir @files', @files.length
        @loadState()
        @showList()
        @showItems @listItems()
        @grabFocus()
        @select 0  
        
        text:   @commandList.line @selected
        select: true
                
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        if @selected >= 0
            # log "execute #{@selected}:", @commandList?.line @selected
            listValue = @commandList?.line(@selected) 

        if @selected >= 0 and listValue? 
            if slash.dirExists @resolvedPath listValue
                resolved = @resolvedPath listValue
        else if slash.dirExists @resolvedPath command
            resolved = @resolvedPath command
                    
        @hideList()

        if listValue
            [file, pos] = slash.splitFilePos listValue
            file = @resolvedPath listValue
            file = slash.joinFilePos file, pos
            # files = [file]
            if @name == 'new window'
                post.toMain 'newWindowWithFile', file
            else
                post.emit 'jumpToFile', file:file
        else
            log 'dafuk?'
            # files = _.words command, new RegExp "[^, ]+", 'g'
            # for i in [0...files.length]
                # file = files[i]
                # [file, pos] = slash.splitFilePos file
                # file = @resolvedPath file
                # if not slash.fileExists file
                    # if '' == slash.ext file
                        # if slash.fileExists file + '.coffee'
                            # file += '.coffee'
                # file = slash.joinFilePos file, pos
                # files.splice i, 1, file
            
        # options = {}
        # options.newWindow = true if @name == "new window"
        
        # log 'open.execute files:', files
        
        # opened = window.openFiles files, options
        
        if file #opened?.length
            
            super file
            # if opened.length == 1
                # super opened[0]
            # else
                # super selected
                
            text:   file # (slash.basename(f) for f in opened).join ' '
            focus:  'editor'
            show:   'editor'
            status: 'ok'
        else
            status: 'failed'
              
    # 00000000   00000000   0000000   0000000   000      000   000  00000000  0000000  
    # 000   000  000       000       000   000  000      000   000  000       000   000
    # 0000000    0000000   0000000   000   000  000       000 000   0000000   000   000
    # 000   000  000            000  000   000  000         000     000       000   000
    # 000   000  00000000  0000000    0000000   0000000      0      00000000  0000000  
    
    resolvedPath: (p, parent=@dir) ->
        
        return (parent ? slash.resolve '~') if not p?
        if p[0] in ['~', '/'] or p[1] == ':'
            slash.resolve p
        else
            slash.resolve slash.join parent, p

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        
        switch combo
            when 'up'   then return @showHistory()
            when 'down' then return @showFirst()
        super mod, key, combo, event

module.exports = Open

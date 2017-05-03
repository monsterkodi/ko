
# 00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000  
# 000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000  
# 000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ packagePath, encodePath, fileName, swapExt, resolve, elem, post, clamp, 
  error, log, process, childp, path, fs, os, _
}        = require 'kxk'
Browser  = require './browser'
dirlist  = require '../tools/dirlist'

class FileBrowser extends Browser
    
    constructor: (@view) -> 
                
        super @view
        @name = 'FileBrowser'
        post.on 'browserColumnItemsSet', @onColumnItemsSet
    
    # 00000000  000  000      00000000  
    # 000       000  000      000       
    # 000000    000  000      0000000   
    # 000       000  000      000       
    # 000       000  0000000  00000000  
    
    loadFile: (file, opt = focus:true, column:0) ->
        
        dir  = packagePath file
        dir ?= path.dirname file
        opt.file = file
        @skipJump = opt.dontJump
        @loadDir dir, opt

    # 0000000    00000000    0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000 0 000  000       000       
    # 0000000    0000000    000   000  000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000       000  000       
    # 0000000    000   000   0000000   00     00  0000000   00000000  
    
    browse: (dir) -> 

        return error "no dir?" if not dir?
        
        @clearColumnsFrom 1, pop:true
        @loadDir dir, column:0, row: 0, focus:true

    # 0000000    000  00000000   
    # 000   000  000  000   000  
    # 000   000  000  0000000    
    # 000   000  000  000   000  
    # 0000000    000  000   000  
    
    loadDir: (dir, opt) -> 
        
        opt ?= {}
        opt.ignoreHidden ?= prefs.get "browser:ignoreHidden:#{dir}", false
        
        dirlist dir, opt, (err, items) => 
            
            if err? then return error "can't load dir #{dir}: #{err}"
            
            opt.parent ?=
                type: 'dir'
                file: dir
                name: path.basename dir

            column = opt.column ? 0
                
            if column == 0 or @columns[column-1].activeRow()?.item.name == '..'
                
                updir = resolve path.join dir, '..'
                
                if not (updir == dir == '/')
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        file:  updir
                        
            @loadItems items, opt

    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->

        if opt?.file
            @navigateTargetFile = opt.file
            
        super items, opt
      
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    onColumnItemsSet: (column) => 
        
        if @navigateTargetFile
            column.navigateTo @navigateTargetFile
    
    navigateTo: (opt) -> @columns[0].navigateTo opt
    
    endNavigateToTarget: ->
        
        if @navigateTargetFile
            
            delete @navigateTargetFile
            
            col = @lastUsedColumn()
            
            if col.parent.type == 'file'
                @column(col.index-1)?.focus()
            else
                col.focus()
    
module.exports = FileBrowser

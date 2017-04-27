
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

        dirlist dir, opt, (err, items) => 
            
            if err? then return error "can't load dir #{dir}: #{err}"
            
            opt ?= {}
            opt.parent ?=
                type: 'dir'
                abs: dir
                name: path.basename dir
                
            if not opt?.column or @columns[0]?.activeRow()?.item.name == '..'
                
                updir = resolve path.join dir, '..'
                
                if not (updir == dir == '/') and (not @columns[0].parent? or @columns[0].parent.abs.startsWith dir) 
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        abs:  updir
                        
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

    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000       000   000  0000  000     000     000       0000  000     000     
    # 000       000   000  000 0 000     000     0000000   000 0 000     000     
    # 000       000   000  000  0000     000     000       000  0000     000     
    #  0000000   0000000   000   000     000     00000000  000   000     000     
    
    loadContent: (row, opt) ->
        
        item  = row.item
        items = []
        file  = item.abs
        name  = fileName file
        
        clsss = post.get 'indexer', 'classes'
        clsss = _.pickBy clsss, (obj, key) -> obj.file == file
        for clss,clsso of clsss
            items.push name: clss, text: '● '+clss, type:'class', file: file, line: clsso.line
            for mthd,mthdo of clsso.methods
                items.push name: mthd, text: '  ▸ '+mthd, type:'method', file: file, line: mthdo.line

        files = post.get 'indexer', 'files'
        funcs = files[file]?.funcs ? []
        for f in funcs
            if f[3] == name
                items.push name: f[2], text:'  ▸ '+f[2], type:'func', file: file, line: f[0]

        if items.length
            opt.parent ?= item
            @clearColumnsFrom opt.column, pop:true
            @loadItems items, opt
        else
            ext = path.extname file  
            if ext in ['.gif', '.png', '.jpg']
                @clearColumnsFrom opt.column, pop:true
                @loadImage row, file
            else if ext in ['.icns', '.tiff', '.tif']
                @clearColumnsFrom opt.column, pop:true
                @convertImage row
            else if ext in ['.pxm']
                @clearColumnsFrom opt.column, pop:true
                @convertPXM row
            else
                @clearColumnsFrom opt.column
            @endNavigateToTarget()
            
        if item.textFile and not @skipJump
            post.emit 'jumpTo', file:file
            
        delete @skipJump

    # 000  00     00   0000000    0000000   00000000  
    # 000  000   000  000   000  000        000       
    # 000  000000000  000000000  000  0000  0000000   
    # 000  000 0 000  000   000  000   000  000       
    # 000  000   000  000   000   0000000   00000000  
    
    convertPXM: (row) ->
        
        item = row.item
        file = item.abs
        tmpPXM = path.join os.tmpdir(), "ko-#{fileName file}.pxm"
        tmpPNG = swapExt tmpPXM, '.png'

        fs.copy file, tmpPXM, (err) =>
            return error "can't copy pxm image #{file} to #{tmpPXM}: #{err}" if err?
            childp.exec "open #{__dirname}/../../bin/pxm2png.app --args #{tmpPXM}", (err) =>
                return error "can't convert pxm image #{tmpPXM} to #{tmpPNG}: #{err}" if err?
                loadDelayed = => @loadImage row, tmpPNG
                setTimeout loadDelayed, 300

    convertImage: (row) ->
        
        item = row.item
        file = item.abs
        tmpImage = path.join os.tmpdir(), "ko-#{path.basename file}.png"
        
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImage}\"", (err) =>
            return error "can't convert image #{file}: #{err}" if err?
            @loadImage row, tmpImage

    loadImage: (row, file) ->
        
        return if not row.isActive()
        item = row.item

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: "file://#{encodePath file}"
        col.table.appendChild cnt
    
module.exports = FileBrowser

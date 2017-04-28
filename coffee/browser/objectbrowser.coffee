
#  0000000   0000000          000  00000000   0000000  000000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000        000  000       000          000           000   000  000   000  000   000  000 0 000  000       000       000   000  
# 000   000  0000000          000  0000000   000          000           0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000       000          000           000   000  000   000  000   000  000   000       000  000       000   000  
#  0000000   0000000     0000000   00000000   0000000     000           0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ fileName, empty, path, post, str, error, log, _
}          = require 'kxk'
jsbeauty   = require 'js-beautify'
Browser    = require './browser'
isTextFile = require '../tools/istextfile'

class ObjectBrowser extends Browser
    
    constructor: (@view) -> 
                
        super @view
        @name = 'ObjectBrowser'

    #  0000000   0000000          000  00000000   0000000  000000000  
    # 000   000  000   000        000  000       000          000     
    # 000   000  0000000          000  0000000   000          000     
    # 000   000  000   000  000   000  000       000          000     
    #  0000000   0000000     0000000   00000000   0000000     000     
    
    loadObject: (obj, opt) =>
        
        opt ?= {}
        opt.column ?= 0
        opt.focus  ?= opt.column == 0

        @initColumns()
        
        if @columns[0].parent?.type != 'obj'
            @clearColumnsFrom 2, pop:true
            parent = type: 'obj', obj:{}, name: 'root'
            @columns[0].setItems [], parent:parent 
    
        objName = (opt.text ? opt.name) ? obj.constructor?.name
        
        itemForKeyValue = (key, value) =>
            type: @valueType value 
            obj:  value
            name: key

        if opt.column == 0
            newItem = itemForKeyValue objName, obj
            
            if row = @columns[0].row objName
                @columns[0].items[row.index()] = newItem
            else
                @columns[0].items.push newItem
                
            opt.activate = objName
            
            items = @columns[0].items
            opt.parent = @columns[0].parent
        else
            if obj._browse_items_? and _.isArray obj._browse_items_
                items = obj._browse_items_
                dontSort = true
            else
                items = []
                for key,value of obj # own?
                    items.push itemForKeyValue key, value

        if @valueType(obj) not in ['func', 'array'] and not dontSort
            @sortByType items

        @loadItems items, opt
        true

    # 00000000  000  000      000000000  00000000  00000000   
    # 000       000  000         000     000       000   000  
    # 000000    000  000         000     0000000   0000000    
    # 000       000  000         000     000       000   000  
    # 000       000  0000000     000     00000000  000   000  
    
    filter: (names, indexerKey, filterFunc) ->
        
        objs = post.get 'indexer', indexerKey
        
        if not empty names
            names = names.map (c) -> c.toLowerCase()
            names = _.filter names, (c) -> not empty c
            objs = _.pickBy objs, (value, key) ->
                for cn in names
                    lc = key.toLowerCase()
                    continue if filterFunc? cn, lc
                    if cn.length>1 and lc.indexOf(cn)>=0 or lc.startsWith(cn)
                        return true
        objs

    #  0000000  000       0000000    0000000   0000000  00000000   0000000  
    # 000       000      000   000  000       000       000       000       
    # 000       000      000000000  0000000   0000000   0000000   0000000   
    # 000       000      000   000       000       000  000            000  
    #  0000000  0000000  000   000  0000000   0000000   00000000  0000000   
    
    loadClasses: (names) ->
            
        classes = {}
        
        for clss,clsso of @filter names, 'classes'
            
            key = '● '+clss
            items = [name: clss, text: '● '+clss, type:'class', file: clsso.file, line: clsso.line]
            for mthd,mthdo of clsso.methods
                items.push name: mthd, text: '  ▸ '+mthd, type:'method', file: mthdo.file, line: mthdo.line
                
            classes[key] =
                text: key
                _browse_items_:items          
                file: clsso.file, line: clsso.line
                type:'class'

        @loadObject classes, name:'classes', focus:false

    # 00000000  000   000  000   000   0000000   0000000  
    # 000       000   000  0000  000  000       000       
    # 000000    000   000  000 0 000  000       0000000   
    # 000       000   000  000  0000  000            000  
    # 000        0000000   000   000   0000000  0000000   
    
    loadFuncs: (names) ->
        
        funcs = {}
        
        for func,funcl of @filter names, 'funcs'
                            
            key = '▸ '+func
            items = []
            for funci in funcl
                clss = funci.class ? path.basename funci.file
                items.push name: clss, text: '● '+clss, type:'class', file: funci.file, line: funci.line
                
            funcs[key] =
                text: key
                type:'func'
                _browse_items_:items          
        
        @loadObject funcs, name:'funcs', focus:false
          
    # 00000000  000  000      00000000   0000000  
    # 000       000  000      000       000       
    # 000000    000  000      0000000   0000000   
    # 000       000  000      000            000  
    # 000       000  0000000  00000000  0000000   
    
    loadFiles: (names) ->
        
        files = []

        filterBase = (name, file) ->
            file = fileName file
            if not name.startsWith '.'
                return not (name.length>1 and file.indexOf(name)>=0 or file.startsWith(name))
            false
        
        for k,v of @filter names, 'files', filterBase
            key = path.basename k
            files.push  
                textFile: isTextFile key
                name: key
                type: 'file'
                file: k
                
        files = _browse_items_:files
            
        @loadObject files, name:'files', focus:false

    # 000   000   0000000   00000000   0000000     0000000  
    # 000 0 000  000   000  000   000  000   000  000       
    # 000000000  000   000  0000000    000   000  0000000   
    # 000   000  000   000  000   000  000   000       000  
    # 00     00   0000000   000   000  0000000    0000000   
    
    loadWords: (names) ->
        words = @filter names, 'words'
        @loadObject words, name:'words', focus:false
    
    #  0000000   00000000   00000000    0000000   000   000  
    # 000   000  000   000  000   000  000   000   000 000   
    # 000000000  0000000    0000000    000000000    00000    
    # 000   000  000   000  000   000  000   000     000     
    # 000   000  000   000  000   000  000   000     000     
    
    loadArray: (arry, opt) ->
        
        items   = []
        padSize = 1+Math.floor Math.log10 arry.length
        for own index,value of arry
            item = 
                type: @valueType value
                obj:  value
            index = "#{_.padEnd str(index), padSize} ▫ "
            switch item.type
                when 'regexp' then item.name = index+value.source
                when 'string' then item.name = index+value
                when 'number', 'float', 'value', 'bool', 'nil' then item.name = index+str value
                else
                    if value.text? or value.name?
                        item.name = value.text ? value.name
                    else
                        item.name = index+'▶'
            items.push item
        
        @loadItems items, opt

    # 000  000000000  00000000  00     00  
    # 000     000     000       000   000  
    # 000     000     0000000   000000000  
    # 000     000     000       000 0 000  
    # 000     000     00000000  000   000  
    
    loadObjectItem: (item, opt) ->
        
        opt.parent = item
        switch item.type
            when 'obj'   then @loadObject item.obj, opt
            when 'func'  then @loadArray  item.obj.toString().split('\n'), opt
            when 'elem'  then @loadArray  @htmlLines(item.obj), opt
            when 'array' then @loadArray  item.obj, opt
            else
                oi = 
                    type: item.type
                    name: str item.obj
                @loadItems [oi], opt
                
        if opt.activate and _.isString item.obj?.file
            
            post.emit 'jumpTo', file:item.obj.file, line:item.obj.line

    # 00000000   00000000   00000000  000   000  000  00000000  000   000  
    # 000   000  000   000  000       000   000  000  000       000 0 000  
    # 00000000   0000000    0000000    000 000   000  0000000   000000000  
    # 000        000   000  000          000     000  000       000   000  
    # 000        000   000  00000000      0      000  00000000  00     00  
    
    previewObjectItem: (item, opt) ->
        
        return error 'not an object item?' if not item.type == 'obj'
        return error 'no object in item?' if not item.obj?
        
        opt.parent = type:'preview'
            
        itemForKeyValue = (key, value) =>
            type = @valueType value
            switch type
                when 'func'  then value = '▶'
                when 'obj'   then value = '●'
                when 'array' then value = "■ ︎#{value.length}"
                when 'elem'  then value = '◆'
                else value = str value
            type: type
            name: value
            obj:  ''
            
        items = []
        # log 'opt', opt
        for row in @column(opt.column-1).rows
            items.push itemForKeyValue row.item.name, row.item.obj

        @loadObject {_browse_items_:items}, opt

    # 000   000   0000000   000      000   000  00000000  000000000  000   000  00000000   00000000  
    # 000   000  000   000  000      000   000  000          000      000 000   000   000  000       
    #  000 000   000000000  000      000   000  0000000      000       00000    00000000   0000000   
    #    000     000   000  000      000   000  000          000        000     000        000       
    #     0      000   000  0000000   0000000   00000000     000        000     000        00000000  
    
    valueType: (value) ->
        if _.isNil      value then return 'nil'
        if _.isBoolean  value then return 'bool'
        if _.isInteger  value then return 'int'
        if _.isNumber   value then return 'float'
        if _.isString   value then return 'string'
        if _.isRegExp   value then return 'regexp'
        if _.isArray    value then return 'array'
        if _.isElement  value then return 'elem'
        if _.isFunction value then return 'func'
        if _.isObject   value then return 'obj'
        error "unknown value type: #{value}"
        'value'

    htmlLines: (e) -> 
        s = jsbeauty.html_beautify e.outerHTML, indent_size:2 , preserve_newlines:false, wrap_line_length:1024*1024, unformatted: []
        s.split('\n')
    
    sortByType: (items) ->
        type = (i) -> {obj:'a', array:'b', elem:'c', regexp:'d', string:'e', int:'f', float:'g', bool:'h', nil:'i', func:'z'}[i.type]
        items.sort (a,b) -> (type(a) + a.name).localeCompare type(b) + b.name      

    clear: ->
        delete @columns[0].parent
        super
                
module.exports = ObjectBrowser

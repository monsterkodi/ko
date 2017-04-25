
#  0000000   0000000          000  00000000   0000000  000000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000        000  000       000          000           000   000  000   000  000   000  000 0 000  000       000       000   000  
# 000   000  0000000          000  0000000   000          000           0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000       000          000           000   000  000   000  000   000  000   000       000  000       000   000  
#  0000000   0000000     0000000   00000000   0000000     000           0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ str, error, log, _
}        = require 'kxk'
jsbeauty = require 'js-beautify'
Browser  = require './browser'

class ObjectBrowser extends Browser
    
    constructor: (@view) -> 
                
        super @view

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

    #  0000000   0000000          000  00000000   0000000  000000000  
    # 000   000  000   000        000  000       000          000     
    # 000   000  0000000          000  0000000   000          000     
    # 000   000  000   000  000   000  000       000          000     
    #  0000000   0000000     0000000   00000000   0000000     000     
    
    loadObject: (obj, opt) =>
        
        opt ?= {}
        opt.column ?= 0
        opt.focus  ?= opt.column == 0

        @initColumns() if _.isEmpty @columns
        
        if @columns[0].parent?.type != 'obj'
            @clearColumnsFrom 2, pop:true
            rootObj = {}
            @columns[0].setItems [], parent: type: 'obj', obj:rootObj, name: 'root'
        else 
            rootObj = @columns[0].parent.obj
    
        objName = opt.name ? obj.constructor?.name
        
        itemForKeyValue = (key, value) =>
            type: @valueType value 
            obj:  value
            name: key

        if opt.column == 0
            newItem = itemForKeyValue objName, obj
            if row = @columns[0].row objName
                @columns[0].items[row.index()] = newItem
                opt.activate = row.index()
            else
                @columns[0].items.push newItem
                opt.activate = @columns[0].items.length-1
            items = @columns[0].items
            opt.parent = @columns[0].parent
        else
            items = []
            for key,value of obj # own?
                items.push itemForKeyValue key, value

        @sortByType(items) if @valueType(obj) not in ['func', 'array']
        @loadItems items, opt
        true
  
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
                else  item.name = index+'▶'
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
                
module.exports = ObjectBrowser

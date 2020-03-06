###
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
###

{ $, elem, empty, keyinfo, klog, open, slash } = require 'kxk'

File = require '../tools/file'

class Viewer

    @: (@browser, @path) ->
        
        if slash.isDir @path
            
            slash.list @path, (items) =>
    
                images = items.filter (item) -> File.isImage item.file
    
                return if empty images
                
                @loadImages images.map (item) -> item.file
        else
            if File.isImage @path
                @loadImages [@path]
                            
    loadImages: (images) ->
            
        @div = elem class:'viewer' tabindex:1
        
        @focus = document.activeElement
        
        for file in images
            
            img = elem 'img' class:'viewerImage' src:slash.fileUrl file
            cnt = elem class:'viewerImageContainer' child:img
            cnt.addEventListener 'dblclick' ((file) -> -> open file)(file)
            @div.appendChild cnt
        
            main =$ '#main'
            
        main.appendChild @div

        @div.addEventListener 'keydown' @onKey
        @div.focus()
            
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>

        { mod, key, combo, char } = keyinfo.forEvent event

        switch combo
            when 'esc' 'space' then @close()
            when 'ctrl+q' then return
            else klog 'combo' combo
            
        event.stopPropagation?()
            
    close: =>

        @browser.viewer = null
        @div.remove()
        @focus.focus()

module.exports = Viewer

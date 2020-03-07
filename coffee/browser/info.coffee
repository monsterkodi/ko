###
000  000   000  00000000   0000000     
000  0000  000  000       000   000    
000  000 0 000  000000    000   000    
000  000  0000  000       000   000    
000  000   000  000        0000000     
###

{ $, elem, open, slash } = require 'kxk'

File     = require '../tools/file'
pbytes   = require 'pretty-bytes'
moment   = require 'moment'
    
# 000  00     00   0000000    0000000   00000000  
# 000  000   000  000   000  000        000       
# 000  000000000  000000000  000  0000  0000000   
# 000  000 0 000  000   000  000   000  000       
# 000  000   000  000   000   0000000   00000000  

imageInfo = (file) ->
    
    img = elem 'img' class:'browserImage' src:slash.fileUrl file
    cnt = elem class:'browserImageContainer' child:img
    cnt.addEventListener 'dblclick' -> open file
                
    img.onload = ->
        img =$ '.browserImage'
        br = img.getBoundingClientRect()
        x = img.clientX
        width  = parseInt br.right - br.left - 2
        height = parseInt br.bottom - br.top - 2

        img.style.opacity   = '1'
        img.style.maxWidth  = '100%'
        
        stat = slash.fileExists file
        size = pbytes(stat.size).split ' '
        
        age = moment().to(moment(stat.mtime), true)
        [num, range] = age.split ' '
        num = '1' if num[0] == 'a'
        
        html  = "<tr><th colspan=2>#{width}<span class='punct'>x</span>#{height}</th></tr>"
        html += "<tr><th>#{size[0]}</th><td>#{size[1]}</td></tr>"
        html += "<tr><th>#{num}</th><td>#{range}</td></tr>"
        
        info = elem class:'browserFileInfo' children: [
            elem 'div' class:"fileInfoFile #{slash.ext file}" html:File.span file
            elem 'table' class:"fileInfoData" html:html
        ]
        cnt =$ '.browserImageContainer'
        cnt.appendChild info
    
    cnt

# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000
    
fileInfo = (file) ->
    
    stat = slash.fileExists file
    size = pbytes(stat.size).split ' '
    
    t = moment stat.mtime

    age = moment().to(t, true)
    [num, range] = age.split ' '
    num = '1' if num[0] == 'a'
    if range == 'few'
        num = moment().diff t, 'seconds'
        range = 'seconds'
    
    info = elem class:'browserFileInfo' children: [
        elem 'div' class:"fileInfoIcon #{slash.ext file} #{File.iconClassName file}"
        elem 'div' class:"fileInfoFile #{slash.ext file}" html:File.span file
        elem 'table' class:"fileInfoData" html:"<tr><th>#{size[0]}</th><td>#{size[1]}</td></tr><tr><th>#{num}</th><td>#{range}</td></tr>"
    ]
            
    info
    
module.exports = 
    file:fileInfo
    image:imageInfo
    
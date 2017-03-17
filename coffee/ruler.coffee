# 00000000   000   000  000      00000000  00000000   
# 000   000  000   000  000      000       000   000  
# 0000000    000   000  000      0000000   0000000    
# 000   000  000   000  000      000       000   000  
# 000   000   0000000   0000000  00000000  000   000  
{
sw,sh,
$}        = require './tools/tools'
prefs     = require './tools/prefs'
keyinfo   = require './tools/keyinfo'
drag      = require './tools/drag'
elem      = require './tools/elem'
pos       = require './tools/pos'
str       = require './tools/str'
_         = require 'lodash'
electron  = require 'electron'
ipc       = electron.ipcRenderer
remote    = electron.remote
browser   = remote.BrowserWindow
log       = -> console.log (str(s) for s in [].slice.call arguments, 0).join " "
win       = null
ruler     = null

ipc.on 'setWinID', (event, id) => winMain id
   
# 000   000  000  000   000  00     00   0000000   000  000   000  
# 000 0 000  000  0000  000  000   000  000   000  000  0000  000  
# 000000000  000  000 0 000  000000000  000000000  000  000 0 000  
# 000   000  000  000  0000  000 0 000  000   000  000  000  0000  
# 00     00  000  000   000  000   000  000   000  000  000   000  

winMain = (id) ->
    win = browser.fromId id 
    # win?.webContents.openDevTools()
    ruler =$ 'ruler' 
    ruler?.focus()
    resize()

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

screenSize = -> electron.screen.getPrimaryDisplay().workAreaSize
window.onresize = -> resize()
resize = ->  
    ruler?.innerHTML = ""
    for x in [0..sw()/5]
        line = elem class:'line vertical'
        line.style.transform = "translateX(#{x*5-1}px)"
        for n in [20, 10, 2]
            if x % n == 0 
                line.classList.add "_#{n*5}" 
                if x > 0 and n > 2
                    line.appendChild elem class:'num', text: x*5
                break
        ruler.appendChild line
    b = win?.getBounds()
    $('size').textContent = b.width

# 00     00   0000000   000   000  00000000  
# 000   000  000   000  000   000  000       
# 000000000  000   000   000 000   0000000   
# 000 0 000  000   000     000     000       
# 000   000   0000000       0      00000000  

move = (key, mod) ->
    
    x = switch key
        when 'left'  then -1
        when 'right' then  1
        else 0
        
    y = switch key
        when 'up'    then -1
        when 'down'  then  1
        else 0
        
    switch mod
        when 'ctrl+shift',    'ctrl'    then x *= 10;  y *= 10
        when 'alt+shift',     'alt'     then x *= 50;  y *= 50
        when 'command+shift', 'command' then x *= 100; y *= 100
        
    switch mod
        when 'shift', 'ctrl+shift', 'alt+shift', 'command+shift' then size = true
        
    b = win?.getBounds()
    if size
        b.width  += x
        b.height += y
    else
        b.x += x
        b.y += y
        
    $('size').textContent = b.width
    win?.setBounds b

# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event

    return if not combo

    switch key
        when 'left', 'right', 'up', 'down' then move key, mod
    
    switch combo
        when 'right'            then return move  1,  0
        when 'up'               then return move  0, -1
        when 'down'             then return move  0,  1
        when 'esc'              then return win?.close()
        when 'command+alt+i'    then return win?.webContents.openDevTools()
        

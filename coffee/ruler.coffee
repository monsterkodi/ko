# 00000000   000   000  000      00000000  00000000   
# 000   000  000   000  000      000       000   000  
# 0000000    000   000  000      0000000   0000000    
# 000   000  000   000  000      000       000   000  
# 000   000   0000000   0000000  00000000  000   000  
{
sw,sh,
clamp,
$}          = require './tools/tools'
prefs       = require './tools/prefs'
keyinfo     = require './tools/keyinfo'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
_           = require 'lodash'
electron    = require 'electron'

ipc     = electron.ipcRenderer
remote  = electron.remote
browser = remote.BrowserWindow

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

screenSize = => electron.screen.getPrimaryDisplay().workAreaSize

window.onresize = -> log 'onresize'
window.onload = => -> log 'onload'

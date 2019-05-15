###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ empty, valid, childp, slash, atomic, fs, _ } = require 'kxk'

class File

    @iconClassName: (file) ->
        
        file = slash.removeLinePos file
        switch slash.ext file
            when 'noon'   then className = 'noon-icon'
            when 'koffee' then className = 'coffee-icon'
            else
                try
                    fileIcons = require 'file-icons-js'
                    className = fileIcons.getClass file
                catch err
                    log "no icon? #{file}"
        className ?= 'file-icon'
        className
    
    @atomic: (file, text, mode, cb) ->

        atomic file, text, { encoding: 'utf8', mode: mode }, (err) ->
            if valid err then cb err
            else cb null, file
        
    @write: (file, text, mode, cb) ->
            
        fs.writeFile file, text, { encoding: 'utf8', mode: mode }, (err) ->
            if valid err then cb err
            else cb null, file
    
    @unlock: (file, text, cb) ->
        
        fs.chmod file, 0o666, (err) ->
            
            if valid err
                cb err
            else
                File.write file, text, 0o666, cb
            
    @p4edit: (file, text, cb) ->
        
        if slash.win()
            try
                childp.exec "p4 edit #{slash.unslash(file)}", (err) ->
                    if valid err
                        File.unlock file, text, cb
                    else
                        File.write file, text, 0o666, cb
            catch err
                File.unlock file, text, cb
        else
            File.unlock file, text, cb
            
    @save: (file, text, cb) ->
    
        slash.fileExists file, (stat) ->
            
            if stat
                
                slash.isWritable file, (writable) ->
                    
                    if writable
                        
                        File.write file, text, stat.mode, cb
                        
                    else
                        
                        File.p4edit file, text, cb
            else
                File.write file, text, 438, cb
        
module.exports = File

###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ childp, slash, empty, valid, fs } = require 'kxk'

icons = require './icons.json'

class File
    
    @sourceFileExtensions: [ 'koffee' 'coffee' 'styl' 'swift' 'pug' 'md' 'noon' 'txt' 'json' 'sh' 'py' 'cpp' 'cc' 'c' 'cs' 'h' 'hpp' 'ts' 'js']

    @iconClassName: (file) ->
        
        file = slash.removeLinePos file
        
        clss  = icons.ext[slash.ext file]
        clss ?= icons.base[slash.base(file).toLowerCase()]
        clss ?= 'file'
        "icon #{clss}"
        
    @write: (file, text, mode, cb) ->
  
        slash.logErrors = true
        
        slash.writeText file, text, (done) ->
            if empty done
                cb "can't write #{file}"
            else
                cb null, done
        # fs.writeFile file, text, { encoding: 'utf8', mode: mode }, (err) ->
            # if valid err then cb err
            # else cb null, file
    
    @unlock: (file, text, cb) ->
        
        fs.chmod file, 0o666, (err) ->
            
            if valid err
                cb err
            else
                File.write file, text, 0o666, cb
            
    @p4edit: (file, text, cb) ->
        
        slash.logErrors = true
        
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
    
        slash.logErrors = true
        
        slash.fileExists file, (stat) ->
            
            if stat
                
                slash.isWritable file, (writable) ->
                    
                    if writable
                        
                        File.write file, text, stat.mode, cb
                        
                    else
                        
                        File.p4edit file, text, cb
            else
                File.write file, text, 0o666, cb
        
module.exports = File

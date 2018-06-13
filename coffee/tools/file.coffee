###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ empty, valid, childp, slash, atomic, fs, log, _ } = require 'kxk'

class File

    @atomic: (file, text, mode, cb) ->
        
        atomic file, text, { encoding: 'utf8', mode: mode }, (err) ->
            if valid err then cb err
            else cb null, file
    
    @unlock: (file, text, cb) ->
        
        fs.chmod file, 0o666, (err) ->
            
            if valid err
                cb err
            else
                File.atomic file, text, 0o666, cb
            
    @p4edit: (file, text, cb) ->
        
        if slash.win()
            try
                childp.exec "p4 edit #{slash.unslash(file)}", (err) ->
                    if valid err
                        File.unlock file, text, cb
                    else
                        File.atomic file, text, 0o666, cb
            catch err
                File.unlock file, text, cb
        else
            File.unlock file, text, cb
            
    @save: (file, text, cb) ->
    
        # log 'File.save', file, text.length

        slash.fileExists file, (stat) ->
            
            if stat
                slash.isWritable file, (writable) ->
                    
                    if writable
                        
                        File.atomic file, text, stat.mode, cb
                        
                    else
                        
                        File.p4edit file, text, cb
            else
                File.atomic file, text, 438, cb
        
module.exports = File

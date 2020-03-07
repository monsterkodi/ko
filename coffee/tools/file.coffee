###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ childp, empty, fs, kerror, klog, slash, valid } = require 'kxk'

icons = require './icons.json'

class File
    
    @sourceFileExtensions: [ 'koffee' 'coffee' 'styl' 'swift' 'pug' 'md' 'noon' 'txt' 'json' 'sh' 'py' 'cpp' 'cc' 'c' 'cs' 'h' 'hpp' 'ts' 'js' 'frag' 'vert']

    @isCode:  (file) -> slash.ext(file) in ['coffee' 'py' 'cpp' 'cc' 'c' 'cs' 'ts' 'js' 'h' 'hpp' 'frag' 'vert']
    @isImage: (file) -> slash.ext(file) in ['gif' 'png' 'jpg' 'jpeg' 'svg' 'bmp' 'ico']
    @isText:  (file) -> slash.isText file
   
    @rename: (from, to, cb) ->
        
        fs.mkdir slash.dir(to), recursive:true, (err) ->
            
            return kerror "mkdir failed #{err}" if err
            
            if slash.isDir(to)
                to = slash.join to, slash.file from

            fs.move from, to, overwrite:true, (err) ->
                return kerror "rename failed #{err}" if err
                
                if editor.currentFile == from
                    editor.currentFile = to
                    if tabs.activeTab()?.file == from
                        tabs.activeTab().setFile to
                    if commandline.command.name == 'browse'
                        if commandline.text() == slash.tilde from
                            commandline.setText slash.tilde to
                    if not tabs.tab to
                        klog 'recreate tab!' tabs.activeTab().file, to
                
                cb from, to

    @duplicate: (from, cb) -> 

        slash.unused from, (target) =>          
            @copy from, target, cb
    
    @copy: (from, to, cb) ->
        
        if slash.isDir(to)
            to = slash.join to, slash.file from

        # klog "copy #{from} #{to}"
        fs.copy from, to, (err) ->
            return kerror "copy failed #{err}" if err
            cb from, to
    
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
        
    @span: (text) ->
        
        base = slash.base text
        ext  = slash.ext(text).toLowerCase()
        clss = valid(ext) and ' '+ext or ''
        
        if base.startsWith '.' then clss += ' dotfile'
        
        span = "<span class='text#{clss}'>"+base+"</span>"
        
        if valid ext
            span += "<span class='ext punct#{clss}'>.</span>" + "<span class='ext text#{clss}'>"+ext+"</span>"
        span
                
    @crumbSpan: (file) ->
        
        return "<span>/</span>" if file in ['/' '']
        
        spans = []
        split = slash.split file
        
        for i in [0...split.length-1]
            s = split[i]
            spans.push "<div class='inline path' id='#{split[0..i].join '/'}'>#{s}</div>"
        spans.push "<div class='inline' id='#{file}'>#{split[-1]}</div>"
        spans.join "<span class='punct'>/</span>"
                
module.exports = File

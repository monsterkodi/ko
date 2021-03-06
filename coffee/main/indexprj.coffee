###
000  000   000  0000000    00000000  000   000  00000000   00000000         000    
000  0000  000  000   000  000        000 000   000   000  000   000        000    
000  000 0 000  000   000  0000000     00000    00000000   0000000          000    
000  000  0000  000   000  000        000 000   000        000   000  000   000    
000  000   000  0000000    00000000  000   000  000        000   000   0000000     
###

{ walkdir, slash, empty, noon, fs } = require 'kxk'

ignore = require 'ignore'
File = require '../tools/file'

shouldIndex = (path, stat) ->
    
    if slash.ext(path) in File.sourceFileExtensions
        if stat.size > 654321
            return false
        else
            return true
    false

indexKoFiles = (kofiles, info) ->
    
    for kofile in kofiles
        
        kodata = noon.load kofile
        return if empty kodata.index
        
        for dir,cfg of kodata.index
            
            opt = 
                max_depth: cfg.depth ? 4
                no_return: true
                
            ign = ignore()
            ign.add cfg.ignore if not empty cfg.ignore
                        
            absDir = slash.join slash.dir(kofile), dir
            
            walkdir.sync absDir, opt, (path, stat) ->
                  
                if ign.ignores slash.relative path, dir
                    @ignore path
                else if stat.isFile() 
                    if shouldIndex path, stat
                        info.files.push slash.path path

indexProject = (file) ->

    depth = 20
    
    dir = slash.pkg file
    
    if not dir
        depth = 3
        if slash.isFile file
            dir = slash.dir file
        else if slash.isDir file
            dir = file
            
    return if not dir
    
    kofiles = []
    info = dir:dir, files:[]

    ign = ignore()
    
    opt = 
        max_depth: depth
        no_return: true
                
    walkdir.sync dir, opt, (path, stat) ->
        
        addIgnores = (gitignore) -> 
            gitign = fs.readFileSync gitignore, 'utf8'
            gitign = gitign.split /\r?\n/
            gitign = gitign.filter (i) -> not empty(i) and not i.startsWith "#"
            gitdir = slash.dir gitignore
            if not slash.samePath gitdir, dir
                gitign = gitign.map (i) -> 
                    if i[0]=='!'
                        '!' + slash.relative(gitdir, dir) + i.slice 1
                    else
                        slash.relative(gitdir, dir) + i
            ign.add gitign
        
        if ign.ignores slash.relative path, dir
            @ignore path
            return
        
        if stat.isDirectory()
            gitignore = slash.join path, '.gitignore'
            if slash.isFile gitignore
                addIgnores gitignore
        else
            file = slash.file path
            if file == '.gitignore'
                addIgnores path
                return
                
            if file == '.ko.noon' # ???
                kofiles.push path
                
            if shouldIndex path, stat
                info.files.push slash.path path
                
    indexKoFiles kofiles, info
      
    info

if module.parent
    
    module.exports = indexProject
    
else
    info = indexProject slash.resolve process.argv[2]
    log "#{info.files.length} files"
    
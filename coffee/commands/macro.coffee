
# 00     00   0000000    0000000  00000000    0000000
# 000   000  000   000  000       000   000  000   000
# 000000000  000000000  000       0000000    000   000
# 000 0 000  000   000  000       000   000  000   000
# 000   000  000   000   0000000  000   000   0000000

{ packagePath, fileExists, fileName, fileList, reversed, relative, splitExt,
  post, noon, path, error, log, _
}       = require 'kxk'
indexer = require '../main/indexer'
salt    = require '../tools/salt'
Command = require '../commandline/command'
colors  = require 'colors'
process = require 'process'
atomic  = require 'write-file-atomic'
Mocha   = require 'mocha'
Report  = require '../test/report'

class Macro extends Command

    constructor: (@commandline) ->

        @shortcuts = ['command+m']
        @macros    = ['clean', 'help', 'dbg', 'class', 'req', 'inv', 'blink', 'color', 'fps', 'test']
        @macros    = @macros.concat window.editor.Transform.transformNames
        @names     = ['macro']
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    start: (@combo) ->
        
        super @combo
        text = @last()
        text = 'dbg' if not text?.length
        text:   text
        select: true

    # 000      000   0000000  000000000
    # 000      000  000          000
    # 000      000  0000000      000
    # 000      000       000     000
    # 0000000  000  0000000      000

    listItems: () -> 
    
        items = _.uniq _.concat reversed(@history), @macros

        ({text: i, line: i in @macros and '◼' or '◆', type: 'macro'} for i in items)

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000
    # 0000000     00000    0000000   000       000   000     000     0000000
    # 000        000 000   000       000       000   000     000     000
    # 00000000  000   000  00000000   0000000   0000000      000     00000000

    execute: (command) ->

        command = super command

        editor  = window.editor
        cp      = editor.cursorPos()
        args    = command.split /\s+/
        cmmd    = args.shift()

        wordsInArgsOrCursorsOrSelection = (args, opt) ->
            if args.length
                return args
            else
                cw = editor.wordsAtCursors positionsNotInRanges(editor.cursors(), editor.selections()), opt
                sw = editor.textsInRanges editor.selections()
                ws = _.uniq cw.concat sw
                ws.filter (w) -> w.trim().length

        switch cmmd

            # 000  000   000  000   000
            # 000  0000  000  000   000
            # 000  000 0 000   000 000
            # 000  000  0000     000
            # 000  000   000      0

            when 'inv'
                window.textEditor.toggleInvisibles()

            # 0000000    000      000  000   000  000   000  
            # 000   000  000      000  0000  000  000  000   
            # 0000000    000      000  000 0 000  0000000    
            # 000   000  000      000  000  0000  000  000   
            # 0000000    0000000  000  000   000  000   000  
            
            when 'blink' 
                editor.toggleBlink()
                @commandline.startBlink()
                
            #  0000000   0000000   000       0000000   00000000   
            # 000       000   000  000      000   000  000   000  
            # 000       000   000  000      000   000  0000000    
            # 000       000   000  000      000   000  000   000  
            #  0000000   0000000   0000000   0000000   000   000  
            
            when 'color' then editor.togglePigments()
            
            # 00000000  00000000    0000000  
            # 000       000   000  000       
            # 000000    00000000   0000000   
            # 000       000             000  
            # 000       000        0000000   
            
            when 'fps'   then window.fps?.toggle()

            # 000000000  00000000   0000000  000000000
            #    000     000       000          000
            #    000     0000000   0000000      000
            #    000     000            000     000
            #    000     00000000  0000000      000

            when 'test'
                
                mocha = new Mocha reporter: Report.forRunner, timeout: 4000
                
                if _.isEmpty args
                    files = fileList path.join(__dirname, '..', 'test'), matchExt:['.js', '.coffee']
                else
                    files = (path.join(__dirname, '..', 'test', f + '.js') for f in args)
                for file in files
                    delete require.cache[file] # mocha listens only on initial compile
                    mocha.addFile file
                
                terminal = window.terminal
                terminal.doAutoClear()
                autoClear = terminal.getAutoClear()
                terminal.setAutoClear false
                
                onTestsDone = ->
                    terminal.setAutoClear autoClear
                    post.removeListener 'testsDone', onTestsDone
                post.on 'testsDone', onTestsDone
                
                mocha.run()                
                window.split.do 'show terminal'

            # 000   000  00000000  000      00000000
            # 000   000  000       000      000   000
            # 000000000  0000000   000      00000000
            # 000   000  000       000      000
            # 000   000  00000000  0000000  000

            when 'help'
                
                terminal = window.terminal
                terminal.output noon.stringify noon.load("#{__dirname}/../../bin/cheet.noon"),
                    align:    true
                    maxalign: 20
                    colors:
                        url:     colors.yellow
                        key:     colors.white
                        null:    colors.blue
                        true:    colors.blue.bold
                        false:   colors.gray.dim
                        path:    colors.green
                        value:   colors.green
                        string:  colors.white.dim
                        semver:  colors.red
                        number:  colors.magenta
                        visited: colors.red
                        dim:     '^>=.:/-'

                terminal.scroll.cursorToTop 1
                window.split.do 'show terminal'

            # 00000000   00000000   0000000
            # 000   000  000       000   000
            # 0000000    0000000   000 00 00
            # 000   000  000       000 0000
            # 000   000  00000000   00000 00

            when 'req'
                
                words = wordsInArgsOrCursorsOrSelection args
                lastIndex = 0
                texts = []
                # search project for path build open search term
                pkgPath = packagePath editor.currentFile
                if pkgPath
                    projectFiles = fileList pkgPath, depth: 4, matchExt: editor.currentFile
                else
                    projectFiles = []

                if _.isEmpty words then return error 'no words for req?'
                for word in words
                    map =
                        _:      'lodash'
                        childp: 'child_process'
                        pkg:    '../package.json'
                    pth = map[word] ? word.toLowerCase()

                    for f in projectFiles
                        if pth == fileName f
                            pth = splitExt relative f, path.dirname editor.currentFile
                            pth = './' + pth if not pth.startsWith '../'
                            break

                    for li in [Math.min(editor.numLines()-1, 100)..0]
                        m = editor.line(li).match indexer.requireRegExp
                        if m?[1]? and m?[2]?
                            break if m[1] == word and m[2] == pth
                            if editor.line(li).trim().length and editor.line(li).search(/^\s*\#/) != 0
                                lastIndex = Math.max lastIndex, li+1
                    if li <= 0
                        texts.push "#{word} = require '#{pth}'"

                if texts.length
                    editor.do.start()
                    for text in texts.reverse()
                        editor.do.insert lastIndex, text
                    editor.moveCursorsDown false, texts.length
                    editor.do.end()
                    return do: "focus editor"

            # 0000000    0000000     0000000
            # 000   000  000   000  000
            # 000   000  0000000    000  0000
            # 000   000  000   000  000   000
            # 0000000    0000000     0000000

            when 'dbg'

                li = cp[1]
                indent = editor.indentStringForLineAtIndex li
                li += 1 if not editor.isCursorInIndent() and not editor.isCursorInLastLine()
                insert = indent + 'log "'
                insert += editor.funcInfoAtLineIndex li
                lst = args.length and parseInt args[0] or 0
                args.shift() if lst
                words = wordsInArgsOrCursorsOrSelection args, include: "#@.-"
                for ti in [0...words.length - lst]
                    t = words[ti]
                    insert += "#{t}:\#{#{t}} "
                insert = insert.trimRight()
                insert += '"'
                if lst
                    insert += (", #{words[ti]}" for ti in [words.length - lst...words.length]).join ''
                        
                editor.do.start()
                editor.do.insert li, insert
                editor.singleCursorAtPos [editor.line(li).length, li]
                editor.do.end()
                
                focus: editor.name

            #  0000000  000       0000000    0000000   0000000
            # 000       000      000   000  000       000
            # 000       000      000000000  0000000   0000000
            # 000       000      000   000       000       000
            #  0000000  0000000  000   000  0000000   0000000

            when 'class'

                clss = args.length and args[0] or _.last editor.textsInRanges(editor.selections())
                clss ?= 'Class'
                dir = editor.currentFile? and path.dirname(editor.currentFile) or process.cwd()
                file = path.join dir, clss.toLowerCase() + '.coffee'
                if fileExists file
                    return text: "file #{file} exists!"
                text = '\n'
                text += ("# "+s for s in salt(clss).split '\n').join '\n'
                text += '\n'
                text += """

                class #{clss}

                    constructor: () ->


                module.exports = #{clss}

                """
                atomic file, text, encoding: 'utf8', (err) ->
                    if err?
                        log 'writing class skeleton failed', err
                        return
                    post.toMain 'newWindowWithFile', file
                return focus: editor.name

            #  0000000  000      00000000   0000000   000   000
            # 000       000      000       000   000  0000  000
            # 000       000      0000000   000000000  000 0 000
            # 000       000      000       000   000  000  0000
            #  0000000  0000000  00000000  000   000  000   000

            when 'clean'

                editor.do.start()
                for li in [0...editor.numLines()]
                    line = editor.line li
                    cleaned = line.trimRight()
                    if line != cleaned
                        editor.do.change li, cleaned
                editor.do.end()
                
            # 000   000  00000000   0000000   0000000    00000000  00000000   
            # 000   000  000       000   000  000   000  000       000   000  
            # 000000000  0000000   000000000  000   000  0000000   0000000    
            # 000   000  000       000   000  000   000  000       000   000  
            # 000   000  00000000  000   000  0000000    00000000  000   000  
            
            when 'header'
                
                editor.toggleHeader()
                
            else
                
                # 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00    
                #    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000    
                #    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000    
                #    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000    
                #    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000    
                
                if cmmd in editor.Transform.transformNames
                    window.textEditor.Transform.do.apply null, [window.textEditor, cmmd].concat args
                else
                    if _.last(@history) == command.trim()
                        @history.pop()

        select: true

module.exports = Macro

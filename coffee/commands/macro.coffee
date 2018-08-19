###
00     00   0000000    0000000  00000000    0000000
000   000  000   000  000       000   000  000   000
000000000  000000000  000       0000000    000   000
000 0 000  000   000  000       000   000  000   000
000   000  000   000   0000000  000   000   0000000
###

{ post, reversed, filelist, empty, slash, valid, args, fs, error, log, _ } = require 'kxk'
  
indexer   = require '../main/indexer'
salt      = require '../tools/salt'
req       = require '../tools/req'
GitInfo   = require '../win/gitinfo'
Command   = require '../commandline/command'
Report    = require '../test/report'
syntax    = require '../editor/syntax'
Transform = require '../editor/actions/transform'
Mocha     = require 'mocha'

class Macro extends Command

    @macroNames = ['clean', 'help', 'dbg', 'class', 'req', 'inv', 'blink', 'color', 'fps', 'cwd', 'git', 'test', 'unix']
    
    constructor: (commandline) ->

        super commandline

        @macros    = Macro.macroNames
        @macros    = @macros.concat Transform.transformNames
        @names     = ['macro']
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    start: (name) ->
        
        super name
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

        return error 'no command!' if empty command
        
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
                ws = _.uniq cw.concat editor.textsInRanges editor.selections()
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
            
            # 00000000  00000000    0000000         0000000  000   000  0000000           0000000   000  000000000  
            # 000       000   000  000             000       000 0 000  000   000        000        000     000     
            # 000000    00000000   0000000         000       000000000  000   000        000  0000  000     000     
            # 000       000             000        000       000   000  000   000        000   000  000     000     
            # 000       000        0000000          0000000  00     00  0000000           0000000   000     000     
            
            when 'fps'   then window.fps?.toggle()
            when 'cwd'   then window.cwd?.toggle()
            when 'git'   then GitInfo.start()
            when 'err'   
                post.toMain 'throwError'
                throw new Error 'err'

            # 000000000  00000000   0000000  000000000
            #    000     000       000          000
            #    000     0000000   0000000      000
            #    000     000            000     000
            #    000     00000000  0000000      000

            when 'test'
                
                # mocha = new Mocha reporter: Report.forRunner, timeout: 4000
                mocha = new Mocha()
                
                if _.isEmpty args
                    files = filelist slash.join(__dirname, '..', 'test'), matchExt:['js', 'coffee']
                else
                    files = (slash.join(__dirname, '..', 'test', f + '.js') for f in args)
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
                text = fs.readFileSync "#{__dirname}/../../bin/cheet.noon", encoding: 'utf8'
                for l in text.split '\n'
                    terminal.appendLineDiss l, syntax.dissForTextAndSyntax l, 'noon'

                terminal.scroll.cursorToTop 1
                window.split.do 'show terminal'

            # 00000000   00000000   0000000
            # 000   000  000       000   000
            # 0000000    0000000   000 00 00
            # 000   000  000       000 0000
            # 000   000  00000000   00000 00

            when 'req'
                
                return if slash.ext(editor.currentFile) != 'coffee'
                words = wordsInArgsOrCursorsOrSelection args
                
                lines = req editor.currentFile, editor.lines(), words, editor
                
                if valid lines
                    editor.do.start()
                    for line in lines
                        if line.op == 'insert'
                            editor.do.insert line.index, line.text
                        else
                            editor.do.change line.index, line.text
                    editor.moveCursorsDown false, lines.length
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
                lst = args.length and parseInt(args[0]) or 0
                args.shift() if lst
                words = wordsInArgsOrCursorsOrSelection args, include: "#@.-"
                for ti in [0...words.length - lst]
                    t = words[ti]
                    insert += "#{t}:\#{str #{t}} "
                insert = insert.trimRight()
                insert += '"'
                if lst
                    insert += (", str(#{words[ti]})" for ti in [words.length - lst...words.length]).join ''
                        
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
                dir = editor.currentFile? and slash.dir(editor.currentFile) or process.cwd()
                file = slash.join dir, clss.toLowerCase() + '.coffee'
                if slash.fileExists file
                    return text: "file #{file} exists!"
                text = "###\n"
                text += (s for s in salt(clss).split '\n').join '\n'
                text += "\n###\n"
                text += """

                { log, _ } = require 'kxk'
                
                class #{clss}

                    constructor: () ->


                module.exports = #{clss}

                """
                fs.writeFile file, text, encoding:'utf8', (err) ->
                    if err?
                        log 'writing class skeleton failed', err
                        return
                    post.emit 'newTabWithFile', file
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
                
            when 'unix'
                
                editor.newlineCharacters = '\n'
                post.emit 'saveFile'
                
            # 000   000  00000000   0000000   0000000    00000000  00000000   
            # 000   000  000       000   000  000   000  000       000   000  
            # 000000000  0000000   000000000  000   000  0000000   0000000    
            # 000   000  000       000   000  000   000  000       000   000  
            # 000   000  00000000  000   000  0000000    00000000  000   000  
            
            when 'header'
                
                editor.toggleHeader()
                
            when 'col'
                    
                num  = args.length > 0 and parseInt(args[0]) or 10
                step = args.length > 1 and parseInt(args[1]) or 1
                editor.cursorColumns num, step

            when 'line'
                    
                num  = args.length > 0 and parseInt(args[0]) or 10
                step = args.length > 1 and parseInt(args[1]) or 1
                editor.cursorLines num, step
                
            else
                
                # 000000000  00000000    0000000   000   000   0000000  00000000   0000000   00000000   00     00    
                #    000     000   000  000   000  0000  000  000       000       000   000  000   000  000   000    
                #    000     0000000    000000000  000 0 000  0000000   000000    000   000  0000000    000000000    
                #    000     000   000  000   000  000  0000       000  000       000   000  000   000  000 0 000    
                #    000     000   000  000   000  000   000  0000000   000        0000000   000   000  000   000    
                
                if Transform.transformNames and cmmd in Transform.transformNames
                    window.textEditor.Transform.do.apply null, [window.textEditor, cmmd].concat args
                else
                    log 'unhandled macro', cmmd, Transform.transformNames
                    if _.last(@history) == command.trim()
                        @history.pop()

        select: true

module.exports = Macro

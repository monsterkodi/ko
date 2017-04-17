# 00000000   00000000  00000000    0000000   00000000   000000000  
# 000   000  000       000   000  000   000  000   000     000     
# 0000000    0000000   00000000   000   000  0000000       000     
# 000   000  000       000        000   000  000   000     000     
# 000   000  00000000  000         0000000   000   000     000     

{str, _} = require 'kxk'
syntax = require '../editor/syntax'

log = ->
    line = (s for s in [].slice.call arguments, 0).join " "
    window.terminal.appendLineDiss line, syntax.dissForTextAndSyntax line, 'test'

class Report 

    constructor: (runner) ->
        
        @indents = 0

        runner.on 'start', => 

        runner.on 'suite',  (suite) =>
            return if not suite.title.length
            @indents++
            log @indent(), (@indents<=1 and '■' or '●'), suite.title

        runner.on 'suite end', =>
            @indents--
            log ''

        runner.on 'pending', (test) =>
            log @indent(), 'pending', test.title

        runner.on 'pass', (test) =>
            log @indent(), '  ✔', test.title, test.speed == 'slow' and test.duration or ''

        runner.on 'fail', (test, err) =>
            log @indent(), '  ✘', test.title
            console.log err.stack
            for stack in (err.stack ? err.message).split '\n    at '
                log @indent(), '    ▲', stack

        runner.on 'end', => # log ''
     
    done: (failures) -> 
        if failures
            log "▲ #{failures} failure#{failures > 1 and 's' or ''}"
        else
            log '■ ok'

    indent: -> Array(@indents).join '  '
    
    @forRunner: (runner) -> new Report runner

module.exports = Report
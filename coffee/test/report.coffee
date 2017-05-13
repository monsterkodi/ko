
# 00000000   00000000  00000000    0000000   00000000   000000000  
# 000   000  000       000   000  000   000  000   000     000     
# 0000000    0000000   00000000   000   000  0000000       000     
# 000   000  000       000        000   000  000   000     000     
# 000   000  00000000  000         0000000   000   000     000     

{str, noon, _} = require 'kxk'
syntax = require '../editor/syntax'

log = ->
    line = (s for s in [].slice.call arguments, 0).join " "
    window.terminal.appendLineDiss line, syntax.dissForTextAndSyntax line, 'test'

class Report 

    constructor: (runner) ->
        
        @indents = 0

        runner.on 'start', -> 

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

            for stack in (err.stack ? err.message).split '\n    at '
                log @indent(), '    ▲', stack
            if err.actual? and err.expected?
                log @indent(), ''
                log @indent(), '    ▶ expected:'
                e = str err.expected
                for l in e.split('\n') #.slice 1
                    log @indent(), '     ', l
                log @indent(), ''
                log @indent(), '    ▷ actual:'
                e = str err.actual
                for l in e.split('\n') #.slice 1
                    log @indent(), '     ', l

        runner.on 'end', -> # log ''
     
    done: (failures) -> 
        if failures
            log "▲ #{failures} failure#{failures > 1 and 's' or ''}"
        else
            log '■ ok'

    indent: -> Array(Math.max 0, @indents).join '  '
    
    @forRunner: (runner) -> new Report runner

module.exports = Report

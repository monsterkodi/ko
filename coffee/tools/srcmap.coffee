#  0000000   0000000   00000000  00000000  00000000  00000000       000               000   0000000    
# 000       000   000  000       000       000       000              000             000  000         
# 000       000   000  000000    000000    0000000   0000000            000           000  0000000     
# 000       000   000  000       000       000       000              000       000   000       000    
#  0000000   0000000   000       000       00000000  00000000       000          0000000   0000000     

{ fs, path, log
}         = require 'kxk'
sourceMap = require 'source-map'

toCoffee  = (jsFile, jsLine) ->

    coffeeFile = jsFile.replace /\/js\//, '/coffee/'
    coffeeFile = coffeeFile.replace /\.js$/, '.coffee'
    
    if not jsLine? then return coffeeFile

    mapFile = jsFile + '.map'
    mapData = fs.readFileSync mapFile, 'utf8'
    consumer = new sourceMap.SourceMapConsumer mapData 
    pos = consumer.originalPositionFor line:jsLine, column:0, bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
    coffeeLine = pos.line
    log "toCoffee #{jsFile}:#{jsLine} -> #{coffeeFile}:#{coffeeLine}"
    [coffeeFile, coffeeLine]

toJs = (coffeeFile, coffeeLine) ->
    
    jsFile = coffeeFile.replace /\/coffee\//, '/js/'
    jsFile = jsFile.replace /\.coffee$/, '.js'
    
    if not coffeeLine? then return jsFile
    
    mapFile = jsFile + '.map'
    mapData = fs.readFileSync mapFile, 'utf8'
    consumer = new sourceMap.SourceMapConsumer mapData 
    srcFile = 'coffee/' + coffeeFile.split('/coffee/')[1]
    poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:0
    return [null,null] if not poss.length
    jsLine = poss[0].line
    # log "toJs #{coffeeFile}:#{coffeeLine} -> #{jsFile}:#{jsLine}"
    [jsFile, jsLine]
        
module.exports =
    
    toJs:     toJs
    toCoffee: toCoffee
    
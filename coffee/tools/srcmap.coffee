
#  0000000   0000000   00000000  00000000  00000000  00000000       000               000   0000000    
# 000       000   000  000       000       000       000              000             000  000         
# 000       000   000  000000    000000    0000000   0000000            000           000  0000000     
# 000       000   000  000       000       000       000              000       000   000       000    
#  0000000   0000000   000       000       00000000  00000000       000          0000000   0000000     

{ fs, fileExists, path, log
}         = require 'kxk'
sourceMap = require 'source-map'

toCoffee  = (jsFile, jsLine, jsCol=0) ->

    coffeeFile = jsFile.replace /\/js\//, '/coffee/'
    coffeeFile = coffeeFile.replace /\.js$/, '.coffee'
    
    if not fileExists coffeeFile 
        if not jsLine? then return null
        return [null, null, null]
        
    if not jsLine? then return coffeeFile
        
    mapFile = jsFile + '.map'
    
    if fileExists mapFile
        mapData = fs.readFileSync mapFile, 'utf8'
        consumer = new sourceMap.SourceMapConsumer mapData 
        pos = consumer.originalPositionFor line:jsLine, column:jsCol, bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
        coffeeLine = pos.line
        coffeeCol  = pos.column
    else
        coffeeLine = null
        coffeeCol  = null
        
    [coffeeFile, coffeeLine, coffeeCol]

toJs = (coffeeFile, coffeeLine, coffeeCol=0) ->
    
    jsFile = coffeeFile.replace /\/coffee\//, '/js/'
    jsFile = jsFile.replace /\.coffee$/, '.js'
    
    if not fileExists jsFile 
        if not jsLine? then return null
        return [null, null, null]
        
    if not coffeeLine? then return jsFile
    
    mapFile = jsFile + '.map'
    
    if fileExists mapFile
        mapData = fs.readFileSync mapFile, 'utf8'
        consumer = new sourceMap.SourceMapConsumer mapData 
        srcFile = 'coffee/' + coffeeFile.split('/coffee/')[1]
        poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:coffeeCol
        if not poss.length and coffeeCol
            poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:0
        return [jsFile,null,null] if not poss.length
        jsLine = poss[0].line
        jsCol  = poss[0].column
    else
        jsLine = null
        jsCol  = null
        
    [jsFile, jsLine, jsCol]
        
module.exports =
    
    toJs:     toJs
    toCoffee: toCoffee
    
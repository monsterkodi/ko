###
 0000000   0000000   00000000  00000000  00000000  00000000       000               000   0000000    
000       000   000  000       000       000       000              000             000  000         
000       000   000  000000    000000    0000000   0000000            000           000  0000000     
000       000   000  000       000       000       000              000       000   000       000    
 0000000   0000000   000       000       00000000  00000000       000          0000000   0000000     
###

{ fs, valid, empty, slash, log } = require 'kxk'

sourceMap  = require 'source-map'
mapConvert = require 'convert-source-map'

toCoffee  = (jsFile, jsLine, jsCol=0) ->

    jsLine = parseInt jsLine
    jsCol  = parseInt jsCol
    
    coffeeFile = slash.path jsFile
    coffeeLine = jsLine
    coffeeCol  = jsCol
        
    if slash.fileExists jsFile
        mapData = mapConvert.fromSource(fs.readFileSync jsFile, 'utf8')?.toObject()
        if valid mapData
            mapData.sources[0] = slash.resolve slash.join slash.dir(jsFile), mapData?.sources[0] if mapData?.sources[0]
            consumer = new sourceMap.SourceMapConsumer(mapData)
            if consumer.originalPositionFor
                pos = consumer.originalPositionFor line:jsLine, column:jsCol, bias:sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
                if pos.line and pos.column
                    coffeeFile = mapData.sources[0]
                    coffeeLine = pos.line 
                    coffeeCol  = pos.column
        
    [coffeeFile, coffeeLine, coffeeCol]

toJs = (coffeeFile, coffeeLine, coffeeCol=0) ->
    
    jsFile = coffeeFile.replace /\/coffee\//, '/js/'
    jsFile = jsFile.replace /\.coffee$/, '.js'
    
    if not slash.fileExists jsFile 
        if not jsLine? then return null
        return [null, null, null]
        
    if not coffeeLine? then return jsFile
    
    mapFile = jsFile
    
    if slash.fileExists mapFile
        log 'mapFile', mapFile
        mapData = mapConvert.fromSource(fs.readFileSync mapFile, 'utf8').toObject()
        log mapData
        consumer = new sourceMap.SourceMapConsumer mapData
        if consumer?.allGeneratedPositionsFor?
            srcFile = 'js/'+jsFile.split('/js/')[1]
            poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:coffeeCol
            if not poss.length and coffeeCol
                poss = consumer.allGeneratedPositionsFor source:srcFile, line:coffeeLine, column:0
        else
            log consumer?, consumer?.allGeneratedPositionsFor?
            log 'no allGeneratedPositionsFor in', consumer
        return [jsFile,null,null] if empty poss
        jsLine = poss[0].line
        jsCol  = poss[0].column
    else
        jsLine = null
        jsCol  = null
        
    [jsFile, jsLine, jsCol]
        
module.exports =
    toJs:     toJs
    toCoffee: toCoffee
    
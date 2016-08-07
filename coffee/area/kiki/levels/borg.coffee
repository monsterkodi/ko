# level design by Michael Abel

#   0000000     0000000   00000000    0000000 
#   000   000  000   000  000   000  000      
#   0000000    000   000  0000000    000  0000
#   000   000  000   000  000   000  000   000
#   0000000     0000000   000   000   0000000 

module.exports = 
    name:       'borg'
    scheme:     "default_scheme"
    size:       [9,9,9]
    intro:      "borg"
    help:       """
                Believe me,
                they are
                CRAZY!
                """
    player:   
        coordinates: [0,0,0]
        nostatus:     0
                
    exits: [
        name:     "exit"
        active:   1
        position: [0,0,0]
    ]
    create: ->
        world.addObjectAtPos KikiLight(), KikiPos 7,7,7
        for i in [0...150] 
            world.setObjectRandom KikiMutant()
            
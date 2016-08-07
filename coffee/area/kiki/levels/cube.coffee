# level design by Michael Abel

module.exports =
    name:       "cube"
    scheme:   "default_scheme",
    size:     [5,5,5],
    intro:    "cube",
    help:     "reach the exit!"
    player:
        coordinates:  [2,0,0],
        nostatus:     0,
        orientation:  rot0
        
    exits:    [
        name:         "exit",
        active:       1,
        position:     [0,2,2],
    ],
    create: ->
        #startblock
        x=range(5)
        for (i,j,l) in [(i,j,l) for i in x for j in x for l in x]:
            if (-1)**(i+j+l) ==-1:
                world.addObjectAtPos(KikiStone(), KikiPos(i,j,l))

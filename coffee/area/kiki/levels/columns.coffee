module.exports =
    name:   "columns"
    scheme:   "green_scheme"
    size:     [7,9,7]
    intro:    "columns"
    help:     """
                $scale(1.5)mission:
                get to the exit!
                
                to get to the exit,
                use the stones
                """
    player:   position:         [0,-1,0]
                
    exits:    [
        name:         "exit"
        active:       1
        position:     [0,0,0]
    ]
    create: ->

        s = world.getSize()
        
        for y in range(-s.y/2+1, s.y/2+1)
            for x in range(-s.x/2+1, s.x/2+1, 2)
                for z in range(-s.z/2+1, s.z/2+1, 2)
                    world.addObjectAtPos(KikiStone(), world.decenter(x, y, z))
                    
        world.deleteObject(world.getOccupantAtPos(world.decenter(-1, 0, 1)))
        world.deleteObject(world.getOccupantAtPos(world.decenter( 1, 0,-1)))
        world.deleteObject(world.getOccupantAtPos(world.decenter( 1, 0, 1)))
        world.deleteObject(world.getOccupantAtPos(world.decenter(-1, 0,-1)))

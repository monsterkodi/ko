# Level design of 'captured' by Niko Boehm

module.exports =

    name:   "captured"
    scheme:   "default_scheme",
    size:     [9,9,9],
    intro:    "captured",
    help:     """
                    $scale(1.5)mission:
                    get to the exit!
                    
                    to get to the exit,
                    move the stones
                """
    player:
        position:     (0,-3,0)
    exits:    [
        name:         "exit",
        active:       1,
        position:     [0,0,0],
    ]
    create: ->
        s = world.getSize()
        
        for i in [-2, 2]:
            world.addObjectPoly (KikiStone, [world.decenter(1, 1, i), world.decenter(1, -1, i),
                                             world.decenter(-1, -1, i), world.decenter(-1, 1, i)])
            world.addObjectPoly (KikiStone, [world.decenter(1, i, 1), world.decenter(1, i, -1),\
                                             world.decenter(-1, i, -1), world.decenter(-1, i, 1)])
            world.addObjectPoly (KikiStone, [world.decenter(i, 1, 1), world.decenter(i, 1, -1),\
                                             world.decenter(i, -1, -1), world.decenter(i, -1, 1)])
        
        for i in [-4, -2, 2, 4]:
            world.addObjectAtPos(KikiStone(), world.decenter(i, 0, 0))
            world.addObjectAtPos(KikiStone(), world.decenter(0, i, 0))
            world.addObjectAtPos(KikiStone(), world.decenter(0, 0, i))

# level design by Owen Hay

module.exports =
    name:       "spiral"
    scheme:     "zen_scheme",
    intro:      "spiral",
    size:       [5,25,5]
    help:       "Down the Rabbit Hole"
    player:     
        coordinates:     [3,1,3]
        nostatus:         0
    exits:    [
        name:         "exit"
        active:       0
        position:     [0,11,0]
    ]
    create: ->

        s = world.getSize()
        
        for y in [ -7, -3, 1, 5]
            x = 1
            world.addObjectPoly(KikiStone, [world.decenter(-x, y, -x), world.decenter(-x, y, x), world.decenter(x, y, x), ])
        
        for y in [-9, -5, -1, 3]
            x = 1
            world.addObjectPoly(KikiStone, [world.decenter(x, y, x), world.decenter(x, y, -x), world.decenter(-x, y, -x), ])
        
        for y in [12, 11]
            x = 2
            world.addObjectPoly(KikiWireStone, [world.decenter(-x, y, -x), world.decenter(-x, y, x), world.decenter(x, y, x), world.decenter(x, y, -x)])
            
        # KEY GEAR
        world.addObjectAtPos(KikiGear(KikiFace.NY),    world.decenter(0, -10, 0))
        
        # LOCK MECHANISM
        world.addObjectAtPos(KikiGenerator(KikiFace.NY),      world.decenter(-1, 12, 0))
        world.addObjectAtPos(KikiGenerator(KikiFace.NY),      world.decenter(-1, 11, 0))
        
        world.addObjectAtPos(KikiMotorCylinder(KikiFace.NY),  world.decenter(1, 11, 0))
        world.addObjectAtPos(KikiMotorGear(KikiFace.NY),  world.decenter(1, 12, 0))
        
        world.addObjectAtPos(KikiWireStone(),  world.decenter(0, 11, 1))
        world.addObjectAtPos(KikiWireStone(),  world.decenter(0, 12, 1))
        
        world.addObjectAtPos(KikiWireStone(),  world.decenter(0, 11, -1))
        world.addObjectAtPos(KikiWireStone(),  world.decenter(0, 12, -1))
        
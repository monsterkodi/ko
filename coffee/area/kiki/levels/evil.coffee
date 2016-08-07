module.exports =
    name:       "evil"
    scheme:     "red_scheme"
    size:       [13,5,13]
    intro:      "evil"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                
                place a powered
                wire stone next to it.
                a wirestone is powered by
                a rotating generator
                or it shares at least
                one edge with
                another powered wirestone.
                this one is hard,
                really hard,
                but it's possible.
                
                good luck!
                """
    player:     position:         [1,1,1]
    exits:    [
        name:         "exit"
        active:       0
        position:     [0,0,4]
    ],
    create: ->

        sx, sy, sz = 13,5,13
                    
        for z in range(-sz/2+2, sz/2)
            
            world.addObjectAtPos(KikiWall(), world.decenter(-sx/2+2, 0, z))
            world.addObjectAtPos(KikiWall(), world.decenter( sx/2-1, 0, z))
        
        for z in range(-sz/2+4, sz/2-2)
            
            world.addObjectAtPos(KikiWall(), world.decenter(-sx/2+4, 0, z))
            world.addObjectAtPos(KikiWall(), world.decenter( sx/2-3, 0, z))
        
        for x in range(-sx/2+3, sx/2-1)
            
            world.addObjectAtPos(KikiWall(), world.decenter(x, 0, -sz/2+2))
            world.addObjectAtPos(KikiWall(), world.decenter(x, 0,  sz/2-1))
        
        for x in range(-sx/2+4, sx/2-2)
            
            world.addObjectAtPos(KikiWall(), world.decenter(x, 0, -sz/2+4))
            world.addObjectAtPos(KikiWall(), world.decenter(x, 0,  sz/2-3))
        
          
        world.addObjectAtPos(KikiGenerator(KikiFace.PY), world.decenter(0,0,-4))
        world.addObjectAtPos(KikiWireStone(), world.decenter(4,0,0))
        world.addObjectAtPos(KikiWireStone(), world.decenter(-4,0,0))
        
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,-2,-2))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,-1,-2))
        world.addObjectAtPos(KikiMotorGear(KikiFace.PY), world.decenter(0,0,-2))
        world.addObjectAtPos(KikiMotorCylinder(KikiFace.PY), world.decenter(0,1,-2))
        
        world.addObjectAtPos(KikiBomb(), world.decenter(0, 2,-2))
        world.addObjectAtPos(KikiBomb(), world.decenter( 1, 0,-2))
        world.addObjectAtPos(KikiBomb(), world.decenter(-1, 0,-2))
             
        world.removeObject(world.getOccupantAtPos(world.decenter(0, 0, 3)))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,0,3))
        
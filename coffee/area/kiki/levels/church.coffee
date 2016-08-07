module.exports =
    name:       "church"
    scheme:     "yellow_scheme"
    size:       [5,7,5]
    intro:      "church"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                
                to activate the exit,
                feed it with electricity:
                    
                connect the generator
                with the motor
                
                place a wire stone
                next to the exit
                """
    player:   position: [1,0,0]
    exits:    [
        name:     "exit"
        active:   0
        position: [0,-1,0]
    ]
    create: ->
        s = world.getSize()
        
        world.addObjectLine ("KikiWireStone()", KikiPos(0, 0, 0), KikiPos(0, s.y-2, 0))
        world.addObjectLine ("KikiWireStone()", KikiPos(s.x-1, 0, 0), KikiPos(s.x-1, s.y-2, 0))
        world.addObjectLine ("KikiWireStone()", KikiPos(s.x-1, 0, s.z-1), KikiPos(s.x-1, s.y-2, s.z-1))
        world.addObjectLine ("KikiWireStone()", KikiPos(0, 0, s.z-1), KikiPos(0, s.y-2, s.z-1))
        
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2, s.y-2, s.z/2))
        world.addObjectAtPos(KikiGenerator (KikiFace.PY), KikiPos(s.x/2, s.y/2, s.z/2))
        
        world.addObjectAtPos(KikiWireStone(), KikiPos(1,      s.y-2,  1))
        world.addObjectAtPos(KikiWireStone(), KikiPos(s.x-2,  s.y-2,  1))
        world.addObjectAtPos(KikiWireStone(), KikiPos(1,      s.y-2,  s.z-2))
        world.addObjectAtPos(KikiWireStone(), KikiPos(s.x-2,  s.y-2,  s.z-2))
        world.addObjectAtPos(KikiWireStone(), KikiPos(s.x/2,  s.y-1,  s.z/2))
        
        world.addObjectAtPos(KikiMotorGear     (KikiFace.PY), KikiPos(s.x/2, 0, 0))
        world.addObjectAtPos(KikiMotorCylinder (KikiFace.PY), KikiPos(s.x/2, 1, 0))

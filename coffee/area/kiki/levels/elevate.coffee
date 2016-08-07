module.exports =
    name:       "elevate"
    scheme:     "bronze_scheme"
    size:       [9,5,7]
    intro:      "elevate"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                    
                to activate the exit,
                feed it with electricity

                use the bombs
                to elevate the gears

                and the generator

                the bombs will detonate
                if you shoot them
                """
    player:   position: [3,-2,0]
    exits:    [
        name:         "exit"
        active:       0
        position:     2,-2,0
    ]
    create: ->

        s = world.getSize()
        
        world.addObjectAtPos(KikiMotorGear(KikiFace.NY), KikiPos(s.x/2-3, s.y-1, s.z/2))
        world.addObjectAtPos(KikiMotorCylinder(KikiFace.NY), KikiPos(s.x/2-3, s.y-2, s.z/2))
        world.addObjectAtPos(KikiGenerator (KikiFace.NY), KikiPos(s.x/2+2, 1, s.z/2-1))
        world.addObjectAtPos(KikiGear(KikiFace.NY), KikiPos(s.x/2+1, 1, s.z/2+1))
        world.addObjectAtPos(KikiGear(KikiFace.NY), KikiPos(s.x/2, 1, s.z/2-1))
        world.addObjectAtPos(KikiGear(KikiFace.NY), KikiPos(s.x/2-1, 1, s.z/2+1))
        world.addObjectAtPos(KikiGear(KikiFace.NY), KikiPos(s.x/2-2, 1, s.z/2-1))
        
        world.addObjectLine("KikiWire (KikiFace.NY, KikiWire.VERTICAL)", KikiPos(s.x/2+2, s.y-1, 0), KikiPos(s.x/2+2, s.y-1, s.z))
        world.addObjectLine("KikiWire (KikiFace.PY, KikiWire.VERTICAL)", KikiPos(s.x/2+2, 0, 0),     KikiPos(s.x/2+2, 0, s.z))
        world.addObjectLine("KikiWire (KikiFace.PZ, KikiWire.VERTICAL)", KikiPos(s.x/2+2, 0, 0),     KikiPos(s.x/2+2, s.y, 0))
        world.addObjectLine("KikiWire (KikiFace.NZ, KikiWire.VERTICAL)", KikiPos(s.x/2+2, 0, s.z-1), KikiPos(s.x/2+2, s.y, s.z-1))
        
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2+2, 0, s.z/2-1))
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2+1, 0, s.z/2+1))
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2, 0, s.z/2-1))
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2-1, 0, s.z/2+1))
        world.addObjectAtPos(KikiBomb(), KikiPos(s.x/2-2, 0, s.z/2-1))
        
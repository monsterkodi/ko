# level design by Owen Hay

module.exports =
    name:       "invisimaze"
    scheme:     "yellow_scheme"
    size:       [9,5,5]
    intro:      "invisimaze"
    help:       """
                blindly fumbling through the maze
                
                the switches move every time you play
                there is only one way out!
                """
    player:   position: [0,1,0]
    exits:    [
        name:         "exit1"
        active:       0
        position:     [-4,0,0]
    ,
        name:         "exit2"
        active:       0
        position:     [4,0,0]
        world:        () ->  outro()
    ]
    create: ->

        s = world.getSize()
        
        def switched(switch):
             world.switch_counter += switch.isActive() and 1 or -1
             exit = kikiObjectToGate(world.getObjectWithName("exit"))
             exit.setActive(world.switch_counter == 5)
        
        def switchBoth():
                world.toggle("exit1")
                world.toggle("exit2")
        
        #randomly assign the switches to different locations
        tup_array = [(0,0,0),( 2, 1, -2),( -2, -2, 0),( -1, 2, 1),( -2, -2, -1),( 1, -1,2),]
        random.shuffle(tup_array)
             
        i0 = tup_array[0]
        i1 = tup_array[1]
        i2 = tup_array[2]
        i3 = tup_array[3]
        i4 = tup_array[4]
        i5 = tup_array[5]
        
        exit_switch = KikiSwitch()
        exit_switch.getEventWithName("switched").addAction(continuous(()-> : switchBoth()))
        world.addObjectAtPos(exit_switch, world.decenter(i0) )
        
        exit2_switch = KikiSwitch()
        exit2_switch.getEventWithName("switched").addAction(continuous(()-> : world.toggle("exit2")))
        world.addObjectAtPos(exit2_switch, world.decenter(i1))
        
        exit3_switch = KikiSwitch()
        exit3_switch.getEventWithName("switched").addAction(continuous(()-> : world.toggle("exit1")))
        world.addObjectAtPos(exit3_switch, world.decenter(i2))
        
        exit4_switch = KikiSwitch()
        exit4_switch.getEventWithName("switched").addAction(continuous(()-> : world.toggle("exit1")))
        world.addObjectAtPos(exit4_switch, world.decenter(i3))
        
        exit5_switch = KikiSwitch()
        exit5_switch.getEventWithName("switched").addAction(continuous(()-> : world.toggle("exit1")))
        world.addObjectAtPos(exit5_switch, world.decenter(i4))
        
        # Invisimaze
        for y in [0, 1, ]:
             world.addObjectLine(KikiStone, KikiPos(4, y, 2), KikiPos(4, y, 5))
             world.addObjectLine(KikiStone, KikiPos(5, y, 2), KikiPos(7, y, 2))
        
        for y in [0,]:
            for x in [2]: 
                world.addObjectPoly(KikiStone, [world.decenter(-2, 0, -2), world.decenter(-2, 0, 2), \
                                                world.decenter(2, 0, 2), world.decenter(2, 0, -2)])
        
        world.addObjectPoly(KikiStone, [KikiPos(2, 4, 2), KikiPos(2, 4, 4), \
                                          KikiPos(4, 4, 4), KikiPos(4, 4, 2)])
        
        world.addObjectAtPos(KikiStone(), KikiPos(2, 3, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(6, 3, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(6, 3, 3))
        world.addObjectAtPos(KikiStone(), KikiPos(2, 1, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(3, 0, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(2, 1, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(2, 0, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(4, 2, 3))
        world.addObjectAtPos(KikiStone(), KikiPos(5, 2, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(5, 2, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(4, 2, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(3, 2, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(3, 2, 3))
        world.addObjectAtPos(KikiStone(), KikiPos(5, 3, 0))
        
        world.addObjectAtPos(KikiStone(), KikiPos(6, 4, 0))
        
        #the bombLock
        world.addObjectAtPos(KikiStone(), KikiPos(7, 1, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(7, 1, 3))
        world.addObjectAtPos(KikiStone(), KikiPos(7, 3, 2))
        world.addObjectAtPos(KikiStone(), KikiPos(7, 2, 1))
        world.addObjectAtPos(KikiStone(), KikiPos(7, 2, 2))
        world.addObjectAtPos(KikiBomb(), KikiPos(7, 2, 2))
        
        # Exit 1 is blocked!!!
        world.addObjectAtPos(KikiMotorCylinder(), KikiPos(1, 2, 2))        
        
        # Walls
        for y in [-4,]:
            for x in [1, -1]: 
                world.addObjectPoly(KikiWall, [world.decenter(y, -x, -x), world.decenter(y, -x, x), \
                                                world.decenter(y, x, x), world.decenter(y, x, -x)])
        for y in [-3]:
            for x in [2, -2]: 
                world.addObjectPoly(KikiWall, [world.decenter(y, -x, -x), world.decenter(y, -x, x), \
                                               world.decenter(y, x, x), world.decenter(y, x, -x)])
        
        for y in [4,]:
            for x in [1, -1]: 
                world.addObjectPoly(KikiWall, [world.decenter(y, -x, -x), world.decenter(y, -x, x), \
                                                  world.decenter(y, x, x), world.decenter(y, x, -x)])
        for y in [3]:
            for x in [2, -2]: 
                world.addObjectPoly(KikiWall, [world.decenter(y, -x, -x), world.decenter(y, -x, x), \
                                                  world.decenter(y, x, x), world.decenter(y, x, -x)])
        
        
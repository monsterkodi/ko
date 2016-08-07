# level design by Owen Hay

module.exports =
    name:       "cheese"
    scheme:     "yellow_scheme"
    size:       [11,12,7]
    intro:      "cheese"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                
                to activate the switches,
                shoot them
                
                to be able to shoot the switches,
                move the center stone
                to move the center stone,
                use the bomb.
                
                the bomb will detonate if you shoot it
                """
    player:
        coordinates:     [3, 4,3]
        nostatus:         0
                
    exits:    [
        name:         "exit"
        active:       0
        position:     [-1,0,0]
    ]
    create: ->
        s = world.getSize ()
        h = 0
        # bomb and stones
        for i in [1, 2]
              world.addObjectAtPos(KikiWall(), KikiPos(1, i, 1))
              world.addObjectAtPos(KikiWall(), KikiPos(1, i, 3))
              world.addObjectAtPos(KikiWall(), KikiPos(2, i, 1))
              world.addObjectAtPos(KikiWall(), KikiPos(2, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(2, i, 5))
              world.addObjectAtPos(KikiWall(), KikiPos(3, i, 1))
              world.addObjectAtPos(KikiWall(), KikiPos(3, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(3, i, 4))
              world.addObjectAtPos(KikiWall(), KikiPos(3, i, 5))
              world.addObjectAtPos(KikiWall(), KikiPos(5, i, 0))
              world.addObjectAtPos(KikiWall(), KikiPos(5, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(5, i, 3))
              world.addObjectAtPos(KikiWall(), KikiPos(5, i, 4))
              world.addObjectAtPos(KikiWall(), KikiPos(6, i, 1))
              world.addObjectAtPos(KikiWall(), KikiPos(6, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(7, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(7, i, 4))
              world.addObjectAtPos(KikiWall(), KikiPos(7, i, 5))
              world.addObjectAtPos(KikiWall(), KikiPos(8, i, 0))
              world.addObjectAtPos(KikiWall(), KikiPos(8, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(8, i, 4))
              world.addObjectAtPos(KikiWall(), KikiPos(8, i, 5))
              world.addObjectAtPos(KikiWall(), KikiPos(9, i, 2))
              world.addObjectAtPos(KikiWall(), KikiPos(9, i, 4))
              world.addObjectAtPos(KikiWall(), KikiPos(10, i, 3))
        
        for i in range(0,s.x)
              for j in range(0, s.z)
                    world.addObjectAtPos(KikiStone(), KikiPos(i,2,j))
        
        world.switch_counter = 0
        
        switched = (switch) ->
            world.switch_counter += switch.isActive() and 1 or -1
            exit = kikiObjectToGate(world.getObjectWithName("exit"))
            exit.setActive(world.switch_counter == 4)
        
        switch1 = KikiSwitch()
        switch1.getEventWithName("switched").addAction(continuous(()-> s=switch1: switched(s)))
        switch2 = KikiSwitch()
        switch2.getEventWithName("switched").addAction(continuous(()-> s=switch2: switched(s)))
        switch3 = KikiSwitch()
        switch3.getEventWithName("switched").addAction(continuous(()-> s=switch3: switched(s)))
        switch4 = KikiSwitch()
        switch4.getEventWithName("switched").addAction(continuous(()-> s=switch4: switched(s)))
        
        world.addObjectAtPos(switch1, KikiPos(1, 0 ,2))
        world.addObjectAtPos(switch2, KikiPos( 7, 1, 0))
        world.addObjectAtPos(switch3, KikiPos(9, 0, 0))
        world.addObjectAtPos(switch4, KikiPos(9, 1,  5))
        
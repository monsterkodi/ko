module.exports =
    name:   "hidden"
    scheme:   "metal_scheme",
    size:     [9,9,9],
    intro:    "hidden",
    help:     """
                $scale(1.5)mission:
                activate the exit!
                
                to activate the exit,
                activate the 5 switches
                
                use the stones to
                reach the exit
                """
    player:   position: [0,-3,1]
                
    exits:    [
        name:         "exit",
        active:       0,
        position:     [0,0,0],
    ],
    create: ->
        s = world.getSize()
        
        world.addObjectAtPos(KikiStone (), KikiPos(0,0,1))
        world.addObjectAtPos(KikiStone (), KikiPos(0,1,0))
        world.addObjectAtPos(KikiStone (), KikiPos(1,0,1))
        world.addObjectAtPos(KikiStone (), KikiPos(1,1,0))
        world.addObjectAtPos(KikiStone (), KikiPos(2,0,0))
        switch1 = KikiSwitch ()
        world.addObjectAtPos(switch1, KikiPos(1,0,0))
        
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-1,0,1))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-1,1,0))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-2,0,1))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-2,1,0))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-3,0,0))
        switch2 = KikiSwitch ()
        world.addObjectAtPos(switch2, KikiPos(s.x-2,0,0))
        
        world.addObjectAtPos(KikiStone (), KikiPos(0,0,s.z-2))
        world.addObjectAtPos(KikiStone (), KikiPos(0,1,s.z-1))
        world.addObjectAtPos(KikiStone (), KikiPos(1,0,s.z-2))
        world.addObjectAtPos(KikiStone (), KikiPos(1,1,s.z-1))
        world.addObjectAtPos(KikiStone (), KikiPos(2,0,s.z-1))
        switch3 = KikiSwitch ()
        world.addObjectAtPos(switch3, KikiPos(1,0,s.z-1))
        
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-1,0,s.z-2))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-1,1,s.z-1))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-2,0,s.z-2))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-2,1,s.z-1))
        world.addObjectAtPos(KikiStone (), KikiPos(s.x-3,0,s.z-1))
        switch4 = KikiSwitch ()
        world.addObjectAtPos(switch4, KikiPos(s.x-2,0,s.z-1))
        
        world.addObjectPoly (KikiStone, [KikiPos(s.x/2-1,s.y-1,s.z/2-1), KikiPos(s.x/2-1,s.y-1,s.z/2+1), \
                                         KikiPos(s.x/2+1,s.y-1,s.z/2+1), KikiPos(s.x/2+1,s.y-1,s.z/2-1)])
        switch5 = KikiSwitch ()                              
        world.addObjectAtPos(KikiStone (), KikiPos(s.x/2,s.y-2,s.z/2))
        world.addObjectAtPos(switch5, KikiPos(s.x/2,s.y-1,s.z/2))
        
        world.switch_counter = 0
        
        def switched (switch):
            world.switch_counter += switch.isActive() and 1 or -1
            exit = kikiObjectToGate (world.getObjectWithName("exit"))
            exit.setActive (world.switch_counter == 5)
        
        switch1.getEventWithName("switched").addAction (continuous (()-> s=switch1: switched(s)))
        switch2.getEventWithName("switched").addAction (continuous (()-> s=switch2: switched(s)))
        switch3.getEventWithName("switched").addAction (continuous (()-> s=switch3: switched(s)))
        switch4.getEventWithName("switched").addAction (continuous (()-> s=switch4: switched(s)))
        switch5.getEventWithName("switched").addAction (continuous (()-> s=switch5: switched(s)))

# level design by Michael Abel

schemes=[test_scheme, tron_scheme,candy_scheme, default_scheme,
         green_scheme, yellow_scheme, blue_scheme, red_scheme, metal_scheme, bronze_scheme]

module.exports =
    name:       "gamma"
    scheme:     "tron_scheme"
    size:       [10,10,10]
    intro:      "gamma"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                
                shoot at the 3 switches to activate the exit
                """
    player: 
        coordinates:     [0,5,0]
        nostatus:         0
    exits:    [
        name:         "exit"
        active:       0
        coordinates:  [2,7,4] #absolute coord
    ]
    create: ->
        s = world.getSize()
        world.switch_countera = 0
        world.switch_counter = 0
        
        aswitched = () ->
            applyColorScheme (schemes[world.switch_countera])
            if world.switch_countera==schemes.length-1
                 world.switch_countera=0
            else
                world.switch_countera+=1
        switched = (switch) ->
            world.switch_counter += switch.isActive() and 1 or -1
            exit = kikiObjectToGate(world.getObjectWithName("exit"))
                exit.setActive(world.switch_counter == 4)
                
        aswitch = KikiSwitch()
        bswitch = KikiSwitch()
        cswitch = KikiSwitch()
        dswitch = KikiSwitch()
        eswitch = KikiSwitch()
        
        aswitch.getEventWithName("switched").addAction(continuous( aswitched ))
        bswitch.getEventWithName("switched").addAction(continuous(()-> s= bswitch :  switched(s) ))
        cswitch.getEventWithName("switched").addAction(continuous(()-> s= cswitch :  switched(s) ))
        dswitch.getEventWithName("switched").addAction(continuous(()-> s= dswitch :  switched(s) ))
        eswitch.getEventWithName("switched").addAction(continuous(()-> s= eswitch :  switched(s) ))
 
        world.addObjectAtPos(aswitch , KikiPos  (s.x-1,0,0))
        world.addObjectAtPos(bswitch , KikiPos  (0,0,0))
           
        world.addObjectAtPos(KikiMutant() , KikiPos  (s.x/2,0,0))
        world.addObjectLine(KikiWall, KikiPos(0,0,1), KikiPos(s.x,0,1))
        world.addObjectLine(KikiWall, KikiPos(0,1,0), KikiPos(s.x,1,0))
        
        world.addObjectLine(KikiWall, KikiPos(0,2,2), KikiPos(s.x-3,2,2))
        world.addObjectAtPos(KikiSwitch() , KikiPos  (s.x-3,2,2))
        world.addObjectLine(KikiWall, KikiPos(2,2,2), KikiPos(2,2,s.z-3))
        world.addObjectAtPos(KikiSwitch() , KikiPos  (2,2,s.z-3))
        world.addObjectLine(KikiWall, KikiPos(2,2,4), KikiPos(2,s.y-3,4))
        #exit 
        world.addObjectAtPos(KikiSwitch() , KikiPos  (2,s.y-3,4))
           
        world.addObjectLine(KikiWall, KikiPos(2,4,4), KikiPos(s.x-4,4,4))
        world.addObjectAtPos(cswitch , KikiPos  (s.x-3,4,4))
           
        world.addObjectLine(KikiWall, KikiPos(4,4,4), KikiPos(4,4,s.z-4))
        world.addObjectAtPos(dswitch , KikiPos  (4,4,s.z-3))
           
        world.addObjectLine(KikiWall, KikiPos(4,4,6), KikiPos(4,s.y-4,6))
        world.addObjectAtPos(eswitch , KikiPos  (4,s.y-3,6))
        
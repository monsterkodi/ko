# level design by Michael Abel
module.exports =    
    name:       "sandbox"
    scheme:     "bronze_scheme"
    size:       [9,9,6]
    intro:      "sandbox"
    help:       """
                $scale(1.5)mission:
                activate the exit!
                
                All you have to do
                is to put nine stones
                into the sandbox
                and shoot at the switch
                """
    player:     
        coordinates:  [4,6,2]
        orientation:  rotx90
    exits:    [
        name:         "exit"
        active:       0
        position:     [0,0,0]
    ]
    create: ->
        
        switched = ->
            unoccupied = false
            for (i,j) in [ (i,j) for i in range(3,6) for j in range(3,6) ]
              if world.isUnoccupiedPos(KikiPos(i,j,0))
                  unoccupied=True
                
            if not unoccupied:
                world.toggle("exit")
            
        switch = KikiSwitch()
        switch.getEventWithName("switched").addAction ( continuous ( switched ))
           
        world.addObjectAtPos(switch , KikiPos  (0,5,0))
        world.addObjectPoly(KikiWall, [ KikiPos(2,2,0),KikiPos(2,6,0),KikiPos(6,6,0),KikiPos(6,2,0)], 1)
        
        #inside    
        world.addObjectAtPos(KikiStone() , KikiPos(3,4,2))
        world.addObjectAtPos(KikiStone() , KikiPos(3,5,1))
        world.addObjectAtPos(KikiStone() , KikiPos(5,3,1))
        world.addObjectAtPos(KikiStone() , KikiPos(5,4,2))
        #border
        world.addObjectAtPos(KikiStone() , KikiPos(3,6,1))
        world.addObjectAtPos(KikiStone() , KikiPos(4,6,1))
        world.addObjectAtPos(KikiStone() , KikiPos(3,2,1))
        world.addObjectAtPos(KikiStone() , KikiPos(5,2,1))
        world.addObjectAtPos(KikiStone() , KikiPos(6,4,1))
        world.addObjectAtPos(KikiStone() , KikiPos(6,3,1))
        #outside
        world.addObjectAtPos(KikiStone() , KikiPos(5,1,0))
        world.addObjectAtPos(KikiStone() , KikiPos(1,7,0))
        
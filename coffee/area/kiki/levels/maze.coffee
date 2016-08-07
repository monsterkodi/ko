# level design by Michael Abel

module.exports =

    name:       "maze"
    scheme:     "default_scheme"
    size:       [4,4,4]
    intro:      "maze"
    help:       """
                $scale(1.5)mission:
                get to the exit!
                but don't get confused :) !
                """
    player:   
        coordinates:     [3,0,0]
        nostatus:         0
        orientation:      rotz90
    exits:    [
        name:         "exit"
        active:       1
        coordinates:  [3,3,1] #absolute coord
    ]
    create: ->
        #level 0|  # |
        #       | #  | ^ y
        #       |   #| |
        #       | ##k|  -> x
            
        world.addObjectAtPos(KikiWall(), KikiPos(1,0,0))
        world.addObjectAtPos(KikiWall(), KikiPos(2,0,0))
        world.addObjectAtPos(KikiWall(), KikiPos(3,1,0))
        world.addObjectAtPos(KikiWall(), KikiPos(1,2,0))
        world.addObjectAtPos(KikiWall(), KikiPos(2,3,0))
           
       #level 1|# # |
       #       |# ##|
       #       |## #|
       #       |  # |
        world.addObjectAtPos(KikiWall(), KikiPos(2,0,1))
        world.addObjectAtPos(KikiWall(), KikiPos(0,1,1))
        world.addObjectAtPos(KikiWall(), KikiPos(1,1,1))
        world.addObjectAtPos(KikiWall(), KikiPos(3,1,1))
        world.addObjectAtPos(KikiWall(), KikiPos(0,2,1))
        world.addObjectAtPos(KikiWall(), KikiPos(2,2,1))
        world.addObjectAtPos(KikiWall(), KikiPos(3,2,1))
        world.addObjectAtPos(KikiWall(), KikiPos(0,3,1))
        world.addObjectAtPos(KikiWall(), KikiPos(2,3,1))
           
       #level 2| ###|
       #       |# ##|
       #       | #e#|
       #       |### |
        world.addObjectAtPos(KikiWall(), KikiPos(0,0,2))
        world.addObjectAtPos(KikiWall(), KikiPos(1,0,2))
        world.addObjectAtPos(KikiWall(), KikiPos(2,0,2))
        world.addObjectAtPos(KikiWall(), KikiPos(1,1,2))
        world.addObjectAtPos(KikiWall(), KikiPos(3,1,2))
        world.addObjectAtPos(KikiWall(), KikiPos(0,2,2))
        world.addObjectAtPos(KikiWall(), KikiPos(2,2,2))
        world.addObjectAtPos(KikiWall(), KikiPos(3,2,2))
        world.addObjectAtPos(KikiWall(), KikiPos(1,3,2))
        world.addObjectAtPos(KikiWall(), KikiPos(2,3,2))
        world.addObjectAtPos(KikiWall(), KikiPos(3,3,2))
           
       #level 3| #  |
       #       |  # |
       #       | ## |
       #       |    |
        world.addObjectAtPos(KikiWall(), KikiPos(1,1,3))
        world.addObjectAtPos(KikiWall(), KikiPos(2,1,3))
        world.addObjectAtPos(KikiWall(), KikiPos(2,2,3))
        world.addObjectAtPos(KikiWall(), KikiPos(1,3,3))
           
        world.addObjectAtPos(KikiLight (), KikiPos(3,0,0))
            
        world.setCameraMode(world.CAMERA_INSIDE)
        
module.exports =
    name:       "jump"
    scheme:     "red_scheme"
    size:       [7,7,13]
    intro:      "jump"
    help:       """  
                $scale"""1.5)mission:
                get to the exit!
                
                jump on the stones to reach it
                
                you can attach to a stone when falling by
                if you move into its direction
                """
    player:   position:         [0,0,5]
    exits:    [
        name:         "exit"
        active:       1
        position:     [0,0,4]
    ]
    create: ->

        s = world.getSize()
        
        world.addObjectAtPos(KikiWall(), world.decenter(0,0,1 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(0,0,3 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(0,0,6 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(0,1,10 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(1,0,10 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(-1,0,10 - s.z/2))
        world.addObjectAtPos(KikiWall(), world.decenter(0,-1,10 - s.z/2))
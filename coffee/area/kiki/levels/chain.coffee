module.exports =
    name:   "chain"
    "scheme":   "candy_scheme",
    "size":     [9,9,5],
    "intro":    "chain", 
    "help":     ( 
                    "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                    "to activate the exit,\nfeed it with electricity:\n\n" + \
                    "connect the generator\nwith the motor\n\n" + \
                    "place a wire stone\nnext to the exit",
                ),
    "player":   
        "position":     [1,2,0]
                
    "exits":    [
        "name":         "exit",
        "active":       0,
        "position":     [0,-1,0],
    ],
    "create": ->
        s = world.getSize()
        d = s.z/2
        
        world.addObjectAtPos(KikiWall(), KikiPos(0, 0, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(0, 1, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(1, 0, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(0, 7, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(5, 7, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(1, 3, d))
        world.addObjectAtPos(KikiBomb(), KikiPos(5, 3, d))
        world.addObjectAtPos(KikiWireStone(), KikiPos(1,5,d))
# 
}
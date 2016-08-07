# .................................................................................................................
level_dict["love"] = {   
                        "scheme":   "red_scheme",
                        "size":     (13,13,13),    
                        "intro":    "love", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!",
                                    ),
                        "player":   {   "position":         (0,1,-4),
                                        "orientation":      rot0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "peace",
                                            "active":       1,
                                            "position":     (0,0,4),
                                        },
                                    ],
                        "create":
"""
heart = [[0,0], [ 1,1], [ 2,1], [ 3,0], [ 3,-1], [ 2,-2], [ 1,-3], [0,-4],
                [-1,1], [-2,1], [-3,0], [-3,-1], [-2,-2], [-1,-3]]
for h in heart:
    world.addObjectAtPos (KikiBomb(), world.decenter(h[0],h[1]+1,4))
    world.addObjectAtPos (KikiStone(), world.decenter(h[0],h[1]+1,-4))
    
world.addObjectAtPos (KikiMutant(), world.decenter(0,-4,0))

""",                                 
}

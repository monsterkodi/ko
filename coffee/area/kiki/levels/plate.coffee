# level design by Michael Abel

# .................................................................................................................

level_dict["plate"] = {   
                        "scheme":   "blue_scheme",
                        "size":     (7,7,9),
                        "intro":    "plate",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "use the bombs : )",
                                    ),
                        "player":   {   "coordinates":     (3,2,1),
                                        "nostatus":         0,
					"orientation":		KQuaternion.rotationAroundVector(270,  KVector(1,0,0))
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
					    "position":		(0,0,0),
                                        },
                                    ],
                        "create":

#TODO: chance the old Walls (commendted) into slicky Walls

"""

stone=lambda:KikiStone(KColor(0.6,0.6,0.6),True)
world.addObjectAtPos (KikiStone(KColor(0.8,0.8,0.3),True), world.decenter(0,0,0))

world.addObjectPoly(stone, [	world.decenter(1,1,0),world.decenter(1,-1,0),
				world.decenter(-1,-1,0),world.decenter(-1,1,0)], 1)



#world.addObjectAtPos (KikiStone(), world.decenter(0,0,0))

#world.addObjectAtPos (KikiWall(), world.decenter(0,1,0))
#world.addObjectAtPos (KikiWall(), world.decenter(0,-1,0))
#world.addObjectAtPos (KikiWall(), world.decenter(1,0,0))
#world.addObjectAtPos (KikiWall(), world.decenter(-1,0,0))
#world.addObjectAtPos (KikiStone(), world.decenter(1,1,0))
#world.addObjectAtPos (KikiStone(), world.decenter(-1,-1,0))
#world.addObjectAtPos (KikiStone(), world.decenter(1,-1,0))
#world.addObjectAtPos (KikiStone(), world.decenter(-1,1,0))

world.addObjectAtPos (KikiBomb(), world.decenter(0,1,-4))
world.addObjectAtPos (KikiBomb(), world.decenter(0,-1,-4))
world.addObjectAtPos (KikiBomb(), world.decenter(1,0,-4))
world.addObjectAtPos (KikiBomb(), world.decenter(-1,0,-4))

world.addObjectAtPos (KikiBomb(), world.decenter(0,0,-2))

""",                                 
}

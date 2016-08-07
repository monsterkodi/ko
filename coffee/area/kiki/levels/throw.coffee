# level design by Michael Abel

# .................................................................................................................
def func_throw():
	world.addObjectAtPos( KikiWall(),  world.decenter(-2,0,2))
	world.addObjectAtPos( KikiStone(), world.decenter(0,1,3))
	world.addObjectAtPos( KikiStone(), world.decenter(0,-1,3))
	
level_dict["throw"] = {   
                        "scheme":   "tron_scheme",
                        "size":     (5,7,7),
                        "intro":    "throw",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "use the stones to reach it\n\n" + \
                                        "push a stone and it will fall down\n" + \
                                        "if nothing is below it\n\n" + \
                                        "but remember:\nyou decide where down and below is!",
                                    ),
                        "player":   {   "position":     (0,1,2),
							            "orientation":  rotx90 * rotx180 * roty270,
				    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":  (0,0,0),
                                        },
				    ],
			 "create": func_throw,
			}

# .................................................................................................................


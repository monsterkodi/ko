# level design by Michael Abel

# .................................................................................................................
def func_slick():
	s=world.getSize()
	for b in range(1,4):
	  for (k,l) in [ (i,j) for i in range(b+1,s.x-b-1) for j in range(b+1,s.y-b-1) ]:
	    world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), KikiPos(k,l,b*3))

	world.addObjectAtPos( KikiWall(), KikiPos(s.x/2,s.y/2,0))
	world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), KikiPos(s.x/2,s.y/2,2))
	
level_dict["slick"] = {   
                        "scheme":   "tron_scheme",
                        "size":     (9,11,15),
                        "intro":    "slick",    
                        "help":     ( 
                        				"$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "The green stone is slicky\n" + \
                                        "you can't grab it while falling",
                                    ),
                        "player":   {   "coordinates":     (4,10,0),
					    "orientation"	:	rotx90

				    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0,0,4),
                 			    
                                        },
				    ],
			 "create": func_slick,
			}

# .................................................................................................................


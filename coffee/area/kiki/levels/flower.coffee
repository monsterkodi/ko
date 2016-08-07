# level design by Michael Abel
# .................................................................................................................
def func_flower():
	s=world.getSize();
	for m in [ (1,KikiWall) , (2,KikiStone) ]:	
	  for (k,l) in [ (i,j) for i in [-1*m[0],1*m[0] ] for j in [-1*m[0],1*m[0]]]:
	    world.addObjectLine(m[1], 	KikiPos(s.x/2+k, s.y/2+l ,0), 
	    				KikiPos(s.x/2+k, s.y/2+l ,3))	
	    world.addObjectLine(m[1], 	KikiPos(s.x/2+k, s.y/2+l ,8), 
	    				KikiPos(s.x/2+k, s.y/2+l ,s.z))	
						
	world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), world.decenter(1,0,0))
	world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), world.decenter(-1,0,0))
	world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), world.decenter(0,1,0))
	world.addObjectAtPos (KikiStone(KColor(0,1,0,0.5), True), world.decenter(0,-1,0))

 
	
level_dict["flower"] = {   
                        "scheme":   "metal_scheme",
                        "size":     (7,7,11),
                        "intro":    "flower",    
                        "help":     ( 
                        				"$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "the green stone is slicky" + \
                                        "you can't grab it while falling",
                                    ),
                        "player":   {   "coordinates":     (3,0,1),
                                        "nostatus":         0,
					"orientation"	:	roty0

                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0,0,0),
                                        },
				    ],
			 "create": func_flower,
			}

# .................................................................................................................


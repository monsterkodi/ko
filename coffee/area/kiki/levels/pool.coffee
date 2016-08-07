# level design by Michael Abel

module.exports =

def func_pool():
	s=world.getSize()
	d=1
	for (i,j,l) in [ (m,n,o) for m in range(s.x) for n in range(s.y) for o in range( s.z/2-1)]:
	  if (-1)**(i+j+l) ==1  and not ( d<=i<=s.x-d-1 and d<=j<=s.y-d-1 and d<=l ):
     world.addObjectAtPos(KikiStone(KColor(0.3,0.3,1.0,0.9) , True) , KikiPos(i,j,l))

	stone=KikiWall
	
	for h in [ s.z/2 -1, s.z-5]:
		world.addObjectPoly(stone,[ KikiPos(0,0,h),KikiPos(s.x-1,0,h),KikiPos(s.x-1,s.y-1,h),KikiPos(0,s.y-1,h)	 ],close=1)
	
	for (i,j) in [ (m,n) for m in range(s.x) for n in range(s.y) ]:
	  if (-1)**(i+j) ==1  :
     world.addObjectAtPos(KikiWall(), KikiPos(i,j,s.z-1))
     world.addObjectAtPos(KikiWall(), KikiPos(i,j,s.z-2))
     world.addObjectAtPos(KikiWall(), KikiPos(i,j,s.z-3))

		
 
	
    name:   "pool"
                        "scheme":   "green_scheme",
                        "size":     (11,11,11),
                        "intro":    "pool",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!",
                                    ),
                        "player":   {   "coordinates":     (5,10,5),
                                        "nostatus":         0,
					"orientation":		rotx90

				    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0,0,-1),
                                        },
				    ],
			 "create": func_pool,
			}

# .................................................................................................................


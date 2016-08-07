# level design by Michael Abel
# .................................................................................................................
def func_mesh():
	s=world.getSize()

	def middlemax(u,v,w):
		s=world.getSize()
		d= 3.0/( (u-s.x/2.0)**2+ (v-s.y/2.0)**2 + (w-s.z/2.0)**2 + 1 )
		return min(1.0 ,max(0.2,d))
	def middlemin(u,v,w):
		s=world.getSize()
		d= ( (u-s.x/2.0)**2+ (v-s.y/2.0)**2 + (w-s.z/2.0)**2  )/25
		return min(1.0 ,max(0.4,d))
		
	for (i,j,l) in [ (m,n,o) for m in range(s.x) for n in range(s.y) for o in range(s.z)]:
	  if (i+1)%2 and (j+1)%2 and (l+1)%2:
	    world.addObjectAtPos (KikiStone(KColor(0.1*i,0.1*j,0.1*l,middlemin(i,j,l)) , True)	, KikiPos (i,j,l))

 
	
level_dict["mesh"] = {   
                        "scheme":   "default_scheme",
                        "size":     (11,11,11),
                        "intro":    "mesh",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!",
                                    ),
                        "player":   {   "coordinates":     (0,0,5),
                                        "nostatus":         0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0,0,0),
                                        },
				    ],
			 "create": func_mesh,
			}

# .................................................................................................................


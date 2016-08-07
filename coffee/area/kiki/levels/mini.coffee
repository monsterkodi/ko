# level design by Michael Abel

module.exports =
def func_mini():
	
	world.addObjectAtPos( KikiWall(), KikiPos(1,1,0))
	world.addObjectAtPos( KikiWall(), KikiPos(3,1,0))
	world.addObjectAtPos( KikiWall(), KikiPos(1,3,0))
	world.addObjectAtPos( KikiWall(), KikiPos(3,3,0))
	
	world.addObjectAtPos( KikiWall(), KikiPos(1,1,6))
	world.addObjectAtPos( KikiWall(), KikiPos(3,1,6))
	world.addObjectAtPos( KikiWall(), KikiPos(1,3,6))
	world.addObjectAtPos( KikiWall(), KikiPos(3,3,6))

	world.addObjectAtPos( KikiStone(), KikiPos(1,1,1))
	world.addObjectAtPos( KikiStone(), KikiPos(3,1,1))
	world.addObjectAtPos( KikiStone(), KikiPos(1,3,1))
	world.addObjectAtPos( KikiStone(), KikiPos(3,3,1))
	
	
	
	world.addObjectAtPos(  KikiStone(), KikiPos(2,4,0))
	
 
	
    name:   "mini"
                        scheme:   "tron_scheme",
                        size:     [5,5,7],
                        intro:    "mini",
                        help:     """
                                        "$scale(1.5)mission:\nget to the exit!",
                                    """
                        player:   {   coordinates:     [2,4,4],
                                        nostatus:         0,
					"orientation"	:	rotx90

				    },
                        exits:    [
                                        {
                                            name:         "exit",
                                            active:       1,
                                            position:     [0,0,1],
                                        },
				    ],
    create: func_mini,
			}

# .................................................................................................................


Player spawns in an escape pod. 

Vehicle rockets to planet and you crash land at "spawn". 

player is able to walk around and collect lose materials(level 1). 

Once they have constructed basic tools they will be able to harvest more complex resources (level 2). 

Once they have Level 2 resources they can process them into new resources that can be used to construct level 2 tools and equipment which unlock gathering level 3 resources. 

Once they have level 3 resources they can process them into new resources that can be used to construct level 3 tools and equipment

Resources : 

stone               1
stick               1
fruit               1
root veg            2
berry               1
iron ore            3
copper ore          2
tin ore             2
copper tools        2
tin storage         2
iron tools          3
iron storage        3
logs                2
charcoal            2
coal                2
bronze tools        3
brass storage       3
smelter             1
electric smelter    3
electric macerator  2
battery             3
generator           3
cable               3
rubber              3
tap                 3
sand                2
glass               3
rare minerals       3
solar panel         3


Resource flags : 
is solid(can walk over it)
is fixed(is this a feature of the land rather than a loose item on the floor)

Artwork will be encoded as binary and decompressed when the game loads. Once decoded, art can be redrawn in a variety of colours. For uniqueness a world should have a seed built up of colours used to recolour things. e.g. one world might have a green landscape while another might have red. raw metal resources should remain fixed colours but the stone might vary in colour. art will be simple and will loosely resemble the same level of quality you might see in original head over heels for the amstrad so only a few colours to keep space down. being able to recolour elements means e.g. for an ingot I can have 1 ingot image stored and then recolour for each resource. Makes extending the game easy as well.

All background elements should be indexed from a pregenerated map. Once each chunk is generated, it can be modified by player actions.

All foreground elements should be entities with flags. 
    Can this be picked up
    Is this solid
    Is this attached to the ground or loose
    Does it have unique metadata

All players for the purposes of the game engine should be considered entities. Player movement from local controls and networked controls should update the entities location. Controls can be passed on to another entity if the player is inside another entity. e.g. Player inside Truck in driver seat.

Game long term goal is to automate gathering resources and using those resources to expand.

mmo paths

/space-cats/                    Game root
/space-cats/lobby               Game Lobby to find new games
/space-cats/game-id             Individual game
/space-cats/game-id/world-id    Individual world for game to take part in. Long term goal, visit multiple worlds
/space-cats/hub                 <redacted>
/space-cats/pirate-cats         <redacted>
/space-cats/space-navy          <redacted>





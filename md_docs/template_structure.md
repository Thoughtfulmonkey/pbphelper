# Template structure

*version: tm-0.1*

A template includes the following data:

* side: Either "pc" for teams, or "enemy" for encounter templates.
* maxId: Used to simplify the generation of IDs for creatures.
* version: Identifies the version of the JSON structure.
* templateName: The name of the encounter template or team.
* attacks: An array of attack objects
* creatures: An array of creature objects

Attacks include the following data:

**Note**: In the current version, numerical values are stored as strings in an attack object.

* id: A unique ID for the attack.
* hit: To hit modifier.
* name: Name of the attack.
* note: Unused.
* type: Abbreviated version of the damage type. Only one type is supported.
* class: "Melee" or "Ranged". Not used.
* range: Attack range in feet. Not used.
* damage: Damage dice and modifier.
* creature: ID of the creature that owns the attack.
* attacknotes: Free text field to enter notes about the attack. Displayed when the attack is selected.

Creatures include the following data:

* id: Creature ID
* hp: Hit points
* rp: Resolve points
* sp: Stamina points
* eac: Energy AC
* kac: Kinetic AC
* ref: Reflex save
* fort: Fortitude save
* will: Will save
* init: Initiative modifier
* name: Name of the creature.
* quantity: How many of this creature are in the encounter.
* creaturenotes: Free text field to enter notes about the creature.
* moves: An array of movement objects. Each with a type and speed.


## Example JSON

    {
        "side": "enemy",
        "maxId": 1,
        "version": "tm-0.1",
        "templateName": "Template name",
        "attacks": [
            {
                "id": "abc12",
                "hit": "5",
                "name": "Scratch",
                "note": "",
                "type": "A/C/E/F/So/B/P/S",
                "class": "Melee/Ranged",
                "range": "5",
                "damage": "1d6",
                "creature": "e1",
                "attacknotes": ""
            }
        ],
        "creatures": [
            {
                "hp": 10,
                "id": "e1",
                "rp": 0,
                "sp": 0,
                "eac": 10,
                "kac": 10,
                "ref": 2,
                "fort": 2,
                "init": 2,
                "name": "Creature Name",
                "will": 0,
                "moves": [
                    {
                        "type": "land",
                        "speed": 30
                    }
                ],
                "quantity": 1,
                "creaturenotes": ""
            }
        ]
    }
# Encounter structure

*version: en-0.2*

An encounter includes the following data:

* version: Identifies the version of the JSON structure.
* Settings: An object to store encounter settings.
* stats: An array of stat table objects.
* rounds: An array of round objects.
* attacks: An array of attacks. Copied from the template, and identical to the structure described in [Template structure](./template_structure.md).
* creatures: An array of creatures. Copied from the template, and identical to the structure described in [Template structure](./template_structure.md).

A stat table object includes the following data:

* id: The creature's ID. Unique in the encounter.
* hp: Current hit points of the creature.
* sp: Current stamina points of the creature.
* rp: Current resolve points of the creature.
* eac: Energy AC
* kac: Kinetic AC
* ref: Creature reference. Used to cover situations when there are multiple creatures of the same type.
* init: Current initiative in the encounter.
* type: "pc" or "enemy"
* creaturenotes: Free text field to add notes about the creature.

## Rounds

Rounds are stored in an array. 

Each round is itself an array, with an entry for each "actor" - each creature in the encounter, both PCs and enemies.

For each creature in each round, there is an array of action objects. The main component of each action is the description.

## Example JSON

    {
        "version": "en-0.2",
        "settings": {
            "platform": "paizo-forum",
            "modMethod": "keyboard"
        },
        "stats": [
            {
                "hp": 10,
                "id": "e1-1",
                "rp": 0,
                "sp": 0,
                "eac": 10,
                "kac": 10,
                "ref": "e1",
                "init": 5,
                "name": "Enemy name",
                "type": "enemy",
                "creaturenotes": ""
            },
            {
                "hp": 10,
                "id": "pc1",
                "rp": 10,
                "sp": 5,
                "eac": 10,
                "kac": 10,
                "ref": "pc1",
                "init": 5,
                "name": "PC name",
                "type": "pc",
                "creaturenotes": ""
            }
        ],
        "rounds": [
            {
                "num": 1,
                "actors": [
                    {
                        "id": "e1-1",
                        "init": 2,
                        "name": "Enemy name",
                        "action": [
                            {
                                "desc": "Some action",
                                "type": "",
                                "result": null
                            }
                        ]
                    },
                    {
                        "id": "pc1",
                        "init": 1,
                        "name": "PC name",
                        "action": [
                            {
                                "desc": "PC's action",
                                "type": "",
                                "result": null
                            },
                            {
                                "desc": "Gun==(Enemy name|e1-1)==1d20+4==1d8 P==",
                                "type": "",
                                "result": null
                            }
                        ]
                    }
                ]
            }
        ],
        "attacks": [
            {
                "id": "8um88",
                "hit": "4",
                "name": "Gun",
                "note": "",
                "type": "P",
                "class": "Ranged",
                "range": "30",
                "damage": "1d8",
                "creature": "pc1",
                "attacknotes": ""
            },
            {
                "id": "6xsn4",
                "hit": "4",
                "name": "Scratch",
                "note": "",
                "type": "S",
                "class": "Melee",
                "range": "5",
                "damage": "1d6",
                "creature": "e1",
                "attacknotes": ""
            }
        ],
        "creatures": [
            {
                "hp": 10,
                "id": "pc1",
                "rp": 10,
                "sp": 5,
                "eac": 10,
                "kac": 10,
                "ref": 5,
                "fort": 5,
                "init": 5,
                "name": "PC name",
                "will": 5,
                "moves": [
                    {
                        "type": "land",
                        "speed": 30
                    }
                ],
                "quantity": 1,
                "creaturenotes": ""
            },
            {
                "hp": 10,
                "id": "e1",
                "rp": 0,
                "sp": 0,
                "eac": 10,
                "kac": 10,
                "ref": 5,
                "fort": 5,
                "init": 5,
                "name": "Enemy name",
                "will": 5,
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
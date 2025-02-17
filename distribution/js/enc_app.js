Vue.createApp({
    data() {
        return{
            encounterId: "",            // The public ID of the loaded encounter
            loading: false,             // True while loading
            loaded: false,              // True when loading complete
            error: false,               // True if there's an error
            errorMessage: "",           // Error message to display
            encounter: {},              // The main JSON
            actionID: "",               // Stores the ID when an action is edited
            noteID: "",                 // Stores the ID when a note is edited
            lastHighlighted: null,      // Stores the ID of the table cell currently highlighted
            creatureInfoID: "",         // ID of the last creature whose info was displayed in the modal
            sep: "==",                  // Seperator for encoded actions
            targetVar: ":target:",      // Variable for the target - to be replaced
            eacList: ['A', 'C', 'E', 'F', 'So'],    // List of energy damage
            kacList: ['B', 'P', 'S'],               // List of kinetic damage
            unsaved: false,             // Set to true when things change and false after a save
            enteringAttack: true,
            definingNewAttack: false,
            displayAttackNotes: true,
            attackNotesToDisplay: "No notes",
            filteredAttacks: []         // Attacks thats belong to the currently selected creature
        }
    },
    mounted () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        this.encounterId = urlParams.get('enc');

        // Load an encounter if 
        if (this.encounterId === null){
            this.error = true;
            this.errorMessage = "No encounter specified";
        } else {
            this.loading = true;

            fetch('./api/encounter.php?enc='+this.encounterId)
            .then(response => response.json())
            .then(data => this.encounter = data)
            .then(this.PostDataLoad);

            //.then(response => response.json())
            //.then(data => this.PostDataLoad(data));
        }
    },
    methods:{
        PostDataLoad(){                             // Called after data load
            this.ReorderForInitiative(this.encounter.stats);

            this.loading = false;
            this.loaded = true;
        },
        GenerateRandomID(reviewBlock){              // Generates a 5 digit ID unique to the array
            let uniqueId = false;
            let candidate = "";
            do {
                let l = "abcdefghijklmnopqrstuvwxyz1234567890";
                
                for(let i=0; i<5; i++){
                    candidate += l[Math.floor(Math.random() * l.length)];
                }

                // Check not in use
                uniqueId = true;
                for (let i=0; i<reviewBlock.length; i++){
                    if (candidate == reviewBlock[i].id) uniqueId = false;
                }

            } while (!uniqueId);

            return(candidate);
        },
        CopyToClipboard(str){                       // Copies text directly to clipboard
            navigator.clipboard.writeText(str);
        },
        isJsonString(str) {                         // Tests whether string is JSON
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        },
        ReorderForInitiative(characterArray){       // Reorders objects that include an init property
            characterArray.sort(function(a, b){
                return b.init - a.init;             // Descending
            });
        },
        AddModifierSign(number){                    // Converts number to string: +n or -n
            if (number>=0){
                return "+" + number;
            }
            else {
                return "" + number;
            }
        },
        EncodedTargetToID(target){                  // Extracts ID from a "(name|ID)" string
            targetID = "";
            if (target.indexOf("|")>-1){
                targetID = target.substring( target.indexOf("|")+1 );
                targetID = targetID.substring( 0, targetID.length-1 );
            }
            return targetID;
        },
        AttackFieldsToEncodedString(){              // "attack_name" + this.sep + ":target:" + this.sep + "1d20+x" + this.sep + "1dy+z type" + this.sep
            let encodedString = "";
            if ($('#actionSelector').text() == "New"){                          // New attack. Use new name.
                encodedString += $('#newAttackName').val() + this.sep;
            }
            if ($('#actionSelector').text().indexOf("Choose an attack")>-1){    // Attack without name selection
                encodedString += "Attack" + this.sep;
            }
            else{                                                               // Attack with selection
                encodedString += $('#actionSelector').text() + this.sep;
            } 
            encodedString += $('#attackTarget').val() + this.sep;
            encodedString += $('#attackHit').val() + this.sep;
            encodedString += $('#attackDamage').val() + " " + $('#attackType').val() + this.sep;

            return encodedString;
        },
        GetRollText(mod, type){                     // Format a D20 roll

            if (this.encounter.settings.platform == "paizo-forum"){
                return "[dice=" + type + "]1d20" + this.AddModifierSign(mod) + "[/dice] ";
            } else {
                return "[1d20" + this.AddModifierSign(mod) + " " + type + "]";
            }
        },
        OpenJsonModal(e){                           // Opens the modal to modify the JSON
            // Add the current JSON to the text area
            $('#jsonTextArea').val(JSON.stringify(this.encounter, null, 4));

            // Ensure error message is hidden
            $('#jsonErrorMessage').addClass("invisible");

            $('#jsonModal').modal('show');
        },
        CancelJsonModal(){                          // Cancels the JSON modal
            $('#jsonModal').modal('hide');
        },
        SaveJsonModal(){                            // Saves changes made in the JSON modal, if valid JSON
            // Check if still valid JSON
            if (this.isJsonString( $('#jsonTextArea').val() )){

                // Convert to JSON
                let newjson = JSON.parse( $('#jsonTextArea').val() );
                this.encounter = newjson;

                // Note unsaved data
                this.unsaved = true;

                //Close the modal
                $('#jsonModal').modal('hide');
            }
            else{
                // JSON error
                $('#jsonErrorMessage').removeClass("invisible");
            }
        },
        OpenCreatureModal(e){                       // Opens and initialises the creature info modal

            //let nameID = e.target.id;
            let nameID = e.target.dataset.ref;
            let parts = nameID.split("-");
            let idNum = Number(parts[1]);

            // Set title
            $('#creatureModalTitle').html(this.encounter.stats[idNum].name);

            // Set notes
            if (this.encounter.stats[idNum].creaturenotes){
                $('#creatureModalNotes').html(this.encounter.stats[idNum].creaturenotes);
            }

            // Get other stats
            let creatureID = this.encounter.stats[idNum].id;
            if (creatureID.indexOf("-")){
                creatureID = creatureID.split("-")[0];
            }
            let creature = this.GetCreature(creatureID);

            // Store the ID
            this.creatureInfoID = creatureID;

            // Display the reflex scores
            $('#creatureFort').html(creature.fort);
            $('#creatureRef').html(creature.ref);
            $('#creatureWill').html(creature.will);

            $('#creatureModal').modal('show');
        },
        CopySave(saveType){                         // Copy a save string to scratch pad (and clipboard)

            // Is there a saved ID?
            if (this.creatureInfoID != ""){

                let creature = this.GetCreature(this.creatureInfoID);
                let rollText = "";

                switch(saveType){
                    case "fort":
                        rollText = this.GetRollText(creature.fort, "Fortitude save");
                        break;
                    case "ref":
                        rollText = this.GetRollText(creature.ref, "Reflex save");
                        break;
                    case "will":
                        rollText = this.GetRollText(creature.will, "Will save");
                        break;
                }
                document.getElementById('scratchpadTextArea').value += rollText + "\n"
                this.CopyToClipboard(rollText);
            }
        },
        CloseInfoModal(){
            $('#creatureModal').modal('hide');
        },
        SetPlatformDropdown(){
            if (this.encounter.settings.platform == "paizo-forum"){
                $('#platformSelector').text("Paizo forum");
            } else {
                $('#platformSelector').text("Discord (Sage)");
            }
        },
        OpenConfigModal(e){                           // Opens the modal to modify config settings
            
            // Set UI based on setting values
            this.SetPlatformDropdown();

            $('#configModal').modal('show');
        },
        CloseConfigModal(){                          // Closes the config settings modal
            $('#configModal').modal('hide');
        },
        SelectPlatform(e){
            // Note unsaved data
            this.unsaved = true;

            this.encounter.settings.platform = e.target.id;

            console.log(e.target.id);

            this.SetPlatformDropdown();
        },
        AttackStringToParts(attackString){
            let baseParts = attackString.split(this.sep);
            let attackParts = {};

            attackParts.name = baseParts[0];
            attackParts.target = baseParts[1];

            // hit modifier
            if (baseParts[2].indexOf("+") > -1){
                attackParts.hitMod = baseParts[2].substring( baseParts[2].indexOf("+")+1 ); // Positive modifier
                attackParts.rolledHit = null;
            }
            else if (baseParts[2].indexOf("-") > -1){
                attackParts.hitMod = baseParts[2].substring( baseParts[2].indexOf("-") ); // Negative modifier (include the minus)
                attackParts.rolledHit = null;
            }
            else{
                // Could just be a number
                attackParts.rolledHit = baseParts[2];
            }

            // Damage
            attackParts.damage = baseParts[3].substring(0, baseParts[3].indexOf(" "));
            attackParts.type = baseParts[3].substring(baseParts[3].indexOf(" ")+1);

            return attackParts
        },
        BuildFilteredAttackList(cref){

            console.log("before: " + cref);

            // Check if one of a group of creatures
            let parts = cref.split("-");
            console.log(parts);
            if (parts.length == 2){
                cref = parts[0];
            }

            this.filteredAttacks = [];

            // Search for attacks owner by the supplied creature
            for (let i=0; i<this.encounter.attacks.length; i++){

                if (cref == this.encounter.attacks[i].creature){

                    this.filteredAttacks.push(this.encounter.attacks[i]);
                }
            }
        },
        OpenActionModal(e){                         // Opens the modal to add an action
            this.actionID = e.target.id;
            let parts = this.actionID.split("-");

            let actions = this.encounter.rounds[parts[1]-1].actors[parts[2]].action;
            let actionString = actions[parts[3]].desc;

            console.log(actionString);

            this.BuildFilteredAttackList(this.encounter.rounds[parts[1]-1].actors[parts[2]].id);
            
            // Hide the new attack name field
            this.definingNewAttack = false;

            // Hide the attack notes
            this.displayAttackNotes = false;

            // Is the action an attack?
            if (this.IsValidAttack(actionString)){

                this.enteringAttack = true;
                $('#attackToggle').prop('checked', true);

                // Convert the string to parts
                let attackParts = this.AttackStringToParts(actionString);

                // Set name  of the attack in the dropdown
                $('#actionSelector').text(attackParts.name);

                $('#attackTarget').val(attackParts.target);

                // Modifier (1d20+x) or rolled number
                if (attackParts.rolledHit != null){
                    $('#attackHit').val(attackParts.rolledHit);
                } else {
                    $('#attackHit').val("1d20" + this.AddModifierSign(attackParts.hitMod));
                }
                $('#attackDamage').val(attackParts.damage);
                $('#attackType').val(attackParts.type);                
            }
            else {
                this.enteringAttack = false;
                $('#attackToggle').prop('checked', false);

                $('#actionText').val(actionString);
            }

            $('#actionModal').modal('show');
        },
        CancelActionModal(){                        // Cancels (closes without saving) the action modal
            $('#actionModal').modal('hide');
        },
        ToggleAttackEntry(e){                       // Toggles UI between entering an attack and generic action
            this.enteringAttack = e.target.checked;
        },
        GetStatRefFromID(id){                       // Retrieves the stat JSON section for a given ID
            for (let i=0; i< this.encounter.stats.length; i++){
                if (this.encounter.stats[i].id == id){
                    return this.encounter.stats[i];
                }
            }
            return null;
        },
        ApplyDamage(targetObj, dmg, type){

            if (!isNaN(Number(dmg))){
                dmg = Number(dmg);

                // TODO: damage resistance and weakness?

                // Reduce stamina first
                targetObj.sp -= dmg;

                // If SP below zero, apply to HP
                if (targetObj.sp < 0){
                    targetObj.hp += targetObj.sp;   // Add the negative SP
                    targetObj.sp = 0;
                }

                // HP never goes negative
                if (targetObj.sp < 0) targetObj.sp = 0;
            }
        },
        CheckResult(attack){                        // Set a result based a to-hit roll
            let result = "";
            let parts = attack.split(this.sep);

            let target = parts[1];
            let hitRoll = parts[2];

            console.log("Targetting " + target + " with " + hitRoll);

            // Only process a result if the hit roll is a number
            if (!isNaN(Number(hitRoll))){
                
                let hitRollNum = Number(hitRoll);

                // Damage (duplicated)
                let dmg = parts[3].substring(0, parts[3].indexOf(" "));
                let type = parts[3].substring(parts[3].indexOf(" ")+1);

                // Is there a valid target?
                if (target.indexOf("|")>-1){
                    let targetID = target.substring( target.indexOf("|")+1 );
                    targetID = targetID.substring( 0, targetID.length-1 );

                    console.log("Target ID: " + targetID);

                    // Get ref to target
                    targetObj = this.GetStatRefFromID(targetID);

                    if (targetObj != null){

                        console.log("Not null target");

                        if (this.eacList.includes(type)){
                            if (hitRollNum>=targetObj.eac){
                                result = "hit";

                                this.ApplyDamage(targetObj, dmg, type);
                            }
                            else{
                                result = "miss";
                            }
                        }
                        else if (this.kacList.includes(type)){
                            if (hitRollNum>=targetObj.kac){
                                result = "hit";

                                this.ApplyDamage(targetObj, dmg, type);
                            }
                            else{
                                result = "miss";
                            }
                        }

                    } else {
                        console.log("No matching target");
                    }
                }

            }
            console.log("Result " + result);

            return result;
        },
        SaveActionModal(){                          // Saves the action

            if (this.editID != ""){

                let parts = this.actionID.split("-");

                // Entering an attack?
                if ($('#attackToggle').is(':checked')){

                    console.log("attack toggle");

                    let actionString = this.AttackFieldsToEncodedString();

                    console.log(actionString);

                    //Update action string
                    this.encounter.rounds[parts[1]-1].actors[parts[2]].action[parts[3]].desc = actionString;

                    // Determine a result - hit / miss / etc. TODO: only if no current result
                    if (this.IsValidAttack(actionString)){
                        this.encounter.rounds[parts[1]-1].actors[parts[2]].action[parts[3]].result = this.CheckResult(actionString);
                    }

                    // Save if new attack
                    if (this.definingNewAttack){
                        this.CreateAttack(actionString);
                    }
                }
                else {
                    console.log("Not attack toggle");

                    // Generic action
                    this.encounter.rounds[parts[1]-1].actors[parts[2]].action[parts[3]].desc = $('#actionText').val();
                }

                // Note unsaved data
                this.unsaved = true;
            }

            $('#actionModal').modal('hide');
        },
        AddActionForCreature(e){                    // Adds another action for the creature in chosen round
            let parts = e.target.id.split("-");

            let actionObj = {};
            actionObj.desc = "";
            actionObj.type = "";
            actionObj.result = null;

            this.encounter.rounds[parts[1]-1].actors[parts[2]].action.push(actionObj);
        },
        RemoveAction(){                             // Request to remove action
            if (this.editID != ""){

                let parts = this.actionID.split("-");

                this.encounter.rounds[parts[1]-1].actors[parts[2]].action.splice(parts[3],1);

                $('#actionModal').modal('hide');
            }
        },
        FormatAttackObject(obj){                    // Formats an attack obj from JSON into a string

            // name==target==1d20+hit==damage type==

            let attstr = "";
            
            attstr += obj.name + this.sep;
            attstr += this.targetVar + this.sep;
            attstr += "1d20" + this.AddModifierSign(obj.hit) + this.sep;
            attstr += obj.damage + " " + obj.type + this.sep;

            return attstr;
        },
        SelectAttack(e){                            // Handles dropdown selection
            let attackID = e.target.id;
            let attackParts = attackID.split("-");
            let attackInfo = this.filteredAttacks[ attackParts[1] ];  // Use filtered list of character attacks

            $('#attackHit').val("1d20" + this.AddModifierSign(attackInfo.hit));
            $('#attackDamage').val(attackInfo.damage);
            $('#attackType').val(attackInfo.type);

            $('#actionSelector').text(attackInfo.name);

            // Display note, if there is one for this attack
            if (attackInfo.attacknotes){
                this.displayAttackNotes = true;
                this.attackNotesToDisplay = attackInfo.attacknotes;
            }
            else{
                // Hide attack notes
                this.displayAttackNotes = false;
            }

            this.definingNewAttack = false;
        },
        DefineNewAttack(){

            // Clear all fields
            $('#attackTarget').val("");
            $('#attackHit').val("");
            $('#attackDamage').val("");
            $('#attackType').val("");

            // Set drop down
            $('#actionSelector').text("New");

            this.definingNewAttack = true;
            this.displayAttackNotes = false;
        },
        LookupCreatureName(creatureID){             // Uses a creature ID to look up its name

            let cBlock = this.GetStatRefFromID(creatureID);
            if (cBlock === null) return "";
            else return cBlock.name;
        },
        GetCreature(creatureRef){                   // Searches the creature section for a matching ref
            for(let i=0; i<this.encounter.creatures.length; i++){
                if (this.encounter.creatures[i].id == creatureRef){
                    return this.encounter.creatures[i];
                }
            }
            return null;
        },
        CheckIfActed(creatureRef, roundRef){
            for(let i=0; i<this.encounter.rounds[roundRef].actors.length; i++){
                if (this.encounter.rounds[roundRef].actors[i].id == creatureRef){

                    if (this.encounter.rounds[roundRef].actors[i].action == ""){    // Is the action empty?
                        return false;
                    }
                    else{
                        return true;
                    }
                }
            }
            return false;
        },
        AddTarget(e){                               // Adds target to field

            let creatureID = e.target.id;
            let longName = this.LookupCreatureName(creatureID);
            let targetString = "(" + longName + "|" + creatureID + ")";
            $('#attackTarget').val(targetString);
        },
        IsValidAttack(action){                      // Check to see if the attack is formatted correctly

            let before = action.length;
            action = action.replaceAll(this.sep, "");
            let after = action.length;

            //console.log("Validity check: " + (before-after) + " vs " + (this.sep.length * 4) );

            if ( (before-after) == (this.sep.length * 4) ){ // Are there 4 separators in the string?
                return true;
            }
            else {
                return false;
            }
        },
        AttackToObj(action, attacker_id){                        // Converts a formatted attack string to an attack object

            let valid = true;
            let attackParts = this.AttackStringToParts(action);

            if (attackParts.name.length == 0) valid = false;

            // Validation??
            if (valid){
                let newAttack = {};

                newAttack.name = attackParts.name;
                if (isNaN(Number(attackParts.hitMod))){
                    newAttack.hit = 0
                    console.log(hitMod + " is not a number");
                } else {
                    newAttack.hit = Number(attackParts.hitMod);
                }
                newAttack.damage = attackParts.damage;
                newAttack.type = attackParts.type;

                newAttack.creature = attacker_id;
                newAttack.uses = -1;
                newAttack.class = "unknown";
                newAttack.note = "";

                return newAttack;
            }
            else{
                throw new Error('Not a valid structure.');
            }
            
        },
        CreateAttack(action){                               // Handler to save an attack

            if (this.IsValidAttack(action)){

                try{
                    let parts = this.actionID.split("-");
                    let creature_id = this.encounter.rounds[parts[1]-1].actors[parts[2]].id;

                    let newAttack = this.AttackToObj(action, creature_id);
                    newAttack.id = this.GenerateRandomID(this.encounter.attacks);
    
                    this.encounter.attacks.push(newAttack);

                    // Note unsaved data
                    this.unsaved = true;
    
                } catch(e){
                    // Something went wrong with the substrings
                    console.log(e);
                }
            }
            else {
                // Notify that invalid
                console.log("Not a valid attack");
            }
        },
        ReformatAttack(attackText, attacker, attacker_id){       // Reformat an attack string to be used in an PbP app

            let attObj = this.AttackToObj(attackText, attacker_id);
            let reformed = "";
            let target = attackText.substring( attackText.indexOf("(")+1, attackText.indexOf("|"))

            // From: attack_name:[vs :target:][1d20+x][1dy+z type]
            // To: <attacker> vs <target> [1d20+x <attack_name>] [1dy+z type] 

            reformed += attacker + " vs " + target;
            reformed += " [1d20" + this.AddModifierSign(attObj.hit) + " " + attObj.name + "] "
            reformed += "[" + attObj.damage + " " + attObj.type + "]";
            
            return reformed;
        },
        ReformatAttackForForum(attackText, attacker, attacker_id){       // Reformat an attack string to be used on the Paizo forums

            let attObj = this.AttackToObj(attackText, attacker_id);
            let reformed = "";
            let target = attackText.substring( attackText.indexOf("(")+1, attackText.indexOf("|"))

            // From: attack_name:[vs :target:][1d20+x][1dy+z type]
            // To: <attacker> vs <target> [dice=<attack_name>]1d20+x[/dice]] [dice=<type>]1dy+z[/dice]] 

            reformed += attacker + " vs " + target;
            reformed += " [dice=" + attObj.name + "]1d20" + this.AddModifierSign(attObj.hit) + "[/dice] "
            reformed += "[dice=" + attObj.type + "]" + attObj.damage + "[/dice]";
            
            return reformed;
        },
        ReformatAttackForDiscordSage(attackText, attacker, attacker_id){       // Reformat an attack string to be used on Discord (Sage)

            let attObj = this.AttackToObj(attackText, attacker_id);
            let reformed = "";
            let target = attackText.substring( attackText.indexOf("(")+1, attackText.indexOf("|"))

            // From: attack_name:[vs :target:][1d20+x][1dy+z type]
            // To: attacker vs target [1d20 >= 15 attack; 1d8 damage]

            reformed += attacker + " vs " + target + " ";
            reformed += "[1d20" + this.AddModifierSign(attObj.hit) + " " + attObj.name + "; ";
            reformed += attObj.damage + " " + attObj.type + "]";
            
            return reformed;
        },
        NumRoller(e){                               // Handles selection of a number for modification             
            let numID = e.target.dataset.ref;
            let selected = e.target;

            if (numID){ // Only proceed if a UI element with a ref data attribute is selected

                // Click on same cell to deselect
                if (this.lastHighlighted == selected){

                    let numName = selected.dataset.ref.substring(0, selected.dataset.ref.indexOf("-"));
                    
                    //$("#"+this.lastHighlighted).removeClass("cell-highlight");
                    this.lastHighlighted.classList.remove("cell-highlight");
                    this.lastHighlighted = null;

                    // TODO: reorder the correct table; use flag, move to end of funciton, and remove duplication
                    if (numName == "init") this.ReorderForInitiative(this.encounter.stats);
                    else if (numName.indexOf("init")>-1){
                        roundNum = Number(numName.substring(1, numName.indexOf("init"))) - 1;
                        this.ReorderForInitiative(this.encounter.rounds[roundNum].actors);
                    }

                } else {

                    // Deselect to switch selection
                    if (this.lastHighlighted != null){

                        let numName = this.lastHighlighted.dataset.ref.substring(0, this.lastHighlighted.dataset.ref.indexOf("-"));

                        //$("#"+this.lastHighlighted).removeClass("cell-highlight");
                        this.lastHighlighted.classList.remove("cell-highlight");

                        if (numName == "init") this.ReorderForInitiative(this.encounter.stats);
                        else if (numName.indexOf("init")>-1){
                            roundNum = Number(numName.substring(1, numName.indexOf("init"))) - 1;
                            this.ReorderForInitiative(this.encounter.rounds[roundNum].actors);
                        }
                    }

                    // New selection
                    //$("#"+numID).addClass("cell-highlight");
                    e.target.classList.add("cell-highlight");
                    this.lastHighlighted = selected;
                }
            }
        },
        ScrollNumber(e){                            // Handles incrememnt / decrement of selected number
            if (this.lastHighlighted != null){

                let key = e.key;

                // Key presses
                if (key=="+" || key=="-"){

                    let jsonBlock = null;
                    let param = "";

                    let numName = this.lastHighlighted.dataset.ref.substring(0, this.lastHighlighted.dataset.ref.indexOf("-"));
                    let numIndex = Number(this.lastHighlighted.dataset.ref.substring(numName.length+1));
                    
                    // Choosing the right section
                    if (numName == "init"){
                        jsonBlock = this.encounter.stats;
                        param = "init";
                    }
                    else if (numName.indexOf("init")>-1){
                        param = "init";

                        roundNum = Number(numName.substring(1, numName.indexOf("init"))) - 1;
                        jsonBlock = this.encounter.rounds[roundNum].actors;
                    }
                    else {
                        jsonBlock = this.encounter.stats;
                        param = numName;
                    }

                    // Adjust the selected value
                    if (key=="+"){
                        jsonBlock[numIndex][param] += 1;
                    }
                    else{
                        jsonBlock[numIndex][param] -= 1;
                    }

                    // Note unsaved data
                    this.unsaved = true;

                    //if (numName == "init") this.ReorderForInitiative(this.encounter.stats);
                    // Would be better here, but need to update the highlighted cell on change
                }
            }
        },
        EditNote(e){
            this.noteID = e.target.dataset.ref;
            let parts = this.noteID.split("-");

            $('#noteTextArea').val(this.encounter.stats[parts[1]].notes);

            $('#noteModal').modal('show');
        },
        CancelNoteModal(){
            $('#noteModal').modal('hide');
        },
        SaveNoteModal(){

            let parts = this.noteID.split("-");
            this.encounter.stats[parts[1]].notes =  $('#noteTextArea').val();

            $('#noteModal').modal('hide');

            this.noteID = "";

            // Note unsaved data
            this.unsaved = true;
        },
        AddNewRound(){                              // Adds a new round

            let round = {};

            round.num = this.encounter.rounds.length + 1;

            round.actors = [];

            // Loop over the stats to add actors
            for (let i=0; i<this.encounter.stats.length; i++){

                actor = {};
                actor.id = this.encounter.stats[i].id;
                actor.init = this.encounter.stats[i].init;
                actor.name = this.encounter.stats[i].name;

                actor.action = [];
                let actionObj = {};
                actionObj.desc = "";
                actionObj.type = "";
                actionObj.result = null;
                actor.action.push(actionObj);

                // Don't add actor if initiative is zero
                if (actor.init>0) round.actors.push(actor);
            }

            // Add the round
            this.encounter.rounds.push(round);

            // Note unsaved data
            this.unsaved = true;
        },
        OpenScratchpadModal(){                      // Opens the scratchpad modal
            $('#scratchpadModal').modal('show');
        },
        CloseScratchpadModal(){                     // Closes the scratchpad
            $('#scratchpadModal').modal('hide');
        },
        ScratchpadRemoveLinebreaks(){               // Remove line breaks

            let text = document.getElementById('scratchpadTextArea').value;

            text = text.replace(/(\r\n|\n|\r)/gm, " ");

            document.getElementById('scratchpadTextArea').value = text;
        },
        CopyActionToScratchpad(e){                  // Copies an action to the scratchpad
            let actionID = e.target.id;
            let parts = actionID.split("-");

            let actionText = this.encounter.rounds[parts[1]-1].actors[parts[2]].action[parts[3]].desc;
            let attacker = this.encounter.rounds[parts[1]-1].actors[parts[2]].name;
            let attacker_id = this.encounter.rounds[parts[1]-1].actors[parts[2]].id;

            if ( this.IsValidAttack(actionText) ){

                //actionText = this.ReformatAttack(actionText, attacker, attacker_id);
                if (this.encounter.settings.platform == "paizo-forum"){
                    actionText = this.ReformatAttackForForum(actionText, attacker, attacker_id);
                } else {
                    actionText = this.ReformatAttackForDiscordSage(actionText, attacker, attacker_id);
                }
            }

            document.getElementById('scratchpadTextArea').value += actionText + "\n"
            this.CopyToClipboard(actionText);
        },
        FormatStatLineForum(isTheirTurn, stats, creature){

            statline = "";

            // Formatting in block
            if (isTheirTurn) statline += "➤ ";

            statline += "(" + stats.init +") ";

            if (isTheirTurn){
                statline += "[b]" + stats.name + "[/b] ";
            }
            else {
                statline += stats.name + " ";
            }

            // Display creature and pc differently
            if (creature.sp == 0){

                statline += "[HP: " + (stats.hp - creature.hp) + "]";
            }
            else {

                statline += "[SP: " + stats.sp + "/" + creature.sp + "] ";
                statline += "[HP: " + stats.hp + "/" + creature.hp + "] ";
                statline += "[RP: " + stats.rp + "/" + creature.rp + "] ";
            }

            // Add notes, if any
            if (typeof stats.notes == 'undefined') stats.notes = "";
            if (stats.notes != "") statline += "- " + stats.notes;

            return statline + "\n";
        },
        PadToCharsL(text, width){
            text = "" + text;
            let pad = width - text.length;
            for (let i=pad; i>0; i--){
                text = " " + text;
            }
            return text;
        },
        PadToCharsR(text, width){
            text = "" + text;
            let pad = width - text.length;
            for (let i=pad; i>0; i--){
                text = text + " ";
            }
            return text;
        },
        FillChars(char, count){
            text = "";
            for (let i=0; i<=count; i++){
                text = text + char;
            }
            return text;
        },
        FormatStatLineDiscordSage(isTheirTurn, stats, creature, namePad){

            statline = "";

            let init = "" + stats.init;
            if (isTheirTurn) init = ">" + init;
            statline += this.PadToCharsL(init, 4);

            statline += "  "; // Padding between initiative and name

            // Name
            statline += this.PadToCharsR(stats.name, namePad + 2);

            // Display creature and pc differently
            if (creature.sp == 0){

                statline += this.PadToCharsR("", 7);
                statline += this.PadToCharsL((stats.hp - creature.hp)+"  ", 7);
                statline += this.PadToCharsR("", 7);
            }
            else {

                statline += this.PadToCharsR(stats.sp + "/" + creature.sp, 7);
                statline += this.PadToCharsR(stats.hp + "/" + creature.hp, 7);
                statline += this.PadToCharsR(stats.rp + "/" + creature.rp, 7);
            }

            //statline += "  ";

            // Add notes, if any
            if (typeof stats.notes == 'undefined') stats.notes = "";
            if (stats.notes != "") {
                statline += "\n";
                statline += "      ∟ " + stats.notes;
            }
            return statline + "\n";
        },
        CopyStatBlockToScratchpad(){
            let fstat = "";
            let blockType = "";
            let inBlock = false;

            // pre loop to find longest name
            let maxNameLength = 0;
            for (let i=0; i<this.encounter.stats.length; i++){
                if (this.encounter.stats[i].name.length > maxNameLength){
                    maxNameLength = this.encounter.stats[i].name.length;
                }
            }

            // Format first line
            if (this.encounter.settings.platform == "paizo-forum"){
                fstat += "[b]Round " + this.encounter.rounds.length + "[/b] \n";
            } else {
                fstat += "**Round "+ this.encounter.rounds.length + "** \n";
                fstat += "`#-----" + this.FillChars("-", maxNameLength) + "------------------#\n";
                fstat += " In.  " + this.PadToCharsR("Name", maxNameLength) + "  SP     HP     RP\n";
            }

            // Loop over stats
            for (let i=0; i<this.encounter.stats.length; i++){

                let stats = this.encounter.stats[i];
                let acted = this.CheckIfActed(stats.id, this.encounter.rounds.length-1);

                if (stats.init > 0){ // Only include if initiative is above 0

                    if (!acted && blockType==""){   // Start an initiative block
                        inBlock = true;
                        blockType = stats.type;
                    }
                    else if (blockType != stats.type){   // Change of type = end of initiative block
                        inBlock = false;
                    }
    
                    // Lookup creature info (to find max HP etc.)
                    let creature = this.GetCreature(stats.ref);

                    // Format a stat line
                    if (this.encounter.settings.platform == "paizo-forum"){
                        fstat += this.FormatStatLineForum(inBlock, stats, creature);
                    } else {
                        fstat += this.FormatStatLineDiscordSage(inBlock, stats, creature, maxNameLength);
                    }

                }
            }

            // Format last line
            if (this.encounter.settings.platform == "paizo-forum"){
            } else {
                fstat += "#-----" + this.FillChars("-", maxNameLength) + "------------------#`";
            }

            document.getElementById('scratchpadTextArea').value += fstat + "\n"
            this.CopyToClipboard(fstat);
        },
        CopyInitiativeToScratchpad(){

            let ilist = "";

            // Loop over stats
            for (let i=0; i<this.encounter.stats.length; i++){

                // Lookup creature info for initiative
                let creature = this.GetCreature(this.encounter.stats[i].ref);

                // Format a stat line
                if (this.encounter.settings.platform == "paizo-forum"){
                    ilist += "[dice=Initiative " + creature.name + "]1d20" + this.AddModifierSign(creature.init) + "[/dice]\n";
                } else {
                    ilist += "[1d20" + this.AddModifierSign(creature.init) + " Initiative " + creature.name + "]\n";
                }
            }

            document.getElementById('scratchpadTextArea').value += ilist + "\n"
            this.CopyToClipboard(ilist);
        },
        CopyCreatureInfoToScratchpad(){

            // Are there any rounds?
            if (this.encounter.rounds.length > 0){
                this.CopyStatBlockToScratchpad();   // Copy stat block
            } 
            else {
                this.CopyInitiativeToScratchpad();  // Copy initiative
            }
        },
        ClearScratchpad(){                          // Clears the scratchpad
            document.getElementById('scratchpadTextArea').value = "";
        },
        SaveEncounter(){

            fetch('./api/save_encounter.php?enc='+this.encounterId, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(this.encounter)
            }).then(res => {
                console.log("Request complete! response:", res);

                // Changes saved
                this.unsaved = false;
            });
        }
    },
    created() {
        window.addEventListener('keydown', this.ScrollNumber)
    },
    destroyed() {
        window.removeEventListener('keydown', this.ScrollNumber)
    }
}).mount('#app')
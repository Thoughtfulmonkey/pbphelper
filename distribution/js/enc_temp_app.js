Vue.createApp({
    data() {
        return{
            encounterId: "",            // The public ID of the loaded encounter
            loading: false,             // True while loading
            loaded: false,              // True when loading complete
            error: false,               // True if there's an error
            errorMessage: "",           // Error message to display
            encounter: {},              // The main JSON
            creatureId: null,
            ownerId: -1,
            attackID: null,
            chosenClass: "",
            unsaved: false,             // True when there is unsaved data
            side: "",                   // "pc" or "enemy"
            importedCreature: {},       // Stores an imported creature, waiting for confirmation
            importedAttacks: []         // An array of imported attacks
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

            fetch('./api/template.php?enc='+this.encounterId)
            //fetch('./api/example_encounter_template.json?n=2')
            .then(response => response.json())
            .then(data => this.encounter = data)
            .then(this.PostDataLoad);

            //.then(response => response.json())
            //.then(data => this.PostDataLoad(data));
        }
    },
    methods:{
        PostDataLoad(){                             // Called after data load
            this.loading = false;
            this.loaded = true;

            this.side = this.encounter.side;        // Load whether PCs or enemies from the JSON
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
        isJsonString(str) {                         // Tests whether string is JSON
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        },
        LookUpCreatureId(creatureId){
            for (let i=0; i<this.encounter.creatures.length; i++){
                if (creatureId == this.encounter.creatures[i].id) return this.encounter.creatures[i].name;
            }
        },
        LookUpCreatureIndex(creatureId){
            for (let i=0; i<this.encounter.creatures.length; i++){
                if (creatureId == this.encounter.creatures[i].id) return i;
            }
        },
        NewCreature(){
            this.creatureId = null;

            $('#creatureName').val("");
            $('#creatureInit').val("");
            $('#creatureQuantity').val("");
            $('#creatureEac').val("");
            $('#creatureKac').val("");
            $('#creatureHp').val("");
            $('#creatureSp').val("");
            $('#creatureRp').val("");
            $('#creatureFort').val("");
            $('#creatureRef').val("");
            $('#creatureWill').val("");
            $('#creatureMoves').val("");
            $('#creatureNotes').val("");

            $('#creatureModal').modal('show');
        },
        EditCreature(e){
            this.creatureId = e.target.id;
            let parts = this.creatureId.split("-");

            let c = this.encounter.creatures[parts[2]];

            $('#creatureName').val(c.name);
            $('#creatureInit').val(c.init);
            $('#creatureQuantity').val(c.quantity);
            $('#creatureEac').val(c.eac);
            $('#creatureKac').val(c.kac);
            $('#creatureHp').val(c.hp);
            $('#creatureSp').val(c.sp);
            $('#creatureRp').val(c.rp);
            $('#creatureFort').val(c.fort);
            $('#creatureRef').val(c.ref);
            $('#creatureWill').val(c.will);
            $('#creatureNotes').val(c.creaturenotes);

            let moveset = "";
            for (let i=0; i<c.moves.length; i++){
                moveset += c.moves[i].type + ":" + c.moves[i].speed;
                if (i<c.moves.length-1) moveset += ";"
            }
            $('#creatureMoves').val(moveset);

            $('#creatureModal').modal('show');
        },
        CloseCreature(){
            $('#creatureModal').modal('hide');
        },
        SaveCreature(){

            let creatureBlockRef = null;

            if (this.creatureId === null){

                // Increment creature ID
                this.encounter.maxId += 1;

                creatureBlockRef = {};

                if (this.encounter.side == "enemy"){
                    creatureBlockRef.id = "e" + this.encounter.maxId;
                }
                else{
                    creatureBlockRef.id = "pc" + this.encounter.maxId;
                }
                
                creatureBlockRef.sp = 0;
                creatureBlockRef.rp = 0;

                this.encounter.creatures.push(creatureBlockRef);
            }
            else {
                let parts = this.creatureId.split("-");
                creatureBlockRef = this.encounter.creatures[parts[2]];
            }

            creatureBlockRef.name = $('#creatureName').val();
            creatureBlockRef.init = Number( $('#creatureInit').val() );
            creatureBlockRef.quantity = Number($('#creatureQuantity').val() );
            creatureBlockRef.eac = Number($('#creatureEac').val() );
            creatureBlockRef.kac = Number($('#creatureKac').val() );
            creatureBlockRef.hp = Number($('#creatureHp').val() );
            creatureBlockRef.sp = Number($('#creatureSp').val() );
            creatureBlockRef.rp = Number($('#creatureRp').val() );
            creatureBlockRef.fort = Number($('#creatureFort').val() );
            creatureBlockRef.ref = Number($('#creatureRef').val() );
            creatureBlockRef.will = Number($('#creatureWill').val() );

            creatureBlockRef.creaturenotes = $('#creatureNotes').val();

            let movesString = $('#creatureMoves').val();
            let moves = movesString.split(";")
            creatureBlockRef.moves = [];

            for (let i=0; i<moves.length; i++){
                let move = moves[i].split(":");
                let moveEntry = {};
                moveEntry.type = move[0];
                moveEntry.speed = Number(move[1]);
                creatureBlockRef.moves.push(moveEntry);
            }

            // Note unsaved date
            this.unsaved = true;

            $('#creatureModal').modal('hide');
        },
        NewAttack(){
            this.attackID = null;

            $('#ownerDropdown').text("Select a creature");

            $('#attackName').val("");

            $('classDropdown').val("Class");
            this.chosenClass = "";

            $('#attackRange').val("");
            $('#attackHit').val("");
            $('#classDropdown').text("Choose class");
            $('#attackDamage').val("");
            $('#attackType').val("");
            $('#attackNotes').val("");

            $('#attackModal').modal('show');
        },
        EditAttack(e){
            this.attackID = e.target.id;

            let parts = this.attackID.split("-");
            let a = this.encounter.attacks[parts[2]];

            let ownerName = this.LookUpCreatureId(a.creature);
            $('#ownerDropdown').text(ownerName);
            this.ownerId = a.creature;

            $('#attackName').val(a.name);

            $('classDropdown').text(a.class);
            this.chosenClass = a.class;

            $('#attackRange').val(a.range);
            $('#attackHit').val(a.hit);
            $('#attackDamage').val(a.damage);
            $('#attackType').val(a.type);
            $('#attackNotes').val(a.attacknotes);

            // Set dropdown text
            if (a.class="melee") $('#classDropdown').text("Melee");
            else $('#classDropdown').text("Ranged");

            $('#attackModal').modal('show');
        },
        CloseAttack(){
            $('#attackModal').modal('hide');
        },
        SaveAttack(){

            let attackBlockRef = null;

            if (this.attackID === null){

                attackBlockRef = {};

                attackBlockRef.id = this.GenerateRandomID(this.encounter.attacks);
                attackBlockRef.note = "";

                this.encounter.attacks.push(attackBlockRef);
            }
            else {
                let parts = this.attackID.split("-");
                attackBlockRef = this.encounter.attacks[parts[2]];
            }
            
            attackBlockRef.name = $('#attackName').val();
            attackBlockRef.class = this.chosenClass;
            attackBlockRef.range = $('#attackRange').val();
            attackBlockRef.hit = $('#attackHit').val();
            attackBlockRef.damage = $('#attackDamage').val();
            attackBlockRef.type = $('#attackType').val();
            attackBlockRef.attacknotes = $('#attackNotes').val();
            attackBlockRef.creature = this.ownerId;

            // Note unsaved date
            this.unsaved = true;

            $('#attackModal').modal('hide');
        },
        ChooseOwner(ownerIndex){
            this.ownerId = this.encounter.creatures[ownerIndex].id;
            $('#ownerDropdown').text(this.encounter.creatures[ownerIndex].name);
        },
        ChooseClass(chosenClass){
            $('classDropdown').val(chosenClass);
            this.chosenClass = chosenClass;

            // Update dropdown
            $('#classDropdown').text(chosenClass);
        },
        SaveTemplate(){
            fetch('./api/save_template.php?enc='+this.encounterId, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(this.encounter)
            }).then(res => {
                console.log("Request complete! response:", res);

                // Content now saved
                this.unsaved = false;
            });
        },
        OpenImportModal(){
            $('#importModal').modal('show');
        },
        CloseImportModal(){
            $('#importModal').modal('hide');
        },
        DisplayCreatureForConfirmation(c){

            let cText = "";

            cText += "Name: " + c.name + "\n";
            cText += "Initiative: " + c.init + "\n";
            cText += "EAC: " + c.eac + "\n";
            cText += "KAC: " + c.kac + "\n";
            cText += "HP: " + c.hp + "\n";
            cText += "SP: " + c.sp + "\n";
            cText += "RP: " + c.rp + "\n";
            cText += "Fortitude: " + c.fort + "\n";
            cText += "Reflex: " + c.ref + "\n";
            cText += "Will: " + c.will + "\n";
            
            $("#ImportTextArea").val(cText);
        },
        DisplayAttacksForConfirmation(atts){

            let text = $("#ImportTextArea").val();

            for (let i=0; i<atts.length; i++){

                text += "\n";
                text += "Attack: " + atts[i].name + ": ";
                text += "1d20+" + atts[i].hit + ": " + atts[i].damage + " (" + atts[i].type + ")";
            }

            $("#ImportTextArea").val(text);
        },
        ProcessImportedStats(importedjson){

            this.importedCreature = {};

            this.importedCreature.name = importedjson.name;
            this.importedCreature.init = importedjson.initiative.total;
            this.importedCreature.quantity = 1;
            this.importedCreature.eac = importedjson.armorClass.eac.total;
            this.importedCreature.kac = importedjson.armorClass.kac.total;
            this.importedCreature.hp = importedjson.vitals.health.max;
            this.importedCreature.sp = importedjson.vitals.stamina.max;
            this.importedCreature.rp = importedjson.vitals.resolve.max;
            this.importedCreature.fort = importedjson.saves.fortitude.total;
            this.importedCreature.ref = importedjson.saves.reflex.total;
            this.importedCreature.will = importedjson.saves.will.total;

            // Extract movement
            let moveTypes = Object.keys(importedjson.speed);
            this.importedCreature.moves = [];
            for (let i=0; i<moveTypes.length; i++){

                if (moveTypes[i] != "notes"){
                    let moveEntry = {};
                    moveEntry.type = moveTypes[i];
                    moveEntry.speed = importedjson.speed[moveTypes[i]];
                    this.importedCreature.moves.push(moveEntry);
                }
            }
        },
        ProcessImportedAttacks(importedjson){

            // Wipe any previously stored attacks
            this.importedAttacks = [];

            // Loop over inventory, looking for weapons
            for (let a=0; a<importedjson.inventory.length; a++){

                item = importedjson.inventory[a];

                // Is it a weapon?
                if (item.type == "Weapon"){

                    attack = {};

                    attack.name = item.name;
                    attack.hit = item.toHit;
                    attack.type = item.damage.damage[0];
                    attack.damage = item.damage.dice.count + "d" + item.damage.dice.sides + "+" + item.damageBonus;
                    attack.attacknotes = "";

                    if (item.range){
                        attack.class = "Ranged";
                        attack.range = item.range + "";
                    }
                    else {
                        attack.class = "Melee";
                        attack.range = "5";     // Doesn't take into account creature or weapon reach
                    }

                    this.importedAttacks.push(attack);
                }
            }
        },
        ProcessImport(importText){
            
            // Check if still valid JSON
            if (this.isJsonString( importText )){

                // Convert to JSON
                let importedjson = JSON.parse( importText );
                
                this.ProcessImportedStats(importedjson);
                this.ProcessImportedAttacks(importedjson);

                this.DisplayCreatureForConfirmation(this.importedCreature);
                this.DisplayAttacksForConfirmation(this.importedAttacks);
            }
            else{
                // JSON error
                
            }
        },
        ConfirmImport(){
            // Set ID
            this.encounter.maxId += 1;
            this.importedCreature.id = "pc" + this.encounter.maxId;

            // Set required but not imported parameters
            this.importedCreature.creaturenotes = "";

            // Add creature to data store
            this.encounter.creatures.push(this.importedCreature);

            // Update and add attacks
            for (let i=0; i<this.importedAttacks.length; i++){

                // Add creature ID
                this.importedAttacks[i].creature = this.importedCreature.id;

                // Set unique ID
                this.importedAttacks[i].id = this.GenerateRandomID(this.encounter.attacks);

                // Add to data store
                this.encounter.attacks.push(this.importedAttacks[i]);
            }

            // UI update
            $('#importModal').modal('hide');
            this.unsaved = true;
        },
        ImportFileRead(ev){
            this.ProcessImport(ev.target.result);
        },
        DragHighlight(){
            $("#drop_zone").addClass("drag_over");
        },
        RemoveDragHighlight(){
            $("#drop_zone").removeClass("drag_over");
        },
        LoadDroppedFile(ev){
            // Prevent default behaviour (display of the file)
            ev.preventDefault();

            // Remove CSS class
            $("#drop_zone").removeClass("drag_over");

            if (ev.dataTransfer.items) {

                // Use DataTransferItemList interface to access the file(s)
                [...ev.dataTransfer.items].forEach((item, i) => {

                    // If dropped items aren't files, reject them
                    if (item.kind === "file") {
                        const file = item.getAsFile();

                        reader = new FileReader();
                        reader.onload = this.ImportFileRead;
                        reader.readAsText(file);
                    }
                });
            } else {
                // Use DataTransfer interface to access the file(s)
                [...ev.dataTransfer.files].forEach((file, i) => {
                    // Probably the same as for items, but can't test
                });
            }
        }
    }
}).mount('#app')
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
            unsaved: false
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
            $('#creatureNotes').text("");

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
                creatureBlockRef.notes = [];

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
            //$('#attackNotes').text("");
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
            //$('#attackNotes').text(a.note);
            $('#attackNotes').val(a.note);

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
            //attackBlockRef.note = $('#attackNotes').text();
            attackBlockRef.note = $('#attackNotes').val();
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
        }
    }
}).mount('#app')
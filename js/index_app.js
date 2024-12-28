Vue.createApp({
    data() {
        return{
            loading: false,             // True while loading
            loaded: false,              // True when loading complete
            error: false,               // True if there's an error
            errorMessage: "",           // Error message to display
            listing: {},
            noTemplates: false,
            noTeams: false,
            noEncounters: false,
            chosenTemplate: null,
            chosenTeam: null,
            chosenEncounter: null,
            continuing: false
        }
    },
    mounted () {

        this.loading = true;

        fetch('./api/listing.php')
        .then(response => response.json())
        .then(data => this.PostDataLoad(data));
    },
    methods:{
        PostDataLoad(data){                             // Called after data load

            if (data.error){
                if (data.error == "Not logged in"){
                    window.location.href = "./login.html";
                }

            } else {                                    // No error - load the data

                this.listing = data;

                this.loading = false;
                this.loaded = true;

                if (this.listing.templates.length == 0) this.noTemplates = true;
                if (this.listing.teams.length == 0) this.noTeams = true;
                if (this.listing.encounters.length == 0) this.noEncounters = true;
            }
        },
        NewTemplate(){
            fetch('./api/new_template.php', {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: '{"name": "' + $('#newTemplateName').val() + '", "side": "enemy"}'  // Don't encode here, otherwise need double decode to access in PHP
            })
            .then(response => response.json())
            .then(data => this.TemplateLoaded(data));
        },
        TemplateLoaded(data){
            if (data.result == "success"){
                if (this.noTemplates) this.noTemplates = false;
                this.listing.templates.push(data);
                $('#newTemplateName').val("");
            }
            else{
                console.log(data.message);
            }
        },
        NewTeam(){
            fetch('./api/new_template.php', {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: '{"name": "' + $('#newTeamName').val() + '", "side": "pc"}'  // Don't encode here, otherwise need double decode to access in PHP
            })
            .then(response => response.json())
            .then(data => this.TeamLoaded(data));
        },
        TeamLoaded(data){
            if (data.result == "success"){
                if (this.noTeams) this.noTeams = false;
                this.listing.teams.push(data);
                $('#newTeamName').val("");
            }
            else{
                console.log(data.message);
            }
        },
        NewEncounter(){

            if (this.chosenEncounter === null) this.chosenEncounter = "";

            fetch('./api/new_encounter.php', {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: '{"template": "' + this.chosenTemplate + '", "team": "' + this.chosenTeam + '", "continueFrom": "' + this.chosenEncounter + '"}'  // Don't encode here, otherwise need double decode to access in PHP
            })
            //.then(response => this.EncounterCreated(response));
            .then(response => response.json())
            .then(data => this.EncounterCreated(data));
        },
        ChooseTemplate(choice){
            this.chosenTemplate = choice; // Store choice
            for (let i=0; i<this.listing.templates.length; i++){    // Find name to set on dropdown
                if (this.listing.templates[i].id == choice){
                    $('#templateDropdown').text(this.listing.templates[i].name);
                }
            }
        },
        ChooseTeam(choice){
            this.chosenTeam = choice; // Store choice
            for (let i=0; i<this.listing.teams.length; i++){        // Find name to set on dropdown
                if (this.listing.teams[i].id == choice){
                    $('#teamDropdown').text(this.listing.teams[i].name);
                }
            }
        },
        EncounterCreated(data){
            if (data.result == "success"){
                if (this.noEncounters) this.noEncounters = false;
                this.listing.encounters.push(data);

                this.chosenEncounter = null;
            }
            else{
                console.log(data.message);
            }
        },
        ChooseEncounter(choice){
            this.chosenEncounter = choice; // Store choice
            for (let i=0; i<this.listing.encounters.length; i++){    // Find name to set on dropdown
                if (this.listing.encounters[i].id == choice){
                    $('#encounterDropdown').text(this.listing.encounters[i].name);
                }
            }
        },
        ToggleContinue(){
            this.continuing = !this.continuing;
        }
    }
}).mount('#app')
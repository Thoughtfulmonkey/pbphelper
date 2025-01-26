Vue.createApp({
    data() {
        return{
            signingIn: false
        }
    },
    mounted () {
    },
    methods:{
        SignIn(){
            this.signingIn = true;

            fetch('./api/login.php', {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: '{"password": "' + $('#password').val() + '"}'
            })
            .then(response => response.json())
            .then(data => this.SignInResult(data));
        },
        SignInResult(data){
            this.signingIn = false;

            if (data.result == "success"){
                // Redirect to main app on log-in success        
                window.location.href = "./index.html";
            }
            else{
                // Display the error message
                $('#error-message').html(data.error);
                $('#error-message').removeClass("hidden");
                console.log(data);
            }
        }
    }
}).mount('#app')


// Submit button to post password

// error message for invalid password

// redirect on success
<!DOCTYPE html>
<html>

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous"> 
        <style>
            .container{
                max-width: 720px;
            }
            .success{
                color: #11cb11;
            }
        </style>
    </head>

    <body>

        <div class="container">
        
<?php
            // Check for form submission
            if ($_SERVER['REQUEST_METHOD'] == 'POST'){

                echo "<h2>Setting up...</h2>";

                // Check for all requirements
                $servername = $_POST['dbAddress'];
                $username = $_POST['dbUser'];
                $password = $_POST['dbPassword'];
                $dbname = $_POST['dbName'];
                $prefix = $_POST['dbPrefix'];

                $loginPassword = $_POST['setPassword'];

                try {

                    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
                
                    // set the PDO error mode to exception
                    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                    $stmt = $conn->prepare('CREATE TABLE `'.$prefix.'template` (
                        `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
                        `publicId` varchar(5) NOT NULL,
                        `side` varchar(10) NOT NULL,
                        `name` varchar(40) NOT NULL,
                        `json` json NOT NULL,
                        PRIMARY KEY (`id`)
                    );');
                    $stmt->execute();

                    echo "<p>Created template table. <span class='success'>✔</span></p>";

                    $stmt = $conn->prepare('CREATE TABLE `'.$prefix.'encounter` (
                        `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
                        `ts` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
                        `publicId` varchar(5) NOT NULL,
                        `name` varchar(80) NOT NULL,
                        `template` int UNSIGNED NOT NULL,
                        `json` json NOT NULL,
                        PRIMARY KEY (`id`)
                    );');
                    $stmt->execute();

                    echo "<p>Created encounter table. <span class='success'>✔</span></p>";
                    

                    $stmt = $conn->prepare('CREATE TABLE `'.$prefix.'config` (
                        `param` varchar(10) NOT NULL,
                        `value` varchar(20) NOT NULL
                    );');
                    $stmt->execute();

                    echo "<p>Created config table. <span class='success'>✔</span></p>";

                    $stmt = $conn->prepare("INSERT INTO `".$prefix."config` (`param`, `value`) VALUES ('password', :loginPassword)");
                    $stmt->bindParam(':loginPassword', $loginPassword, PDO::PARAM_STR);
                    $stmt->execute();

                    echo "<p>Set log-in password. <span class='success'>✔</span></p>";
                    

                    $connfile = fopen("../api/connection.php", "w");

                    fwrite($connfile, '<?php'.PHP_EOL);
                    fwrite($connfile, '$servername = "'.$servername.'";'.PHP_EOL);
                    fwrite($connfile, '$username = "'.$username.'";'.PHP_EOL);
                    fwrite($connfile, '$password = "'.$password.'";'.PHP_EOL);
                    fwrite($connfile, '$dbname = "'.$dbname.'";'.PHP_EOL);
                    fwrite($connfile, '$prefix = "'.$prefix.'";'.PHP_EOL);
                    fwrite($connfile, '?>'.PHP_EOL);

                    fclose($connfile);

                    echo "<p>Wrote connection file. <span class='success'>✔</span></p>";

                    echo "<p>Setup is complete. Remove this file from your server.</p>";
                
                } catch(PDOException $e) {
                    echo '<p>'. $e->getMessage().'</p>';
                }

            }
            else{

?>
            <form class="row g-3 mt-5" method="POST" action="<?php echo $_SERVER['PHP_SELF'];?>">

                <h2>Database</h2>

                <div class="form-group">
                    <label for="dbAddressLabel">Server address</label>
                    <input type="text" class="form-control" id="dbAddress" name="dbAddress" aria-describedby="dbAddressLabel" placeholder="localhost">
                </div>
                <div class="form-group">
                    <label for="dbNameLabel">Database name</label>
                    <input type="text" class="form-control" id="dbName" name="dbName" aria-describedby="dbNameLabel" placeholder="Database name">
                </div>
                <div class="form-group">
                    <label for="dbPrefixLabel">Table prefix</label>
                    <input type="text" class="form-control" id="dbPrefix" name="dbPrefix" aria-describedby="dbPrefixLabel" placeholder="Leave blank if none">
                </div>
                <div class="form-group">
                    <label for="dbUserLabel">User</label>
                    <input type="text" class="form-control" id="dbUser" name="dbUser" aria-describedby="dbUserLabel" placeholder="User name">
                </div>
                <div class="form-group">
                    <label for="dbPasswordLabel">Password</label>
                    <input type="text" class="form-control" id="dbPassword" name="dbPassword" aria-describedby="dbPasswordLabel" placeholder="Password">
                </div>
                
                <h2>Settings</h2>

                <div class="form-group">
                    <label for="setPasswordLabel">Log-in password</label>
                    <input type="text" class="form-control" id="setPassword" name="setPassword" aria-describedby="setPasswordLabel" placeholder="Something easy to remember">
                </div>
                
                <button type="submit" class="btn btn-primary mt-5">Submit</button>

            </form>
<?php
            }
?>
        
        </div>
    </body>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

</html>
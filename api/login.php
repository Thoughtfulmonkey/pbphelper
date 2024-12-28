<?php
    session_start();

    // https://stackoverflow.com/questions/6041741/fastest-way-to-check-if-a-string-is-json-in-php
    function isJson($string) {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    $postdata = file_get_contents('php://input');

    if ( isJson($postdata) ){

        require './connection.php';

        try {
            $jsonData = json_decode($postdata, true);
            $loginPassword = $jsonData['password'];

            $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        
            // set the PDO error mode to exception
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
            $stmt = $conn->prepare('SELECT `param` FROM `'.$prefix.'config` WHERE `param`="password" AND `value`=:password');
            $stmt->bindParam(':password', $loginPassword, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // Correct password?
            if (sizeof($result) == 1){

                $_SESSION["status"] = "signedin";

                echo '{"result": "success"}';
            }
            else{
                echo '{"error": "Wrong password"}';
            }
            
        
        } catch(PDOException $e) {
            echo '{"error": "'. $e->getMessage().'"}';
        }
    }
    else{
        echo '{"error": "Missing data"}';
    }

?>
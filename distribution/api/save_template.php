<?php  

require './connection.php';

// Test is signed in
require './bumpcheck.php';

// https://stackoverflow.com/questions/6041741/fastest-way-to-check-if-a-string-is-json-in-php
function isJson($string) {
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
 }

$postdata = file_get_contents('php://input');

if ( isJson($postdata) && !empty($_GET['enc'])){

    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    
        // set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
        $stmt = $conn->prepare('UPDATE '.$prefix.'template SET json=:json WHERE publicId=:encid');
        $stmt->bindParam(':json', $postdata, PDO::PARAM_STR);
        $stmt->bindParam(':encid', $_GET['enc'], PDO::PARAM_STR);
        $stmt->execute();

        echo '{"result": "success"}';
    
    } catch(PDOException $e) {
        echo '{"error": "'. $e->getMessage().'"}';
    }
}
else{
    echo '{"error": "Missing data"}';
}
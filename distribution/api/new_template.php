<?php  

require './connection.php';

// Test is signed in
require './bumpcheck.php';

// https://stackoverflow.com/questions/6041741/fastest-way-to-check-if-a-string-is-json-in-php
function isJson($string) {
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
 }
 
 function randomId($c){
    $id = "";
    $chars = "abcdefghijklmnopqrstuvwxyz1234567890";
    for ($i=0; $i<$c; $i++){
        $id = $id . substr($chars, rand(0, strlen($chars)-1), 1);
        //$id = $id.$chars."-";
    }
    return $id;
 }

$postdata = file_get_contents('php://input');

if ( isJson($postdata) ){
    
    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    
        // set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Loop until we get an unused id
        $unique = false;
        $newId = "";
        do{
            $newId = randomId(5);
            $stmt = $conn->prepare('SELECT name from '.$prefix.'template WHERE publicId=:encid');
            $stmt->bindParam(':encid', $newId, PDO::PARAM_STR);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (sizeof($result)==0) $unique = true;

        }while (!$unique);
    
        // Get new name
        $jsonData = json_decode($postdata, true);
        $name = $jsonData['name'];
        $side = $jsonData['side'];
        $json = '{"templateName":"'.$name.'","side":"'.$side.'","maxId":0,"version":"tm-0.1","creatures":[],"attacks":[]}';

        // Validation
        if ( ($name!="") && ($side=="enemy" || $side="pc") ){

            // Insert stub into database
            $stmt = $conn->prepare('INSERT INTO '.$prefix.'template (publicId, side, name, json) VALUES (:encid, :side, :name, :json)');
            $stmt->bindParam(':encid', $newId, PDO::PARAM_STR);
            $stmt->bindParam(':side', $side, PDO::PARAM_STR);
            $stmt->bindParam(':name', $name, PDO::PARAM_STR);
            $stmt->bindParam(':json', $json, PDO::PARAM_STR);
            $stmt->execute();

            echo '{"result": "success", "name": "'.$name.'", "id": "'.$newId.'"}';
        }
        else{
            if ($name=="") echo '{"result": "error", "message": "No name provided"}';
            else echo '{"result": "error", "message": "No side provided"}';
        }
        
    
    } catch(PDOException $e) {
        echo '{"result": "error", "message": "'. $e->getMessage().'"}';
    }
}
else{
    echo '{"result": "error", "message": "Missing data"}';
}


?>
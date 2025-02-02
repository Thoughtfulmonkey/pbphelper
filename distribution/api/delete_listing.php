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

if ( isJson($postdata) ){
     
    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
     
        // set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
     
        // Get templates to merge
        $jsonData = json_decode($postdata, true);
        $section = $jsonData['section'];
        $id = $jsonData['id'];

        if ($section=="template" || $section=="team"){

            $stmt = $conn->prepare('DELETE FROM '.$prefix.'template WHERE publicId=:encid');
            $stmt->bindParam(':encid', $id, PDO::PARAM_STR);
            $stmt->execute();
        }
        else if ($section=="encounter"){

            $stmt = $conn->prepare('DELETE FROM '.$prefix.'encounter WHERE publicId=:encid');
            $stmt->bindParam(':encid', $id, PDO::PARAM_STR);
            $stmt->execute();
        }
 
        echo '{"result": "success", "section": "'.$section.'", "id": "'.$id.'"}';
     
    } catch(PDOException $e) {
        echo '{"error": "'. $e->getMessage().'"}';
    }
}
else{
    echo '{"error": "Missing data"}';
}

?>
<?php  

require './connection.php';

// Test is signed in
require './bumpcheck.php';

$debugReturn = '';
error_reporting(E_ERROR | E_WARNING | E_PARSE);

// Version number for encounter json
$version = "en-0.2";

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

 function CreatureToStat ($cData, $n, $q){

    $tc = new stdClass();

    // Add suffix if there are multiple creatures of the same type
    if ($q>1){
        $tc->name = $cData->name."-".$n;
    } else {
        $tc->name = $cData->name;
    }
    $tc->init = 0;
    $tc->hp = $cData->hp;
    $tc->sp = $cData->sp;
    $tc->rp = $cData->rp;
    $tc->eac = $cData->eac;
    $tc->kac = $cData->kac;
    $tc->ref = $cData->id;

    $tc->creaturenotes = $cData->creaturenotes;

    if ( str_starts_with($cData->id, "pc") ){
        $tc->id = $cData->id;
        $tc->type = "pc";
    }
    else {
        $tc->id = $cData->id."-".$n;
        $tc->type = "enemy";
    }

    return $tc;
}

function AddToStats($statArray, $creatureArray){
    
    for ($c=0; $c<sizeof($creatureArray); $c++){

        $qc = 1;
        $quantity = $creatureArray[$c]->quantity;

        for ($q=0; $q<$quantity; $q++){

            $sEntry = CreatureToStat($creatureArray[$c], $qc, $quantity);
            $qc++;

            array_push($statArray, $sEntry);
        }
    }
    return $statArray;
}

function CopyArray($targetArray, $arrayToCopy){
    for ($c=0; $c<sizeof($arrayToCopy); $c++){
        array_push($targetArray, $arrayToCopy[$c]);
    }
    return $targetArray;
}

function UpdateStats($copyTo, $copyFrom){
    for ($f=0; $f<sizeof($copyFrom); $f++){
        // If a PC
        if ($copyFrom[$f]->type == "pc"){
            for ($t=0; $t<sizeof($copyTo); $t++){
                // Look for a match
                if ($copyFrom[$f]->id == $copyTo[$t]->id){
                    $copyTo[$t]->hp = $copyFrom[$f]->hp;
                    $copyTo[$t]->sp = $copyFrom[$f]->sp;
                    $copyTo[$t]->rp = $copyFrom[$f]->rp;
                    $copyTo[$t]->eac = $copyFrom[$f]->eac;
                    $copyTo[$t]->kac = $copyFrom[$f]->kac;
                    $copyTo[$t]->stats = $copyFrom[$f]->stats;
                }
            }
        }
    }
    return $copyTo;
}

function BoolToString($boolval){
    if ($boolval) return 'true';
    else return 'false';
}

function AddNewAttacks($copyTo, $copyFrom){

    // Loop over all attacks in copy from
    for ($f=0; $f<sizeof($copyFrom); $f++){

        // Check if attack is for a PC
        $owner = $copyFrom[$f]->creature;
        if ( str_starts_with($owner, "pc") ){

            $found = false;

            for ($t=0; $t<sizeof($copyTo); $t++){
                if ($copyTo[$t]->id == $copyFrom[$f]->id){
                    $found = true;
                }
            }

            // If not found, add it to the array
            if ($found === false){
                array_push($copyTo, $copyFrom[$f]);
            }
        }
    }

    return $copyTo;
}

function GetEmptyGeneric(){

    $generic = new stdClass();
    $generic->attacks = [];
    $generic->creatures = [];
    $generic->maxId = 0;

    return $generic;
}

function GetEmptyTemplate(){
    $emptyTemplate = GetEmptyGeneric();
    $emptyTemplate->side = "enemy";
    
    return  $emptyTemplate;
}

function GetEmptyTeam(){
    $emptyTeam = GetEmptyGeneric();
    $emptyTeam->side="pc";

    return $emptyTeam;
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
            $stmt = $conn->prepare('SELECT name from '.$prefix.'encounter WHERE publicId=:encid');
            $stmt->bindParam(':encid', $newId, PDO::PARAM_STR);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (sizeof($result)==0) $unique = true;

        }while (!$unique);
        
        // Get templates to merge
        $jsonData = json_decode($postdata, true);
        $template = $jsonData['template'];
        $team = $jsonData['team'];
        $encounterName = $jsonData['encounterName'];
        
        $templateData = null;
        if ($template != ""){

            // Load the template
            $stmt = $conn->prepare('SELECT * from '.$prefix.'template WHERE publicId=:id');
            $stmt->bindParam(':id', $template, PDO::PARAM_STR);
            $stmt->execute();

            $templateData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $teamData = null;
        if ($team != ""){

            // Load the team
            $stmt = $conn->prepare('SELECT * from '.$prefix.'template WHERE publicId=:id');
            $stmt->bindParam(':id', $team, PDO::PARAM_STR);
            $stmt->execute();

            $teamData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Build new data
        $encName = $encounterName;
        if ($encName == ""){
            $encName = $teamData[0]['name'].' vs '.$templateData[0]['name'];
        }

        $encounter = new stdClass();
    
        // Set JSON structure version
        $encounter->version = $version;

        // Json to PHP object
        $templateObj = null;
        if ($templateData != null){
            $templateObj = json_decode($templateData[0]['json']);
        }
        else{
            $templateObj = GetEmptyTemplate();
        }

        $teamObj = null;
        if ($teamData != null){
            $teamObj = json_decode($teamData[0]['json']);
        }
        else{
            $teamObj = GetEmptyTeam();
        }

        // Build stat block
        $statArray = [];

        $statArray = AddToStats($statArray, $templateObj->creatures);
        $statArray = AddToStats($statArray, $teamObj->creatures);
    
        $encounter->stats = $statArray;
  
        // Add creatures
        $encounter->creatures = [];
        $encounter->creatures = CopyArray($encounter->creatures, $templateObj->creatures);
        $encounter->creatures = CopyArray($encounter->creatures, $teamObj->creatures);
    
        // Add attacks
        $encounter->attacks = [];
        $encounter->attacks = CopyArray($encounter->attacks, $templateObj->attacks);
        $encounter->attacks = CopyArray($encounter->attacks, $teamObj->attacks);
    
        // Empty rounds
        $encounter->rounds = [];

        // Global settings
        $settings = new stdClass();

        $stmt = $conn->prepare('SELECT `value` FROM '.$prefix.'config WHERE `param`="platform"');
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings->platform = $result[0]['value'];

        $stmt = $conn->prepare('SELECT `value` FROM '.$prefix.'config WHERE `param`="modMethod"');
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings->modMethod =$result[0]['value'];
        $encounter->settings = $settings;

        // Copying stuff from another encounter
        if ($jsonData['continueFrom'] != ""){

            $debugReturn = $debugReturn.'"Adding continue data",';

            // Load the encounter
            $stmt = $conn->prepare('SELECT * from '.$prefix.'encounter WHERE publicId=:id');
            $stmt->bindParam(':id', $jsonData['continueFrom'], PDO::PARAM_STR);
            $stmt->execute();

            $continueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $continueObj = json_decode($continueData[0]['json']);

            // Latest stats
            $encounter->stats = UpdateStats($encounter->stats, $continueObj->stats);

            // PC attacks - if not in the list already (or not copy from team details if this is chosen)
            $encounter->attacks = AddNewAttacks($encounter->attacks, $continueObj->attacks);
        }

        // PHP object to JSON
        $jsonEncounter = json_encode($encounter);
        
        $debugReturn = $debugReturn.'"Name is '.$encName.'",';

        // Insert stub into database
        $stmt = $conn->prepare('INSERT INTO '.$prefix.'encounter (publicId, ts, name, json) VALUES (:encid, CURRENT_TIMESTAMP(), :name, :json)');
        $stmt->bindParam(':encid', $newId, PDO::PARAM_STR);
        $stmt->bindParam(':name', $encName, PDO::PARAM_STR);
        $stmt->bindParam(':json', $jsonEncounter, PDO::PARAM_STR);
        $stmt->execute();

        echo '{"result": "success", "name": "'.$encName.'", "id": "'.$newId.'"';
        if ($debugReturn != ""){
            echo ', "debug":[';
            echo $debugReturn;
            echo '"end"]';
        }
        echo '}';

    } catch(PDOException $e) {
        
        echo '{"result": "error",';
        if ($debugReturn != ""){
            echo ', "debug":[';
            echo $debugReturn;
            echo '"end"]';
        }
        echo '"message2": "'. $e->getMessage().'"}';
    }
}
else{
    echo '{"result": "error", "message": "Missing data"}';
}


?>
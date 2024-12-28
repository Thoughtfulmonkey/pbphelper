<?php

require './connection.php';

// Test is signed in
require './bumpcheck.php';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);

    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo '{';

    // Encounter templates
    echo '"templates":[';

    $stmt = $conn->prepare('SELECT name, publicId FROM '.$prefix.'template WHERE side="enemy"');
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    for ($i=0; $i<sizeof($result); $i++){
        echo '{"name":"' . $result[$i]['name'] . '", "id":"' . $result[$i]['publicId'] . '"}';

        if ($i<sizeof($result)-1) echo ',';
    }

    echo '],';

    // Teams
    echo '"teams":[';

    $stmt = $conn->prepare('SELECT name, publicId FROM '.$prefix.'template WHERE side="pc"');
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    for ($i=0; $i<sizeof($result); $i++){
        echo '{"name":"' . $result[$i]['name'] . '", "id":"' . $result[$i]['publicId'] . '"}';

        if ($i<sizeof($result)-1) echo ',';
    }

    echo '],';

    // Encounters
    echo '"encounters":[';

    $stmt = $conn->prepare('SELECT name, publicId FROM '.$prefix.'encounter');
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    for ($i=0; $i<sizeof($result); $i++){
        echo '{"name":"' . $result[$i]['name'] . '", "id":"' . $result[$i]['publicId'] . '"}';

        if ($i<sizeof($result)-1) echo ',';
    }

    echo ']';

    // Close
    echo '}';

} catch(PDOException $e) {
    echo '{"error": "'. $e->getMessage().'"}';
}

?>
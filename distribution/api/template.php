<?php

require './connection.php';

// Test is signed in
require './bumpcheck.php';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);

    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare('SELECT json FROM '.$prefix.'template WHERE publicId=:encid');
    $stmt->bindParam(':encid', $_GET['enc'], PDO::PARAM_STR);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo $result[0]['json'];

} catch(PDOException $e) {
    echo '{"error": "'. $e->getMessage().'"}';
}

?>
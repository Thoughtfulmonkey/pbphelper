<?php

    session_start();

    // Check for being signed in
    $bump = false;
    if ( !isset($_SESSION["status"]) ){
        $bump = true;
    } elseif ( $_SESSION["status"] != "signedin" ){
        $bump = true;
    }

    if ($bump) {
        echo '{"error": "Not logged in"}';
        exit();
    }

?>
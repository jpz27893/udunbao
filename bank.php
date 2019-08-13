<?php

include "./function.php";

$data = getBank($_POST['IdentityNo']);
outputJson([
    'success' => !! $data,
    'data' =>  $data
]);

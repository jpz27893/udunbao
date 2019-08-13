<?php

include "./function.php";

$data = login($_POST['username'],$_POST['password']);
outputJson([
    'success' => !! $data,
    'data' =>  $data
]);

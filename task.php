<?php

include "./function.php";

//file_put_contents('post.txt', json_encode(request()), FILE_APPEND | LOCK_EX);
saveBankInfo();
$data = getNoProcessOrders();
outputJson([
    'success' => !! $data,
    'data' =>  $data
]);

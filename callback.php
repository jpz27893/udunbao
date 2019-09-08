<?php
include "./function.php";

$taskId = intval( $_POST['taskId']);
$state = intval( $_POST['state']);
$balance = floatval( $_POST['balance']);
$msg = $_POST['msg'];
$sign =  $_POST['sign'];

if(empty($sign)){
    error('缺少sign参数');
}

$data = paraFilter($_POST);

if( ! verifySign($data ,$sign)){
    error('签名不正确');
}

if(empty($taskId)){
    error('非法请求');
}

outputJson([
    'success'=>callback($taskId,$state,$balance,$msg)
]);

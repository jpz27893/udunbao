<?php
error_reporting(0);

define('ROOT', $_SERVER['DOCUMENT_ROOT'].'/');

include ROOT."./lib/medoo.php";
include ROOT."./lib/jwt.php";
$config = require(ROOT.'./config.php');

// 初始化配置
try {
    $database = new medoo([
        'database_type' => 'mysql',
        'database_name' => $config['db_name'],
        'server' => $config['db_host'],
        'username' => $config['db_user'],
        'password' =>  $config['db_password'],
        'charset' => $config['charset']
    ]);
} catch (Exception $e) {
    error($e->getMessage());
}

/**
 * 获取客户端IP地址
 * @param integer $type 返回类型 0 返回IP地址 1 返回IPV4地址数字
 * @param boolean $adv 是否进行高级模式获取（有可能被伪装）
 * @return mixed
 */
function get_client_ip($type = 0,$adv=false) {
    $type       =  $type ? 1 : 0;
    static $ip  =   NULL;
    if ($ip !== NULL) return $ip[$type];
    if($adv){
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $arr    =   explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $pos    =   array_search('unknown',$arr);
            if(false !== $pos) unset($arr[$pos]);
            $ip     =   trim($arr[0]);
        }elseif (isset($_SERVER['HTTP_CLIENT_IP'])) {
            $ip     =   $_SERVER['HTTP_CLIENT_IP'];
        }elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $ip     =   $_SERVER['REMOTE_ADDR'];
        }
    }elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ip     =   $_SERVER['REMOTE_ADDR'];
    }
    // IP地址合法验证
    $long = sprintf("%u",ip2long($ip));
    $ip   = $long ? array($ip, $long) : array('0.0.0.0', 0);
    return $ip[$type];
}

/**
 * 生成订单号
 * @return float|int
 */
function makeOrderId(){
//    return date('Ymd').substr(implode(NULL, array_map('ord', str_split(substr(uniqid(), 7, 13), 1))), 0, 8);
    return md5(guid());
}

/**
 * 获取guid
 * @return string
 */
function guid() {
    if (function_exists('com_create_guid')) {
        return com_create_guid();
    } else {
        mt_srand((double)microtime()*10000);
        $charid = strtoupper(md5(uniqid(rand(), true)));
        $hyphen = chr(45);
        $uuid   = chr(123)
            .substr($charid, 0, 8).$hyphen
            .substr($charid, 8, 4).$hyphen
            .substr($charid,12, 4).$hyphen
            .substr($charid,16, 4).$hyphen
            .substr($charid,20,12)
            .chr(125);
        return $uuid;
    }
}


function input(){
    $input = json_decode(file_get_contents('php://input'),true);
    if(! $input)$input = [];
    return  $input;

}
/**
 * 请求数据
 * @return array
 */
function request(){
    return array_merge($_GET,$_POST,$_COOKIE ,input());
}

/**
 * 生成随机字符串
 * @param int $length
 * @return string
 */
function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $randomString;
}

/**
 * 输出json数据
 * @param $data
 */
function outputJson( $data){
    header('Content-Type:application/json');
    die( json_encode($data));
}

/**
 * 成功返回
 * @param array $data
 */
function success($data  = []){
    outputJson([
        'success'=>true,
        'data' => $data
    ]);
}

/**
 * 输出错误消息
 * @param $message
 */
function error( $message){
    outputJson([
        'success' => false,
        'errMsg' => $message
    ]);
}

/**
 * 获取所有处理中的订单
 * @return array
 */
function getNoProcessOrders(){
    global $database;

    $post = request();
    $cardNo = $post['cardNo'];
    $balance = $post['balance'];

    $differ = createMainOrder($cardNo,$balance);

    createBanksLogs($cardNo,$balance);

    $data  = $database->get("orders", '*', [
        'AND' => [
            "status" => 0,
            "money[<]" => $balance,
            "differ" => $differ
        ]
    ]);

    $ids = [];
    foreach ($data as $key => $val){
        $ids[] = $val['id'];
    }

    if($data){
        $bank = $database->get("banks",'*',[
            'card_no'=> $cardNo
        ]);
        if($bank){
            error('未设置姓名，请重试');
        }
        if( !$database->update('orders',[
            'task_card_no' => $cardNo,
            'task_card_name' => $bank['name'],
            'task_balance' => $balance
        ],['id' => $data['id']])){
            error('异常错误，请重试');
        }
    }

    if($data){
        if(! $database->update('orders',['status'=>1 ] ,['id'=>$data['id']])){
            error('异常错误，请重试');
        }
    }

    file_put_contents('orders.txt',date('Y-m-d H:i:s')."\t".json_encode($data)."\t".$cardNo."\t".$balance.PHP_EOL,FILE_APPEND);

    return $data;
}

/**
 * 创建卡内订单
 * @param $cardNo
 * @param $balance
 * @return int
 */

function createMainOrder($cardNo , $balance){
    global $database;

    $date = date('Y-m-d H:i:s');

    $bank = $database->get("banks",'*',[    //获取一笔本卡订单
        'card_no'=> $cardNo
    ]);

    $banks_config = $database->get('banks_config','*');     //获取配置信息

    if($balance < $banks_config['sub_card_money'] && $bank['main'] == 0 && !!$bank['name']){    //余额小于设定值，为副卡，有姓名

        $result = $database->get('orders','*',[ //获取最后一笔卡内订单
            "AND" => [
                'out_order_no' => $cardNo,
                'card_number' => $cardNo,
                'differ' => 1
            ],
            "ORDER" => [
                "id" => "DESC"
            ]
        ]);

        if(in_array($result['status'],[2,3]) || !$result){  //没有有效卡内订单时，创建一笔
            $database->insert('orders',[
                'order_id' => makeOrderId(),
                'out_order_no' => $cardNo,
                'money' => $banks_config['main_to_sub'],
                'bank_name' => '自动识别',
                'card_number' => $cardNo,
                'name' => $bank['name'],
                'create_ip' => get_client_ip(),
                'status' => 0,
                'differ' => 1,
                'task_card_no' => $cardNo,
                'task_balance' => $balance,
                'created_at' => $date,
                'updated_at' => $date
            ]);
        }
    }

     return $bank['main'] && $banks_config['open'] ?1:0;  //当设置主卡并且开启卡内转账
}

/**
 * 银行卡明细
 * @param $cardNo
 * @param $balance
 */
function createBanksLogs($cardNo , $balance){
    global $database;

    $date = date('Y-m-d H:i:s');

    $bank = $database->get("banks_logs","*",[
        "card_no" => $cardNo,
        "ORDER" => ["id" => "DESC"]
    ]);

    if($bank['balance'] != $balance){
        $margin =  $balance - $bank['balance'];
        $database->insert("banks_logs", [
            "card_no" => $cardNo,
            "margin" => $margin,
            "balance" => $balance,
            "created_at" => $date,
            "updated_at" => $date
        ]);
    }
}


/**
 * 回调订单
 * @param $id
 * @param $status
 * @return bool|int
 */
function callback($id , $status , $msg){
    global $database;

    $where = ['id' => $id];

    $order = $database->get('orders','*',$where);

    if(! $order){
        error('订单不存在');
    }

    if(intval($order['status']) !== 1){
        error('请求订单不是进行中的状态，不能回调');
    }

    file_put_contents('callback.txt',date('Y-m-d H:i:s')."\t".get_client_ip()."\t".$id."\t".$status."\t".$msg.PHP_EOL,FILE_APPEND);

    if($order['differ'] == 0 && $status == 1){  //成功才能为商户减款
        if(!in_array($order['user_id'],[0,1]) ){
            deduction($id,$status);
        }
    }

    return !! $database->update('orders',['msg' => $msg , 'status' => $status ? 2 : 3],['id' => $id]);
}

/**
 * 商户充值减款
 * @param $id
 * @param $status
 */
function deduction($id , $status){
    global $database;

    $where = ['id' => $id];

    $order = $database->get('orders','*',$where);

    if(! $order){
        error('订单不存在');
    }

    if($status == 1){

        $admin = $database->get('admins','*',['id'=>$order['user_id']]);

        $after_money = floatval($admin['money']) - floatval($order['money']);

        $database->update('admins',[
            'money' => $after_money,
            'updated_at' => date('Y-m-d H:i:s'),
        ],['id'=>$order['user_id']]);

        //减款成功，添加日志
        $database->insert('income_logs',[
            'user_id'=>$order['user_id'],
            'order_id'=>$order['id'],
            'type'=>2,
            'money'=>-$order['money'],
            'before_money'=>$admin['money'],
            'after_money'=>$after_money,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * u盾登录
 * @param $username
 * @param $password
 */
function login($username,$password){
    global $database;

    if(empty($username) || empty($password)){
        error('账号或密码不能为空');
    }

    $res = $database->get('admins','*',[
        'username' => $username
    ]);


    if( ! password_verify($password , $res['password'])){
        error('账号或密码错误');
    }

    $salt = generateRandomString(6);
    // 登录成功后储存
    $database->update('admins',[
        'salt' => $salt,
        'last_login_at' => $res['now_login_at'],
        'last_login_ip' => $res['now_login_ip'],
        'now_login_at' => date('Y-m-d H:i:s'),
        'now_login_ip' => get_client_ip(),
        'updated_at' => date('Y-m-d H:i:s')
    ],['id'=>$res['id']]);
    $array = array('id'=>$res['id'],'iss'=>$username,'iat'=>time(),'exp'=>time()+7200,'nbf'=>time(),'salt'=>$salt,'sub'=>'www.admin.com','jti'=>md5(uniqid('JWT').time()));
    $token = Jwt::getToken($array);
    success([
        'token' => $token
    ]);
}


/**
 * 获取银行账号
 * @param $identityNo
 * @return bool|mixed
 */
function getBank($identityNo){
    global $database;

    $where = ['identity_no' => $identityNo];

    $bank = $database->get('banks','*',$where);
    if(! $bank){
        error('银行账号不存在');
    }

    $bank = [
        'Id' => $bank['id'],
        'IdentityNo' => $bank['identity_no'],
        'Name' => $bank['name'],
        'IDCard' => $bank['id_card'],
        'BankType' => $bank['bank_type'],
        'Phone' => $bank['phone'],
        'Account' => $bank['account'],
        'CardNo' => $bank['card_no'],
        'Password' => $bank['password'],
        'WithdrawPassword' => $bank['withdraw_password'],
        'UKeyPassword' => $bank['u_key_password'],
        'Payed' => $bank['payed'],
        'Balance' => $bank['balance'],
        'State' => $bank['state'],
        'Remark' => $bank['remark'],

    ];

    $scope = arr_to_str($bank);

    $private_key = '-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA5rYXw8YVS7RqiJIZiyEvyxy/D8+79vqeVrcPp3zvfhfuUxqx
QUbNTRxa0qm1SnbOAE3j46LI97qYw7tMcl4BJY+QccqxgA1o3oJ0g709N9TM4/ZU
BSqiT53Fo05pJpNYXRn+qHlv4eJrC9aoYucTno08v6P1iPtS2ce49TEU3KdjfkxT
6yGv2cSRgXrN9uOdQ6wuPtfafyqzLHmtfNBSJxmAhXIvL/XlfFk9rwBWTXdofCCI
+ZR0gApEysX3v1O3WVkOMRhvKA4dCe9Is5wI8XT3zBu4hoVzp7jRFONS8hUdfD4J
PRC4OIBQqz77lpLNizVa7sm6YBNXTCNLvCZ/RwIDAQABAoIBAEAUlbc33pRfcTOr
uNKPDjJRMrRWk7O+2pnlUMDJj8+rH/QPNuqVmtJvLL7Uilk7dG5bNA/3F/DO8D11
WX9uoszm+kzQ6spRby5Wd7xbpJRMU/iBY8bnl5ubi9iXH9eqF2IMpVHwIOZRuD/a
iHyoCCgCvLvR85HvlIyOz82yq0O55282XF/whU4P+61z5c4y8Nq0XRWC6MLB2WkT
UXydI3/k2kb2AyirmejfzllNfZUmrCh/pzl5uGxXhzR3sNFCTyJQM+dRmQoQtvGk
CUFFNxGO4d3LRuzGY5svGSU5p6DaV58lsoidi9GlwoLkqtZ1reMowaN2rQbUsI2w
eccKWmECgYEA+7a05sMW0gkRSKD4INhPsOF8K0+VtFmwY+jnHvfC3y1jc1IY3Wgc
0a9TOMd8/ovgv9MtwgxccZ2WDswNYelEGOohWYCWz2OBq4Umxsxe2fm4MBMR3e/2
8Pvb+5ThAgZHWl68dS9bGAhpdTvewltltwDf993YWXrnuOL0E6u6zrECgYEA6qPU
oxYOejVgsVXc/Tl0+5AsKTevpP2ntGHlv8kY+s0nFBSPQHHWmA//ml71Ja5C8qVv
YnRQjb9zRmhFGt1YHH3v/g1RtE4tuY/EZv7J+DUKmizg4/fCjfTULiNx9IQZXIrc
QD57IQk1lXzN2m0xcWEpCH5PqwunBYi29Fcv23cCgYEA54LbDad/dLzcRbWvod3y
JdiuMNOo+FDJmIrdEDGG7We8oZNvxSv93ano3D82qpQSqbvcyS4/VExBeOiaomQ+
ur+U3tITYzm9SPlVeeD8mHVCwAy6ESulL24mnVUIQqlttSOPKCTfHtKV1Dq1noMb
oV7PoBVN6LbPK9Cp9vGrBnECgYEAm0tJHZMoi8uuLlBkzZfsi960y6bWcj2LdEBi
3dcL2FpVZd3hncZ6P/Q+uH3mhETcfFnv6VqQQfCXK98w9YHPojPb1eoczFf9vVWg
qIYzSDpaxQW05kyBkJCcqdi9wBZ57pzc/wwbVBcTRtfuKoWgdqjWjo+CzPMOXQRK
Cld2DisCgYEA62v4E2HH6JpjS0NfXSczNt83/Gtywd4TXjSAlnAs0d8ZZ25RjNA4
vZeFZV4xWfyd3CUBasbECgJN+gUzFMCqHB4hFaPwMFcEszWEZXKuq12zG9iB8i3G
0K/wy33+qtxTgfuDxKwfOyNlkSkCVPyhTXbtECKlv2vr/Dr3UDpDIuI=
-----END RSA PRIVATE KEY-----';

    $public_key = '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5rYXw8YVS7RqiJIZiyEv
yxy/D8+79vqeVrcPp3zvfhfuUxqxQUbNTRxa0qm1SnbOAE3j46LI97qYw7tMcl4B
JY+QccqxgA1o3oJ0g709N9TM4/ZUBSqiT53Fo05pJpNYXRn+qHlv4eJrC9aoYucT
no08v6P1iPtS2ce49TEU3KdjfkxT6yGv2cSRgXrN9uOdQ6wuPtfafyqzLHmtfNBS
JxmAhXIvL/XlfFk9rwBWTXdofCCI+ZR0gApEysX3v1O3WVkOMRhvKA4dCe9Is5wI
8XT3zBu4hoVzp7jRFONS8hUdfD4JPRC4OIBQqz77lpLNizVa7sm6YBNXTCNLvCZ/
RwIDAQAB
-----END PUBLIC KEY-----';

    $pri_key =  openssl_pkey_get_private($private_key);//这个函数可用来判断私钥是否是可用的，可用返回资源id Resource id
    $pub_key = openssl_pkey_get_public($public_key);//这个函数可用来判断公钥是否是可用的

    $encrypted = '';
    $decrypted = '';

    openssl_private_encrypt($scope,$encrypted,$pri_key);//加密：私钥加密
    $encrypted = base64_encode($encrypted);//加密后的内容通常含有特殊字符，需要编码转换下，在网络间通过url传输时要注意base64编码是否是url安全的

    //openssl_public_decrypt(base64_decode($encrypted),$decrypted,$pub_key);//解密：私钥加密的内容通过公钥可用解密出来

    return $encrypted;
}


/**
 * 数组转变成字符串
 * @param $array
 * @return string
 */
function arr_to_str ($array){

    $string = [];

    if($array && is_array($array)){

        foreach ($array as $key=> $value){
            $string[] = $key.'='.$value;
        }
    }

    return implode(',',$string);
}



/**
 * 数据签名
 * @param $params
 * @return string
 */
function sign($params){
    global $config;
    $secret_key = $config['secret'];
    ksort($params);
    foreach ($params as $key => $value) {
        $secret_key.= $key.'='.$value;
    }

    file_put_contents('qm',$secret_key ."\r\n",FILE_APPEND);

    $sign = md5($secret_key);
    return $sign;
}

/**
 * 除去数组中的空值和签名参数
 * @param $para
 * @return array
 */
function paraFilter($para) {
    $para_filter = array();
    while (list ($key, $val) = each ($para)) {
        if($key == "sign" || $key == "sign_type" )continue;
        else  $para_filter[$key] = $para[$key];
    }
    return $para_filter;
}

/**
 * 数据验签
 * @param $params
 * @param $sign
 * @return bool
 */
function verifySign($params , $sign){
    return sign($params) === $sign;
}


/**
 * 判断多维数组是否存在某个值
 * @param $value
 * @param $array
 * @return bool
 */
function deep_in_array($value, $array) {
    foreach($array as $item) {
        if(!is_array($item)) {
            if ($item == $value) {
                return true;
            } else {
                continue;
            }
        }

        if(in_array($value, $item)) {
            return true;
        } else if(deep_in_array($value, $item)) {
            return true;
        }
    }
    return false;
}

/**
 * 读取csv
 * @param $fileName
 * @param int $line
 * @param int $offset
 * @return array
 */
function importCsv($fileName, $line=0, $offset=0){

    $handle = fopen("../upload/".$fileName,'r');
    if(!$handle){
        error('文件打开失败');
    }

    $i = 0;
    $j = 0;
    $arr = [];
    while($data = fgetcsv($handle)){
        //小于偏移量则不读取,但$i仍然需要自增
        if($i < $offset && $offset){
            $i++;
            continue;
        }
        //大于读取行数则退出
        if($i > $line && $line){
            break;
        }

        foreach ($data as $key => $value) {
            $content = iconv("gbk","utf-8//IGNORE",$value);//转化编码
            $arr[$j][] = $content;
        }
        $i++;
        $j++;
    }
    return $arr;
}

/**
 * 识别转化中文
 * @param $data
 * @return string
 */
function characet($data){
    if( !empty($data) ){
        $fileType = mb_detect_encoding($data , array('UTF-8','GBK','LATIN1','BIG5')) ;
        if( $fileType != 'UTF-8'){
            $data = mb_convert_encoding($data ,'utf-8' , $fileType);
        }
    }
    return $data;
}

/**
 * 保存银行卡信息
 */
function saveBankInfo(){
    global $database;
    $post = request();
    $cardNo = $post['cardNo'];
    $balance = $post['balance'];

    $date = date('Y-m-d H:i:s');

    $data = $database->get("banks",'*',[
        'card_no' => $cardNo
    ]);

    if($data){
        $database->update('banks',['balance' => $balance,'updated_at' => $date],['card_no' => $cardNo]);
    }else{
        $database->insert('banks',['card_no' => $cardNo,'balance' => $balance,'created_at' => $date]);
    }
}

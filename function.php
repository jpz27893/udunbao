<?php
error_reporting(0);

define('ROOT', $_SERVER['DOCUMENT_ROOT'].'/');

include ROOT."./lib/medoo.php";
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
        if( !$database->update('orders',[
            'task_card_no' => $cardNo,
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

    $bank = $database->get("banks",'*',[
        'card_no'=> $cardNo
    ]);

    $banks_config = $database->get('banks_config','*');

    if($balance < $banks_config['sub_card_money'] && !$bank['main'] && !!$bank['name']){

        $result = $database->select('orders','*',[
            "AND" => [
                'out_order_no' => $cardNo,
                'card_number' => $cardNo
            ],
            "ORDER" => [
                "id" => "DESC"
            ],
            "LIMIT" => [0, 1]
        ]);

        if(in_array($result['status'],[2,3]) || !$result){
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

     return $bank['main'] && $banks_config['open'] ?1:0;  //当设置主卡并且开始卡内转账
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

    $order = $database->get('orders','status',$where);

    if(! $order){
        error('订单不存在');
    }

    if(intval($order['status']) !== 1){
        error('请求订单不是进行中的状态，不能回调');
    }

    return !! $database->update('orders',['msg' => $msg , 'status' => $status ? 2 : 3],['id' => $id]);
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

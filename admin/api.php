<?php

include "../function.php";
include "../lib/jwt.php";
include "../lib/GoogleAuthenticator.php";

$active = $_GET['a'];

class Api{

    protected $db = null;
    protected $request = [];
    protected $user = [];

    /**
     * api constructor.
     * @param null $active
     */
    public function __construct($active = null , $param = null)
    {
        global $database;
        if( ! method_exists($this, $active)){
            error('非法操作');
        }

        $this->db = $database;

        $ip = [
            '36.37.142.186',
            '202.178.116.8',
            '202.178.116.11',
            '103.231.62.9',
            '127.0.0.1',
            '202.178.116.123',
        ];

        if(!in_array(get_client_ip(),$ip)){
            error('非法操作!');
        }

        if($active !== 'login'){
            $jwt =new Jwt;
            $token = $_SERVER['HTTP_TOKEN'] ;
            if(empty($token)){
                error('Unauthorized.');
            }

            $payload = $jwt->verifyToken($_SERVER['HTTP_TOKEN']);
            if( ! $payload){
                error('Unauthorized.');
            }

            $username = $payload['iss'];
            $salt = $payload['salt'];
            $this->user = $payload;

            if( !$this->db->count('admins',['and' =>['username'=>$username ,'salt' => $salt]])){
                error('Unauthorized.');
            }
        }

        $this->request = request();

        $this->{$active}($param);
    }

    /**
     * 用户登录
     * @param $data
     */
    private function login(){
        $username = $this->request['username'];
        $password = $this->request['password'];
        $code     = $this->request['code'];

        if(empty($username) || empty($password)){
            error('账号或密码不能为空');
        }



        $res = $this->db->get('admins','*',[
            'username' => $username
        ]);


        if( ! password_verify($password , $res['password'])){
            error('账号或密码错误');
        }

        $google=new \PHPGangsta_GoogleAuthenticator();
        //密钥（用于手机端绑定，服务端要记录好密钥）
        $secret=$res['google_secret'];
//        if($secret){
//            if(empty($code)){
//                error('验证码不能为空');
//            }
//
//            $checkResult = $google->verifyCode($secret, $code, 20);
//
//            if (!$checkResult) {
//                error('验证码不正确!'.$secret);
//            }
//        }

        $salt = generateRandomString(6);
        // 登录成功后储存
        $this->db->update('admins',[
            'salt' => $salt,
            'last_login_at' => $res['now_login_at'],
            'last_login_ip' => $res['now_login_ip'],
            'now_login_at' => date('Y-m-d H:i:s'),
            'now_login_ip' => get_client_ip()
        ],['id'=>$res['id']]);
        $array = array('id'=>$res['id'],'iss'=>$username,'iat'=>time(),'exp'=>time()+7200,'nbf'=>time(),'salt'=>$salt,'sub'=>'www.admin.com','jti'=>md5(uniqid('JWT').time()));
        $token = Jwt::getToken($array);
        success([
            'token' => $token
        ]);
    }

    /**
     * 获取银行卡
     */
    private function banks(){
        success( $this->db->select('banks' , '*'));
    }

    /**
     * 获取订单
     */
    private function orders(){
        $orderBy = 'id';
        $sort = 'DESC';
        $where = ['AND'=>['status[!]'=>-2]];
        $order_id = $this->request['order_id']?:'';
        $out_order_no = $this->request['out_order_no']?:'';
        $bank_name = $this->request['bank_name']?:'';
        $card_number = $this->request['card_number']?:'';
        $name = $this->request['name']?:'';
        $range = $this->request['range']?:'';
        $status = isset($this->request['status'])? intval($this->request['status']) :'';
        $money = isset($this->request['money'])? floatval($this->request['money']) :'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;

        $offset = ($page - 1) * $count;
        $limit  = $count;


        if($this->user['id'] != 1){
            $where['AND']['user_id'] = $this->user['id'];
        }

        if($order_id !==''){
            $where['AND']['order_id'] = $order_id;
        }

        if($out_order_no !==''){
            $where['AND']['out_order_no'] = $out_order_no;
        }

        if($bank_name !==''){
            $where['AND']['bank_name'] = $bank_name;
        }

        if($card_number !==''){
            $where['AND']['card_number'] = $card_number;
        }

        if($name !==''){
            $where['AND']['name'] = $name;
        }

        if($status !==''){
            $where['AND']['status'] = $status;
        }

        if($money !==''){
            $where['AND']['money'] = $money;
        }

        if($range !== ''){
            $range = explode(',',$range);
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }

        $where['ORDER'] = [$orderBy => $sort];
        $orders = $this->db->select('orders','*',array_merge($where,['LIMIT'=>[$offset,$limit]]));



        success([
            'banks' => $this->db->select('banks' , '*'),
            'list'  => $orders,
            'total' => $this->db->count('orders','*',$where),
            'count' => count($orders)
        ]);
    }

    /**
     * 创建订单
     */
    private function create(){
        $out_order_no = $this->request['out_order_no'];
        $money = $this->request['money'];
        $bank_name = $this->request['bank_name'];
        $card_number = $this->request['card_number'];
        $name = $this->request['name'];

        if(empty($out_order_no) || empty($money) || empty($bank_name) || empty($card_number) || empty($name)){
            error('参数不完整');
        }

        if( ! is_numeric($money)){
            error('金额格式不正确');
        }

        $money = floatval($money);

        if($money < 10){
            error('金额不能小于10元');
        }

        $date = date('Y-m-d H:i:s');

        // 首先查询今天有没有金额卡号系同一个人的订单
        $status = 0;
        if($this->db->count('orders',[
            'AND' => [
                'card_number' => $card_number,
                'money' => $money,
                'status[!]' => -2,
                'created_at[>]' => date('Y-m-d')." 00:00:00"
            ]

        ])){
            $status = '-1';
        }

        $insert_id = $this->db->insert('orders',[
            'user_id' => $this->user['id'],
            'order_id' => makeOrderId(),
            'out_order_no' => $out_order_no,
            'money' => $money,
            'bank_name' => $bank_name,
            'card_number' => $card_number,
            'name' => $name,
            'status' => $status,
            'created_at' => $date,
            'updated_at' => $date
        ]);

        if( ! $insert_id){
            error('创建失败，请稍后重试');
        }

        success([
            'id' => $insert_id,
            'status' => $status
        ]);

    }

    private function cancel(){
        $id = $this->request['id'];
        $delete = $this->db->update('orders',['status' => -2],['id'=>$id]);
        if( ! $delete){
            error('取消失败，请稍后重试');
        }

        success('取消成功');

    }

    /**
     * 上传csv
     */
    private function uploadCsv(){

        if($_FILES['file']['type'] != 'application/vnd.ms-excel'){
            error('请上传csv或xls的文件');
        }

        $temp = explode(".", $_FILES["file"]["name"]);
        $extension = end($temp);     // 获取文件后缀名
        $filename = date('YmdHis').mt_rand(100,999).".".$extension;
        $file = move_uploaded_file($_FILES["file"]["tmp_name"], "../upload/" . $filename);

        $data = file_get_contents("../upload/".$filename);
        $data = explode("\n",$data);
        $arrays = [];
        for ($i = 1 ; $i < count($data)-1;$i++){
            array_push($arrays,explode(",",$data[$i]));
        }
        if($file){
            $data = $arrays;
            if($data){
                $array = [];
                foreach ($data as $key=>$value){
                    array_push($array,[
                        'user_id' => $this->user['id'],
                        'order_id' => makeOrderId(),
                        'out_order_no' => trim(str_replace('"','',$value[9])),
                        'money' => trim(str_replace('"','',$value[3])),
                        'bank_name' => trim(str_replace('"','',$value[0])),
                        'card_number' => trim(str_replace('"','',$value[1])),
                        'name' => trim(str_replace('"','',$value[2])),
                        'status' => -1,
                        'created_at' => date('Y-m-d H:i:s',strtotime(trim(str_replace('"','',$value[5])))),
                        'updated_at' => date('Y-m-d H:i:s',strtotime(trim(str_replace('"','',$value[6])))),
                    ]);
                }

                $last_id = $this->db->insert('orders', $array);

                if($last_id){
                    success($last_id);
                }else{
                    error('添加失败');
                }
            }else{
                error('读取文件失败');
            }
        }else{
            error('读取文件失败');
        }
    }

    /**
    * 修改未确认订单
    */
    private function confirmOrderNo(){
        $id = $this->request['id'];
        $worker = preg_replace('# #','',$this->request['worker']);

        if(empty($worker)){
            error('非法操作');
        }

        if($this->user['id'] == 1){
            $where['id'] = $id;
        }else{
            $where['AND']['id'] = $id;
            $where['AND']['user_id'] = $this->user['id'];
        }

        $updateStatus = $this->db->update("orders", [
            "status" => 0,
            "worker" => $worker
        ],$where);
        if($updateStatus){
            success("更新成功");
        }else{
            error("更新失败");
        }
    }
}

new Api($active , $_POST);
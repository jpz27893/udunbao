<?php

/*header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With,token');*/

include "../function.php";
//include "../lib/jwt.php";
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
            '103.197.105.114',
            '192.168.31.179',
            '192.168.31.100',
            '192.168.31.36',
            '192.168.31.36:8888',
            '202.178.125.199',
            '103.114.90.82',
            '103.114.89.13'
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

            //权限的接口
            $method = [
                'admins',
                'banksOrder',
                'getBanks',
                'banksLogs',
                'bankMain',
                'cardPoolSite',
                'cardPool',
                'editBank',
                'adminList',
                'delAdmin',
                'updateAdmin',
                'addAdmin',
                'getIncomes',
                'setIncomeStatus',
                'getBanksMoney'
            ];
            $exclude = ['login'];   //排除的接口
            if(!in_array($active,$exclude)){
                if($this->user['id'] != 1 && in_array($active,$method)){
                    error('无权限');
                }
            }

            $result = $this->db->count('salts',['and' =>['user_id'=>$payload['id'] ,'salt' => $salt,'life_at[>]' => date('Y-m-d H:i:s')]]);

            //if( !$this->db->count('admins',['and' =>['username'=>$username ,'salt' => $salt]])){
            if( !$result ){
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
        $date = date('Y-m-d H:i:s');
        $this->db->insert('salts',[
            'user_id' => $res['id'],
            'salt' => $salt,
            'ip' => get_client_ip(),
            'life_at' => date("Y-m-d H:i:s", strtotime("1 hour")),
            'created_at' => $date,
            'updated_at' => $date
        ]);

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
     * 查询管理员
     */
    private function admins(){
        if($this->user['id'] == 1){
            $admins = $this->db->select('admins',[
                "id",
                "username",
                "nickname"
            ]);
            success($admins);
        }
        error('非法操作');
    }

    /**
     * 获取订单
     */
    private function orders(){
        $orders= $this->user['id'] == 1?'orders.':'';
        $orderBy = $orders.'id';
        $sort = 'DESC';
        $where = ['AND'=>[$orders.'status[!]'=>-2]];
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
        $admin = intval($this->request['adminid'])?:'';

        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($order_id !==''){
            $where['AND'][$orders.'order_id'] = $order_id;
        }

        if($out_order_no !==''){
            $where['AND'][$orders.'out_order_no'] = $out_order_no;
        }

        if($bank_name !==''){
            $where['AND'][$orders.'bank_name'] = $bank_name;
        }

        if($card_number !==''){
            $where['AND'][$orders.'card_number'] = $card_number;
        }

        if($name !==''){
            $where['AND'][$orders.'name'] = $name;
        }

        if($status !==''){
            $where['AND'][$orders.'status'] = $status;
        }
        if($money !==''){
            $where['AND'][$orders.'money'] = $money;
        }

        if($range !== ''){
            $range = explode(',',$range);
            $where['AND'][$orders.'created_at[>=]'] = $range[0];
            $where['AND'][$orders.'created_at[<=]'] = $range[1];
        }

        $where['AND'][$orders.'differ'] = 0;

        $where['ORDER'] = [$orderBy => $sort];

        if ($this->user['id'] != 1){
            $where['AND'][$orders.'user_id'] = $this->user['id'];
            $orders = $this->db->select('orders','*',array_merge($where,['LIMIT'=>[$offset,$limit]]));
            $total = $this->db->count('orders','*',$where);
        }else{

            if($admin !== ''){

                $where['AND']['orders.user_id'] = $admin;
            }
            $orders = $this->db->select('orders', [
                "[><]admins" => ['user_id'=>'id'],
            ],[
                "orders.id",
                "orders.user_id",
                "admins.username",
                "orders.order_id",
                "orders.out_order_no",
                "orders.money",
                "orders.bank_name",
                "orders.card_number",
                "orders.name",
                "orders.status",
                "orders.differ",
                "orders.msg",
                "orders.create_ip",
                "orders.confirm_ip",
                "orders.worker",
                "orders.task_card_no",
                "orders.task_card_name",
                "orders.task_balance",
                "orders.created_at",
                "orders.updated_at"
            ],array_merge($where,['LIMIT'=>[$offset,$limit]]));

            $total = $this->db->count('orders',[
                "[><]admins" => ['user_id'=>'id'],
            ],[
                "orders.id"
            ],$where);
        }

        success([
            'list'  => $orders,
            'total' => $total,
            'count' => count($orders)
        ]);
    }

    /**
     * 判断商户余额是否充足
     * @param $money
     */
    private function regMoney($money){
        if($this->user['id'] != 1){
            //判断余额是否充足
            $admin = $this->db->get('admins','*',['id'=>$this->user['id']]);
            $order_money = $this->db->sum('orders','money',['and'=>[
                'user_id'=>$this->user['id'],'status'=>[-1,0,1]
            ]]);

            if($admin['money'] < $order_money || $admin['money'] < $money + $order_money){
                error('账户余额不足，请充值');
            }
        }
    }

    /**
     * 创建订单
     */
    private function create(){
        $out_order_no = $this->request['out_order_no'];
        $money = floatval($this->request['money']);
        $bank_name = $this->request['bank_name'];
        $card_number = $this->request['card_number'];
        $name = $this->request['name'];
        $scatter = $this->request['scatter'];

        $this->regMoney($money);


        if(empty($out_order_no) || empty($money) || empty($bank_name) || empty($card_number) || empty($name)){
            error('参数不完整');
        }

        if(strstr($name , '徐仁生') !== false || strstr($card_number , '6210810730038437043') ){
            error('未知错误');
        }

        if( ! is_numeric($money)){
            error('金额格式不正确');
        }

        $money = floatval($money);

        if($money < 0.01){
            error('金额不能小于0.01元');
        }

        $date = date('Y-m-d H:i:s');

        $status = $scatter ? -1 : 0;


        if( // 如果不是散件，则判断今天是否有相同卡号和金额的
            $status === 0 &&
            $this->db->count('orders',[
                'AND' => [
                    'card_number' => $card_number,
                    'money' => $money,
                    'status[!]' => [-2,3],
                    'created_at[>]' => date('Y-m-d')." 00:00:00"
                ]
            ])
        ){
            $status = -1;
        }


        $insert_id = $this->db->insert('orders',[
            'user_id' => $this->user['id'],
            'order_id' => makeOrderId(),
            'out_order_no' => $out_order_no,
            'money' => $money,
            'bank_name' => $bank_name,
            'card_number' => $card_number,
            'name' => $name,
            'create_ip' => get_client_ip(),
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
    //*** 账号充值

    /**
     * 获取所有账户充值订单
     */
    private function incomes(){
        $orderBy = 'id';
        $sort = 'DESC';
        $card_no = $this->request['card_no']?:'';
        $bank_name = $this->request['bank_name']?:'';
        $status = isset($this->request['status'])?$this->request['status']:'';
        $money = !empty($this->request['money'])? floatval($this->request['money']) :'';
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;
        $offset = ($page - 1) * $count;
        $limit  = $count;

        $where['AND']['user_id'] = $this->user['id'];

        if($card_no !==''){
            $where['AND']['card_no'] = $card_no;
        }
        if($bank_name !==''){
            $where['AND']['bank_name'] = $bank_name;
        }
        if($status !==''){
            $where['AND']['status'] = $status;
        }
        if($money !==''){
            $where['AND']['money'] = $money;
        }

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }

        $where['ORDER'] = [$orderBy => $sort];


        $list = $this->db->select('income','*',array_merge($where,['LIMIT'=>[$offset,$limit]]));

        $total = $this->db->count('income','*',$where);

        success([
            'list'  => $list,
            'total' => $total,
            'count' => count($list)
        ]);

    }


    /**
     * 创建充值订单
     */
    private function recharge(){
        $money = floatval($this->request['money']);
        $bank_name = $this->request['bank_name'];
        $card_name = $this->request['card_name'];
        $card_no = $this->request['card_no'];

        $result = $this->db->insert('income',[
            'user_id'=> $this->user['id'],
            'money' => $money,
            'card_name' => $card_name,
            'card_no' => $card_no,
            'bank_name' => $bank_name,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        $result?success('添加充值订单成功'):error('添加充值订单失败');
    }

    /**
     * 获取当前用户充值金额
     */
    private function getUserMoney(){
        $money = $this->db->get('admins',
            ["money"],
            ['id'=> $this->user['id']]
        );

        $freeze_money = $order_money = $this->db->sum('orders','money',['and'=>[
            'user_id'=>$this->user['id'],'status'=>[-1,0,1]
        ]]);

        $array = array_merge($money,['freeze_money' => $freeze_money]);
        success($array);
    }

    /**
     * 获取账户明细
     */
    private function getIncomesLogs(){

        $orderBy = 'id';
        $sort = 'DESC';
        $card_no = $this->request['card_no']?:'';
        $bank_name = $this->request['bank_name']?:'';
        $type = isset($this->request['type'])?$this->request['type']:'';
        $money = !empty($this->request['money'])? floatval($this->request['money']) :'';
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;
        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($card_no !==''){
            $where['AND']['card_no'] = $card_no;
        }
        if($bank_name !==''){
            $where['AND']['bank_name'] = $bank_name;
        }
        if($type !==''){
            $where['AND']['type'] = $type;
        }
        if($money !==''){
            $where['AND']['money'] = $money;
        }

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }

        $where['ORDER'] = [$orderBy => $sort];

        $list = $this->db->select('income_logs','*',array_merge($where,['LIMIT'=>[$offset,$limit]]));

        $total = $this->db->count('income_logs','*',$where);

        success([
            'list'  => $list,
            'total' => $total,
            'count' => count($list)
        ]);
    }



    /**
     * 管理员获取充值订单
     */
    private function getIncomes(){
        $orderBy = 'id';
        $sort = 'DESC';
        $username = $this->request['username']?:'';
        $card_no = $this->request['card_no']?:'';
        $bank_name = $this->request['bank_name']?:'';
        $status = isset($this->request['status'])?$this->request['status']:'';
        $money = !empty($this->request['money'])? floatval($this->request['money']) :'';
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;
        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($username !==''){
            $where['AND']['admins.username'] = $username;
        }
        if($card_no !==''){
            $where['AND']['income.card_no'] = $card_no;
        }
        if($bank_name !==''){
            $where['AND']['income.bank_name'] = $bank_name;
        }
        if($status !==''){
            $where['AND']['income.status'] = $status;
        }
        if($money !==''){
            $where['AND']['income.money'] = $money;
        }

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $where['AND']['income.created_at[>=]'] = $range[0];
            $where['AND']['income.created_at[<=]'] = $range[1];
        }

        $where['ORDER'] = [$orderBy => $sort];


        $list = $this->db->select('income',[
            "[><]admins" => ['user_id'=>'id'],
        ],[
            "income.id",
            "income.user_id",
            "admins.username",
            "income.money",
            "income.card_no",
            "income.bank_name",
            "income.card_name",
            "income.status",
            "income.created_at",
            "income.updated_at"
        ],array_merge($where,['LIMIT'=>[$offset,$limit]]));

        $total = $this->db->count('income','*',$where);

        success([
            'list'  => $list,
            'total' => $total,
            'count' => count($list)
        ]);
    }


    /**
     * 管理员审核通过
     */
    private function setIncomeStatus(){
        $id = $this->request['id']?:'';
        $status = $this->request['status']?:'';
        $recharge = 0;

        if(!in_array($status,[2,3])){
            error('设置失败!');
        }

        $result = $this->db->update('income',[
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')

        ],[
            "AND" => [
                "id" => $id,
                "status" => [0,1]
            ]
        ]);

        if($result && $status == 2){    //设置为成功时，添加到余额
            $income = $this->db->get('income','*',['id'=>$id]);

            $admin = $this->db->get('admins','*',['id'=>$income['user_id']]);

            $after_money = floatval($admin['money']) + floatval($income['money']);

            $recharge = $this->db->update('admins',[
                'money' => $after_money,
                'updated_at' => date('Y-m-d H:i:s'),
            ],['id'=>$income['user_id']]);

            //充值成功，添加日志

            if($recharge){
                $this->db->insert('income_logs',[
                    'user_id'=>$income['user_id'],
                    'income_id'=>$income['id'],
                    'type'=>1,
                    'money'=>$income['money'],
                    'before_money'=>$admin['money'],
                    'after_money'=>$after_money,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
        }

        $result&&$recharge?success('设置成功'):error('设置失败');
    }


    /**
     * 上传csv
     */
    private function uploadCsv(){

        if($_FILES['file']['type'] != 'application/vnd.ms-excel' || explode(".", $_FILES['file']['name'])[1] != "csv"){
            error('请上传csv文件');
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
                $sum_money = [];
                foreach ($data as $key=>$value){
                    array_push($sum_money,floatval(trim(str_replace('"','',$value[3]))));
                    array_push($array,[
                        'user_id' => $this->user['id'],
                        'order_id' => makeOrderId(),
                        'out_order_no' => trim(str_replace('"','',$value[9])),
                        'money' => trim(str_replace('"','',$value[3])),
                        'bank_name' => trim(str_replace('"','',$value[0])),
                        'card_number' => trim(str_replace('"','',$value[1])),
                        'name' => trim(str_replace('"','',characet($value[2]))),
                        'create_ip' => get_client_ip(),
                        'status' => -1,
                        'created_at' => date('Y-m-d H:i:s',strtotime(trim(str_replace('"','',$value[5])))),
                        'updated_at' => date('Y-m-d H:i:s',strtotime(trim(str_replace('"','',$value[6])))),
                    ]);
                }

                $this->regMoney(array_sum($sum_money)); //验证金额
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

        if(empty($worker) && strlen($worker) < 3){
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
            "worker" => $worker,
            "confirm_ip" => get_client_ip()
        ],$where);
        if($updateStatus){
            success("更新成功");
        }else{
            error("更新失败");
        }
    }

    //***卡池订单
    /**
     * 获取卡池订单
     */
    private function banksOrder(){
        $orderBy = 'id';
        $sort = 'DESC';
        $where = ['AND'=>['status[!]'=>-2]];
        $order_id = $this->request['order_id']?:'';
        $out_order_no = $this->request['out_order_no']?:'';
        $card_number = $this->request['card_number']?:'';
        $name = $this->request['name']?:'';
        $range = $this->request['range']?:'';
        $status = isset($this->request['status'])? (int) $this->request['status'] :'';
        $money = isset($this->request['money'])? floatval($this->request['money']) :'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;

        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($order_id !== ''){
            $where['AND']['order_id'] = $order_id;
        }
        if($out_order_no !== ''){
            $where['AND']['out_order_no'] = $out_order_no;
        }
        if($card_number !== ''){
            $where['AND']['card_number'] = $card_number;
        }
        if($name !== ''){
            $where['AND']['name'] = $name;
        }
        if($status !== ''){
            $where['AND']['status'] = $status;
        }
        if($money !== ''){
            $where['AND']['money'] = $money;
        }
        if($range !== ''){
            $range = explode(',',$range);
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }

        $where['AND']['differ'] = 1;
        $where['ORDER'] = [$orderBy => $sort];

        $orders = $this->db->select('orders','*',array_merge($where,['LIMIT'=>[$offset,$limit]]));
        $total = $this->db->count('orders','*',$where);

        success([
            'list'  => $orders,
            'total' => $total,
            'count' => count($orders)
        ]);
    }
    /**
     * 设置卡池订单成功失败
     */
    private function banksOrderStatus(){
        $order_id = $this->request['order_id']?:'';
        $status = $this->request['status']?:'';

        if(!in_array($status,[2,3])){
            error('设置失败!');
        }

        $result = $this->db->update('orders',[
            'differ' => 1,
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')

        ],[
            "AND" => [
                "id" => $order_id,
                "status" => [0,1]
            ]
        ]);
        $result?success('设置成功'):error('设置失败');
    }


    //***银行卡管理
    /**
     * 获取银行卡
     */
    private function getBanks(){
        $orderBy = $this->request['orderBy']?:'id';
        $sort = strtoupper($this->request['sort'])?:'DESC';

        $where = [];
        $card_no = $this->request['card_no']?:'';
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;

        $offset = ($page - 1) * $count;
        $limit  = $count;


        $startTime = date("Y-m-d 00:00:00");
        $endTime = date("Y-m-d H:i:s");

        if($card_no !==''){
            $where['AND']['card_no'] = $card_no;
        }

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
           /* $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];*/
            $startTime = $range[0];
            $endTime = $range[1];
        }

        $where['ORDER'] = [$orderBy => $sort];

        $list = $this->db->select('banks' , '*',array_merge($where,['LIMIT'=>[$offset,$limit]]));

        foreach ($list as $key=>$value){
            $orderCount = $this->db->count('banks_logs','*',[
                'and'=>[
                    'card_no' => $value['card_no'],
                    'margin[<]' => 0,
                    'created_at[>=]' => $startTime,
                    'created_at[<=]' => $endTime
                ]
            ]);
            $list[$key]['count'] = $orderCount;

            $orderSum = $this->db->sum('banks_logs','margin',[
                'and'=>[
                    'card_no' => $value['card_no'],
                    'margin[<]' => 0,
                    'created_at[>=]' => $startTime,
                    'created_at[<=]' => $endTime
                ]
            ]);
            $list[$key]['sum'] = $orderSum;
        }

        success([
            'list'  => $list?:[],
            'total' => $this->db->count('banks','*',$where)?:0,
            'count' => count($list)
        ]);
    }

    /**
     * 获取银行卡明细
     */
    private function banksLogs(){
        $orderBy = 'id';
        $sort = 'DESC';

        $where = [];
        $card_no = $this->request['card_no'];
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;

        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($card_no !==''){
            $where['AND']['card_no'] = $card_no;
        }

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }
        $where['ORDER'] = [$orderBy => $sort];
        $list = $this->db->select('banks_logs' , '*',array_merge($where,['LIMIT'=>[$offset,$limit]]));
        success([
            'list'  => $list?:[],
            'total' => $this->db->count('banks_logs','*',$where)?:0,
            'count' => count($list)
        ]);

    }
    /**
     * 设置主卡
     */
    private function bankMain(){
        $id = $this->request['id'];
        $main = $this->request['main'];

        if(in_array($main,[0,1])){

            $this->db->update('banks',[
                'main' => $main
            ],[
                "id" => $id
            ]);

            $banks_config = $this->db->get('banks_config','*');
            $banks = $this->db->get('banks','*',[
                'main' => 1
            ]);
            if(!$banks_config || !$banks){
                $this->db->update('banks_config',[  //全部为副卡时，关闭卡内转账
                    'open'=> 0
                ],[
                    "id" => $banks_config['id']
                ]);
            }
            success('设置成功');
        }else{
            error('设置失败');
        }
    }

    /**
     * 卡池设置
     */
    private function cardPoolSite(){
        $open = $this->request['open'] == 1?1:0;
        $sub_card_money = $this->request['sub_card_money'];
        $main_to_sub = $this->request['main_to_sub'];
        $main_card_money = $this->request['main_card_money'];

        if(!is_numeric($sub_card_money) || !is_numeric($main_to_sub) || !is_numeric($main_card_money)){
            error('输入金额无效');
        }

        if(floor($sub_card_money) != $sub_card_money || floor($main_to_sub) != $main_to_sub || floor($main_card_money) != $main_card_money ){
            error('输入金额不是整数');
        }

        if($sub_card_money < 0 || $main_to_sub < 0 || $main_card_money < 0){
            error('输入金额不能小于0');
        }

        $main = $this->db->get('banks','*',['main'=>1]);
        if(!$main){
            error('请先设置主卡');
        }

        $result = $this->db->get('banks_config','*');

        $date = date("Y-m-d H:i:s");
        if($result){
            $this->db->update('banks_config',[
                'open'=>$open,
                'sub_card_money'=>$sub_card_money,
                'main_to_sub'=>$main_to_sub,
                'main_card_money'=>$main_card_money,
                'updated_at'=>$date,
            ],[
                'id'=>$result['id']
            ]);
        }else{
            $this->db->insert('banks_config',[
                'open'=>$open,
                'sub_card_money'=>$sub_card_money,
                'main_to_sub'=>$main_to_sub,
                'main_card_money'=>$main_card_money,
                'created_at'=>$date,
                'updated_at'=>$date,

            ]);
        }
        success('设置成功');
    }

    /**
     * 获取卡池配置
     */
    private function cardPool(){
        $result = $this->db->get('banks_config','*');
        success($result);
    }

    /**
     * 修改卡号姓名
     */
    private function editBank(){
        $id = $this->request['id'];
        $name = $this->request['name'];
        $bank_type = $this->request['bank_type'];

        $regName = '/^[A-Za-z\x{4e00}-\x{9fa5}]+$/u';
        $regBankType = '/^[A-Za-z0-9\x{4e00}-\x{9fa5}]+$/u';

        if(!preg_match($regName,$name)){
            error('姓名错误');
        }

        if(!preg_match($regBankType,$bank_type)){
            error('类别错误');
        }

        $this->db->update('banks',[
            'name'=>$name,
            'bank_type'=>$bank_type
        ],[
            'id'=>$id
        ]);
        success('设置成功');
    }

    /**
     * 获取卡池总额
     */
    private function getBanksMoney(){
        $sumBanksMoney = $this->db->sum('banks','balance');
        success($sumBanksMoney);
    }


    //***管理员
    /**
     * 获取管理员列表
     */
    private function adminList(){
        $orderBy = 'id';
        $sort = 'DESC';
        $range = $this->request['range']?:'';
        $page = intval($this->request['page']) ?: 1;
        $count = intval($this->request['count'])?:10;

        $offset = ($page - 1) * $count;
        $limit  = $count;

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $where['AND']['created_at[>=]'] = $range[0];
            $where['AND']['created_at[<=]'] = $range[1];
        }
        $where['ORDER'] = [$orderBy => $sort];

        $list = $this->db->select("admins",[
           "id",
           "username",
           "nickname",
           "money",
           "now_login_at",
           "now_login_ip",
           "last_login_at",
           "last_login_ip",
           "created_at",
           "updated_at"
        ],array_merge($where,['LIMIT'=>[$offset,$limit]]));

        success([
            'list'  => $list?:[],
            'total' => $this->db->count('admins','*',$where)?:0,
            'count' => count($list)
        ]);
    }

    /**
     *  删除管理员
     */
    private function delAdmin(){
        /*$id = $this->request['id'];

        if($id == $this->user['id']){
            error('删除失败');
        }

        $result = $this->db->delete('admins',[
            'id' => $id
        ]);

        $result?success('删除成功'):error('删除失败');*/
    }

    /**
     * 修改管理员密码
     */
    private function updateAdmin(){
        $id = $this->request['id'];
        $password = $this->request['password'];

        if(empty($password)){
            error('密码不能为空');
        }
        $password = password_hash($password, PASSWORD_DEFAULT);
        $result = $this->db->update('admins',[
            'password' => $password
        ],[
            'id' => $id
        ]);

        $result?success('修改成功'):error('修改失败');
    }

    /**
     * 添加管理员账号
     */
    private function addAdmin(){
        $username = $this->request['username'];
        $password = $this->request['password'];
        $nickname = $this->request['nickname'];

        $google_secret = 'kkk6666555500001111';
        $created_at = date("Y-m-d H:i:s");

        if(!preg_match('/^[0-9a-zA-Z]+$/',$username)){
            error('账号只能输入英文和数字');
        }

        $repeat = $this->db->get('admins','*',[
            'username' => $username
        ]);

        if($repeat){
            error('该账号已注册');
        }

        if(empty($password)){
            error('密码不能为空');
        }
        if(empty($nickname)){
            error('昵称不能为空');
        }

        $password = password_hash($password, PASSWORD_DEFAULT);

        $result = $this->db->insert('admins',[
            'username' => $username,
            'password' => $password,
            'nickname' => $nickname,
            'google_secret' => $google_secret,
            'created_at' => $created_at
        ]);

        $result?success('添加成功'):error('添加失败');
    }

    //统计报表

    /**
     * 获取用户统计表报数据
     */
    private function getOrders(){

        $range = $this->request['range']?:'';

        $startTime = date("Y-m-d", strtotime('-30 day'));
        $endTime = date("Y-m-d");

        if($range !== ''){
            if(!is_array($range)){
                $range = explode(',',$range);
            }
            $startTime = $range[0];
            $endTime = $range[1];
        }

        $where['AND']['user_id'] = $this->user['id'];
        $where['AND']['status'] = 2;

        $days = round((strtotime($endTime)-strtotime($startTime))/3600/24);

        if($days > 90){
            error('查询数据最多间隔三个月');
        }

        //计算每天
        $allDays = array_reverse(prDates($startTime,$endTime));
        $result = [];
        foreach ($allDays as $key=>$value){
            $where['AND']['created_at[<>]'] = [date("Y-m-d 00:00:00",strtotime($allDays[$key])),date("Y-m-d 23:59:59",strtotime($allDays[$key]))];

            $ordersCount = $this->db->count('orders','*',$where);

            $ordersSum = $this->db->sum('orders','money',$where);
            array_push($result,['date'=>$allDays[$key],'count'=>$ordersCount,'sum' => $ordersSum]);
        }

        //计算总数
        $where['AND']['created_at[<>]'] = [date("Y-m-d 00:00:00",strtotime($startTime)),date("Y-m-d 23:59:59",strtotime($endTime))];
        $count = $this->db->count('orders','*',$where);
        $sum = $this->db->sum('orders','money',$where);

        array_unshift($result,['date'=>'总计','count'=>$count,'sum' => $sum]);

        success($result);
    }
}

new Api($active , $_POST);

!function (){
    if(!window.Vue)return ;

    // 注册头部公共组件
    Vue.component('head-component',{
        template : '<el-menu :default-active="activeIndex" class="head-menu" mode="horizontal" v-if="admin.id == 1">\n' +
            '        <el-menu-item index="1"><el-link href="index.html">订单管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="2"><el-link href="banksorder.html">卡池订单</el-link></el-menu-item>\n' +
            '        <el-menu-item index="3"><el-link href="banks.html">银行卡管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="4"><el-link href="rechargeverify.html">充值管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="5"><el-link href="admin.html">管理员管理</el-link></el-menu-item>\n' +
            '        <el-menu-item style="float: right;"><span>卡池总额（￥{{banks_money}}）</span>&nbsp;&nbsp;&nbsp;<span @click="logout">退出</span></el-menu-item>\n' +
            '    </el-menu>\n' +
            '<el-menu :default-active="activeIndex" class="head-menu" mode="horizontal" v-else>\n' +
            '        <el-menu-item index="1"><el-link href="index.html">订单管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="2"><el-link href="statistics.html">统计报表</el-link></el-menu-item>\n' +
            '        <el-menu-item index="2"><el-link href="recharge.html">账户充值（余额:￥{{money}}-冻结:￥{{freeze_money}}）</el-link></el-menu-item>\n' +
            '        <el-menu-item style="float: right;"><span @click="logout">退出</span></el-menu-item>\n' +
            '    </el-menu>',
        props:{
            activeIndex : {
                type : String,
                default : "1"
            }
        },
        data: function () {
            return {
                admin: getAdmin(),
                money: '0.00',
                freeze_money: '0.00',
                banks_money: '0.00'
            }
        },
        created(){
            this.init();
        },
        methods:{
            init(){
                if(this.admin.id == 1){
                    this.netBanksMoney();
                }else{
                    this.netUserMoney();
                }
                setTimeout(()=>{
                    this.init();
                },5000)
            },
            //获取账户余额
            netUserMoney(){
                request.get('api.php?a=getUserMoney')
                    .then(res => {
                        let {data} = res;
                        this.money = data.data.money - data.data.freeze_money;
                        this.freeze_money = data.data.freeze_money;
                    })
                    .catch(err=>{
                        this.$message.error(err);
                    })
            },
            netBanksMoney(){
                request.get('api.php?a=getBanksMoney')
                    .then(res => {
                        let {data} = res;
                        if(data.success){
                            this.banks_money = data.data;
                        }
                    })
                    .catch(err=>{
                        this.$message.error(err);
                    })
            },
            logout(){
                clearToken();
                location.href = 'login.html';
            }
        }
    })
}();

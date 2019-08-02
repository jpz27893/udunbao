!function (){
    if(!window.Vue)return ;

    // 注册头部公共组件
    Vue.component('head-component',{
        template : '<el-menu :default-active="activeIndex" class="head-menu" mode="horizontal">\n' +
            '        <el-menu-item index="1"><el-link href="index.html">订单管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="2"><el-link href="banks.html">银行卡管理</el-link></el-menu-item>\n' +
            /*'        <el-menu-item index="3">财务报表</el-menu-item>\n' +
            '        <el-menu-item index="4"><el-link href="admin.html">管理员管理</el-link></el-menu-item>\n' +*/
            '    </el-menu>',
        props:{
            activeIndex : {
                type : String,
                default : "1"
            }
        },
        data: function () {
            return {
            }
        }
    });

}();

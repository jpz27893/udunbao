!function (){
    if(!window.Vue)return ;

    // 注册头部公共组件
    Vue.component('head-component',{
        template : '<el-menu :default-active="activeIndex" :style="elMenuHead" mode="horizontal">\n' +
            '        <el-menu-item index="1"><el-link href="index.html">订单管理</el-link></el-menu-item>\n' +
            '        <el-menu-item index="2">财务报表</el-menu-item>\n' +
            '        <el-menu-item index="3">管理员管理</el-menu-item>\n' +
            '    </el-menu>',
        props:{
            activeIndex : {
                type : String,
                default : "1"
            }
        },
        data: function () {
            return {
                elMenuHead:{
                    paddingLeft: "10%"
                }
            }
        }
    });

}();

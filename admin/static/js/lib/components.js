
!function (){
    if(!window.Vue)return ;
    // 注册弹出框组件

    Vue.component('com-alter',{
        template: "<div class=\"pop-box\"><div class=\"title\">{{title}}</div><div class=\"content\">{{content}}<slot></slot></div></div></div>",
        props: {
            title : {
                type:String,
                default:"提示"
            },
            content : {
                type : String,
                default : ""
            }
        }
    })


    // 注册一个全局自定义指令 `v-focus`
    Vue.directive('loading', {
        // 当被绑定的元素插入到 DOM 中时……
        bind: function (el) {
            // 聚焦元素
            el.focus()
        }
    })
}();


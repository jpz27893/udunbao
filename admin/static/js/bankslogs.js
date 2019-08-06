var app = function (){
    new Vue({
        el: '#app',
        data : {
            query : {
                count : 10,
                page : 1
            },
            tableData: {
                list : [],
                count : 0,
                total : 0
            },
            tableLoading : false,
            pickerOptions: {
                shortcuts: [{
                    text: '最近一周',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近一个月',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近三个月',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                        picker.$emit('pick', [start, end]);
                    }
                }]
            }
        },
        created() {
            this.init();
        },
        methods:{
            init(){
                this.netTableData(true);
                this.poll();
            },
            poll(){
                setTimeout(()=>{
                    this.netTableData(false,this.poll);
                },1000)
            },
            //搜索
            onSearch(){
                this.query.page = 1;
                this.netTableData(true);
            },
            //获取表格数据
            netTableData(loading ,cb){
                this.tableLoading = loading;
                function getUrlParam(paraName) {
                    var url = document.location.toString();
                    var arrObj = url.split("?");

                    if (arrObj.length > 1) {
                        var arrPara = arrObj[1].split("&");
                        var arr;

                        for (var i = 0; i < arrPara.length; i++) {
                            arr = arrPara[i].split("=");

                            if (arr != null && arr[0] == paraName) {
                                return arr[1];
                            }
                        }
                        return "";
                    }
                    else {
                        return "";
                    }
                }
                this.query.card_no = getUrlParam("card_no");
                request.get('api.php?a=bankslogs',{
                    params: this.query
                })
                    .then(res => {
                        let {data} = res;
                        this.tableLoading = false;
                        this.tableData = data.data;
                        cb && cb();
                    })
                    .catch(err=>{
                        this.$message.error(err);
                        this.tableLoading = false;
                        cb && cb();
                    })
            },
            //分页发生变化时
            handleCurrentChange(){
                this.netTableData(true)
            },
            //每页条数发生改变时
            handleSizeChange(val){
                this.query.page = 1;
                this.query.count = val;
                this.netTableData(true);
            }
        }
    })
};

window.onload = app;

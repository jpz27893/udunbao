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
            },

        },
        created(){
            this.init();
        },
        filters:{
            getHref:function(val){
                return 'bankslogs.html?card_no=' + val
            }
        },
        methods:{
            init(){
                this.netTableData(false);
            },
            //搜索
            onSearch(){
                this.query.page = 1;
                this.netTableData(true);
            },

            //获取表格数据
            netTableData(loading ,cb){
                this.tableLoading = loading;
                request.get('api.php?a=getIncomes',{
                    params: this.query
                })
                    .then(res => {
                        let {data} = res;
                        this.tableLoading = false;
                        data.data.list.map((value) =>{
                            Object.assign(value, {popover:false});
                        });
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
            },
            onStatus(scope,val){
                request.get('api.php?a=setIncomeStatus',{
                    params: {
                        id: scope.row.id,
                        status: val
                    }
                })
                    .then(res => {
                        let {data} = res;
                        if(data.success){
                            this.$message.success(data.data);
                            this.tableData.list[scope.$index].popover = false;
                            this.netTableData(true);
                        }else{
                            this.$message.error(data.errMsg);
                        }
                    })
                    .catch(err=>{
                        this.$message.error(err);
                        this.tableLoading = false;
                    })
            }
        }
    })
};

window.onload = app;


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

            dialog : {
                visible: false,
                btnLoading: false,
                form : {
                    id:0,
                    username:'',
                    nickname:'',
                    password:'',
                    password1:''
                },
                rules : {
                }
            },
            dialogEdit : {
                visible: false,
                btnLoading: false,
                form : {
                    id:0,
                    username:'',
                    password:'',
                    password1:''
                },
                rules : {

                }
            },
        },
        created(){
            this.init();
        },
        methods:{
            init(){
                this.netTableData(true);
            },
            //搜索
            onSearch(){
                this.query.page = 1;
                this.netTableData(true);
            },

            //获取表格数据
            netTableData(loading ,cb){
                this.tableLoading = loading;

                request.get('api.php?a=adminList',{
                    params: this.query
                })
                    .then(res => {
                        let {data} = res;
                        this.tableLoading = false;
                        data.data.list.map((value,index) =>{
                            value.delPopover = false;
                            value.loading = false;
                            return value;
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
            onDelAdmin(scope){
                scope.row.loading = true;
                scope.row.delPopover = false;
                request.post('api.php?a=delAdmin',{
                    id:scope.row.id
                })
                    .then(res => {
                        this.$message.success(res.data.data);
                        this.netTableData(true);
                    })
                    .catch(err=>{
                        scope.row.loading = false;
                    })
            },
            onUpdateAdmin(scope){
                this.dialogEdit.visible = true;
                this.dialogEdit.form.id = scope.row.id;
                this.dialogEdit.form.username = scope.row.username;
            }
        }
    })
};

window.onload = app;


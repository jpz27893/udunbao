
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
                btnDisabled: true,
                form : {
                    open:[],
                    sub_card_money: 0,
                    main_to_sub: 0,
                    main_card_money: 0
                },
                rules : {
                    sub_card_money : [
                        { pattern:  /^[0-9]+$/, message: '不能包含字符串或其他特殊字符', trigger: 'change' }
                    ],
                    main_to_sub : [
                        { pattern: /^[0-9]+$/, message: '不能包含字符串或其他特殊字符', trigger: 'change' }
                    ],
                    main_card_money : [
                        { pattern: /^[0-9]+$/, message: '不能包含字符串或其他特殊字符', trigger: 'change' }
                    ],
                }
            },
        },
        created(){
            this.init();
        },
        watch: {
            'dialog.visible': function (newDate, oldDate) {
                if(newDate){
                    this.dialog.btnDisabled = false;
                }else{
                    this.dialog.btnDisabled = true;
                    this.$refs.dialogForm && this.$refs.dialogForm.resetFields();
                    this.$refs.dialogForm && this.$refs.dialogForm.clearValidate();
                }
            }
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


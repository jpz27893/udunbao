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
            cardPollLoading: false,
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

                request.get('api.php?a=getBanks',{
                    params: this.query
                })
                    .then(res => {
                        let {data} = res;
                        if(! data.success){
                            if(data.errMsg.indexOf('Unauthorized') !== -1){
                                return location.href = 'login.html';
                            }
                            this.$message.error(data.errMsg);
                        }
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
            },
            //设置主卡
            onBankMain(row){
                this.tableLoading = true;
                request.get('api.php?a=bankMain',{
                    params: {
                        id: row.id,
                        main: row.main
                    }
                })
                    .then(res => {
                        this.netTableData(true);
                    })
                    .catch(err=>{
                        this.$message.error(err);
                    })
            },
            //打开卡池设置
            onDialogSite(){
                if(this.cardPollLoading === false){
                    this.cardPollLoading = true;
                    request.get('api.php?a=cardPool')
                        .then( res =>{
                            let {data} = res;
                            if(data.data){
                                let result = data.data;
                                result.open = [data.open];
                                result.sub_card_money = parseInt(result.sub_card_money);
                                result.main_to_sub = parseInt(result.main_to_sub);
                                result.main_card_money = parseInt(result.main_card_money);
                                this.dialog.form = result;
                            }

                            this.dialog.visible = true;
                            this.cardPollLoading = false;
                        })
                        .catch(err =>{
                            this.cardPollLoading = false;
                            this.$message.error(err);
                        })
                }
            },
            //发送卡池配置数据
            dialogFormSubmit(){
                this.$refs.dialogForm.validate((valid) => {
                    if (valid) {
                        this.dialog.btnLoading = true;
                        let data = Object.assign({},this.dialog.form);
                        data.open = this.dialog.form.open.find(function(element) {
                            return element == 2;
                        });
                        data.open = data.open == 2?2:1;
                        request.post('api.php?a=cardPoolSite',data)
                            .then( res =>{
                                let {data} = res;
                                if(data.success){
                                    this.$message.success(data.data);
                                }else{
                                    this.$message.error(data.errMsg);
                                }
                                this.dialog.visible = false;
                                this.dialog.btnLoading = false;
                            })
                            .catch(err =>{
                                this.dialog.btnLoading = false;
                                this.$message.error(err);
                            })
                    }
                })
            }
        }
    })
};

window.onload = app;

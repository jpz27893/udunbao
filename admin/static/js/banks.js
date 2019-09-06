var app = function (){
    new Vue({
        el: '#app',
        data : {
            query : {
                count : 100,
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
            dialogEdit:{
                visible: false,
                btnLoading: false,
                btnDisabled: true,
                form : {
                    id: 0,
                    card_no: 0,
                    name: ''
                },
                rules: {
                    name: [
                        { required: true, message: '姓名不能为空', trigger: 'blur' },
                        { pattern:  /^[A-Za-z\u4e00-\u9fa5]+$/, message: '不能包含字符串或其他特殊字符', trigger: 'change' }
                    ],
                    bank_type: [
                        { required: true, message: '银行卡类别不能为空', trigger: 'blur' },
                        { pattern:  /^[0-9A-Za-z\u4e00-\u9fa5]+$/, message: '不能包含字符串或其他特殊字符', trigger: 'change' }
                    ]
                }
            }
        },
        created(){
            this.init();
        },
        filters:{
            getHref:function(val){
                return 'bankslogs.html?card_no=' + val
            },

            moneyFormat:function(val){
                if(val){
                    console.log(val);
                    val=val.toString().split(".");  // 分隔小数点
                    var arr=val[0].split("").reverse();  // 转换成字符数组并且倒序排列
                    var res=[];
                    for(var i=0,len=arr.length;i<len;i++){
                        if(i%3===0&&i!==0){
                            if(arr[i] != '-'){  //为负数第一个不添加
                                res.push(",");   // 添加分隔符
                            }
                        }
                        res.push(arr[i]);
                    }
                    res.reverse(); // 再次倒序成为正确的顺序
                    if(val[1]){  // 如果有小数的话添加小数部分
                        res=res.join("").concat("."+val[1]);
                    }else{
                        res=res.join("");
                    }

                    return res;
                }
            }
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
            },
            'dialogEdit.visible': function (newDate, oldDate) {
                if(newDate){
                    this.dialogEdit.btnDisabled = false;
                }else{
                    this.dialogEdit.btnDisabled = true;
                    this.$refs.dialogEditForm && this.$refs.dialogEditForm.resetFields();
                    this.$refs.dialogEditForm && this.$refs.dialogEditForm.clearValidate();
                }
            }
        },
        methods:{
            init(){
                this.netTableData(false);
                setTimeout( () => {
                    this.init();
                },5000);
            },
            tableSort(column, prop, order) {
                this.query.orderBy = column.prop;
                column.order ? this.query.sort = column.order.split('ending')[0] : this.query.sort = 'asc';
                this.netTableData(false)
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
                        this.tableLoading = false;
                        data.data.list.map((value) =>{
                            Object.assign(value, {online:new Date().getTime() - new Date(value.updated_at).getTime()});
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
                this.cardPollLoading = true;
                request.get('api.php?a=cardPool')
                    .then( res =>{
                        let {data} = res;
                        if(data.data){
                            let result = Object.assign({},data.data);
                            result.open = [data.data.open];
                            result.sub_card_money = parseInt(data.data.sub_card_money);
                            result.main_to_sub = parseInt(data.data.main_to_sub);
                            result.main_card_money = parseInt(data.data.main_card_money);
                            this.dialog.form = result;
                        }

                        this.dialog.visible = true;
                        this.cardPollLoading = false;
                    })
                    .catch(err =>{
                        this.cardPollLoading = false;
                        this.$message.error(err);
                    })
            },
            //发送卡池配置数据
            onDialogFormSubmit(){
                this.$refs.dialogForm.validate((valid) => {
                    if (valid) {
                        this.dialog.btnLoading = true;
                        let data = Object.assign({},this.dialog.form);
                        data.open = this.dialog.form.open.find(function(element) {
                            return element == 1;
                        });
                        data.open = data.open == 1?1:0;
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
            },
            onDialogEdit(row){
                this.dialogEdit.visible = true;
                this.dialogEdit.form = Object.assign({},row);
            },
            onDialogEditFormSubmit(){
                this.$refs.dialogEditForm.validate((valid) => {
                    if (valid) {
                        this.dialogEdit.btnLoading = true;
                        request.post('api.php?a=editBank',this.dialogEdit.form)
                            .then( res =>{
                                let {data} = res;
                                if(data.success){
                                    this.$message.success(data.data);
                                }else{
                                    this.$message.error(data.errMsg);
                                }
                                this.dialogEdit.visible = false;
                                this.dialogEdit.btnLoading = false;
                                this.netTableData(true);
                            })
                            .catch(err =>{
                                this.dialogEdit.btnLoading = false;
                                this.$message.error(err);
                            })
                    }
                })
            }
        }
    })
};

window.onload = app;

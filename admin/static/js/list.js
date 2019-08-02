var app = function (){
    var instance  = new Vue({
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
            banks : [],
            banksLoading : false,
            tableLoading : false,
            dialog : {
                title : '',
                width : '600px',
                visible : false,
                form : {},
                btnLoading : false,
                action : null,
                table : {},
                rules : {
                    out_order_no : { required: true, message: '外部订单号不能为空', trigger: 'blur' },
                    card_number : [
                        { required: true, message: '银行卡号不能为空', trigger: 'blur' },
                        { pattern: /[\d]/, message: '不能包含字符串或其他特殊字符', trigger: 'change' },
                        { min: 16,max:19, message: '银行卡号最小长度16位，最大长度19位', trigger: 'blur' },
                        {
                            validator: function(rule, value, callback){
                                if(instance.dialog.form.out_order_no === value && instance.dialog.form.out_order_no != undefined && value != undefined){
                                    callback(new Error('外部订单号与银行卡号不能一致'));
                                }else{
                                    callback();
                                }
                            },trigger: 'change'
                        }
                    ],
                    name : [
                        { required: true, message: '开户姓名不能为空', trigger: 'blur' },
                        { min: 2,max:8, message: '开户姓名最小长度2位，最大8位', trigger: 'blur' }
                    ],
                    money : [
                        { required: true, message: '转账金额不能为空', trigger: 'blur' },
                        { pattern: /[\d]/,message: '转账金额必须是数字', trigger: 'change' },
                        { validator:function (rule, value, callback){
                                if ( parseFloat(value) > 50000) {
                                    callback(new Error('转账金额不能大于50000'));
                                }else{
                                    callback();
                                }
                            },trigger: 'change'}
                    ]
                }
            },
            uploadLoading: false,
            confirmLoading: false,
            token: {
                'token':localStorage.getItem('token')
            },
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
            this.poll();
        },

        methods:{

            poll(){
                setTimeout(()=>{
                    this.netTableData(false,this.poll);
                },1000)
            },

            netBanks(loading ,cb){
                this.banksLoading = loading;
                request.get('api.php?a=banks')
                    .then(res => {
                        let {data} = res;

                        if(! data.success){
                            if(data.errMsg.indexOf('Unauthorized') !== -1){
                                return location.href = 'login.html';
                            }
                            this.$message.error(data.errMsg);
                        }
                        this.banksLoading = false;
                        this.banks = data.data || [];
                        cb && cb();
                    })
                    .catch(err=>{
                        this.$message.error(err);
                        this.banksLoading = false;
                        cb && cb();
                    })
            },

            /**
             * 合计
             * @param param
             * @returns {Array}
             */
            getSummaries(param) {
                //let sum = ["总计", "-", "-","-", "-", "-", "-", "-", "-", "-", "-", "-"];
                const { columns, data } = param;
                const sums = [];
                columns.forEach((column, index) => {
                    if (index === 0) {
                        sums[index] = '总计';
                        return;
                    }
                    const values = data.map(item => Number(item[column.property]));
                    if(column.label === '金额'){
                        sums[index] = values.reduce((prev, curr) => {
                            const value = Number(curr);
                            if (!isNaN(value)) {
                                return prev + curr;
                            } else {
                                return prev;
                            }
                        }, 0);
                    }else{
                        sums[index] = 'N/A';
                    }
                });

                return sums;
            },
            /**
             * 搜索
             */
            onSearch(){
                this.query.page = 1;
                this.netTableData();
            },

            /**
             * 表单提交
             */
            dialogFormSubmit(){
                this.$refs.dialogForm.validate((valid) => {
                    if (valid) {
                        this.dialog.btnLoading = true;
                        request.post('api.php?a=create',this.dialog.form)
                            .then( res =>{
                                this.dialog.btnLoading = false

                                let {data} = res;

                                if(! data.success){
                                    if(data.errMsg.indexOf('Unauthorized') !== -1){
                                        return location.href = 'login.html';
                                    }
                                    return this.$message.error(data.errMsg);
                                }

                                if(parseInt(data.data.status) === -1){
                                    this.$confirm('今天已经给 '+this.dialog.form.name+' 转过 '+this.dialog.form.money+'元，请确认是否继续?', '提示', {
                                        confirmButtonText: '确定',
                                        cancelButtonText: '关闭',
                                        type: 'warning'
                                    }).then(() => {

                                    });
                                }

                                this.netTableData()
                                this.closeDialog();

                            })
                            .catch(err =>{
                                this.dialog.btnLoading = false;
                                this.$message.error(err);
                            })
                    }
                })

            },

            /**
             * 取消订单
             * @param id
             * @returns {Promise<T | never>}
             */
            onCancelOrder(id){
                return request.get('api.php?a=cancel',{
                    params: {
                        id: id
                    }
                })
                    .then( res =>{
                        let {data} = res;

                        if(! data.success){
                            if(data.errMsg.indexOf('Unauthorized') !== -1){
                                return location.href = 'login.html';
                            }
                            return this.$message.error(data.errMsg);
                        }
                        this.netTableData(true);
                        this.closeDialog();
                    })
                    .catch(err =>{
                        this.dialog.btnLoading = false;
                        this.$message.error(err);
                    })
            },

            /**
             * 关闭弹出层
             */
            closeDialog(){
                this.dialog.visible = false;
            },

            /**
             * 弹出层
             */
            onDialogSite(){
                this.dialog.title = '创建订单';
                this.dialog.width = '600px';
                this.dialog.visible = true;
                this.dialog.action = 'addOrder';
                this.dialog.form = {
                    'bank_name' : '自动识别'
                };
                this.$refs.dialogForm && this.$refs.dialogForm.clearValidate()
            },

            /**
             * 弹出层
             */
            onDialogView(row){
                this.dialog.title = '查看订单';
                this.dialog.width = '600px';
                this.dialog.visible = true;
                this.dialog.action = 'viewOrder';
                this.dialog.table = row;
            },

            /**
             * 获取表格数据
             */
            netTableData(loading ,cb){
                this.tableLoading = loading;
                this.banksLoading = loading;
                let query = [];
                Object.keys(this.query).forEach(key => {
                    let value = this.query[key];
                    if(value === null || typeof value === 'undefined' || value === ''){
                        return ;
                    }
                    query.push(key+'='+value)
                });
                if(query.length) query.unshift('&');

                request.get('api.php?a=orders'+query.join('&'),this.query)
                    .then(res => {
                        let {data} = res;

                        console.log(data)
                        if(! data.success){
                            if(data.errMsg.indexOf('Unauthorized') !== -1){
                                return location.href = 'login.html';
                            }
                            this.$message.error(data.errMsg);
                        }
                        this.banksLoading = false;
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

            /**
             * 分页发生变化时
             */
            handleCurrentChange(){
                this.netTableData(true)
            },
            /**
             * 每页条数发生改变时
             */
            handleSizeChange(val){
                this.query.page = 1;
                this.query.count = val;
                this.netTableData(true);
            },
            uploadProgress(event, file, fileList){
                this.uploadLoading = true;
            },
            uploadSuccess(response, file, fileList){
                this.uploadLoading = false;
                if(response.data.length>0){
                    this.query.page = 1;
                    this.netTableData(true);
                }
            },
            uploadError(err, file, fileList){
                this.uploadLoading = false;
            },
            onConfirmOrderNo(index,row){
                let reg = /^(\w{3,8})$/;
                this.$prompt('请输入您的操作工号', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    inputPattern: reg,
                    inputErrorMessage: '工号格式不正确'
                }).then(({ value }) => {
                    request.get('api.php?a=confirmOrderNo',{
                        params: {
                            id: row.id,
                            worker : value
                        }
                    })
                    .then( res =>{
                        let {data} = res;

                        if(! data.success){
                            if(data.errMsg.indexOf('Unauthorized') !== -1){
                                return location.href = 'login.html';
                            }
                            return this.$message.error(data.errMsg);
                        }
                        this.netTableData(true);
                        this.closeDialog();
                     })
                     .catch(err =>{
                        this.dialog.btnLoading = false;
                        this.$message.error(err);
                     })
                });

            }
        }
    })
};

window.onload = app;

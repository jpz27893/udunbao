
var app = function (){
    var instance  = new Vue({
        el: '#app',
        data : {
            admin: getAdmin(),
            query : {
                count : 10,
                page : 1
            },
            tableData: {
                list : [],
                count : 0,
                total : 0
            },
            admins: [],
            banks : [],
            banksLoading : false,
            tableLoading : false,
            moneySplitTip : false,
            moneySplitArr : [],
            dialog : {
                title : '',
                width : '600px',
                visible : false,
                form : {},
                btnLoading : false,
                btnDisabled : false,
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
                                    instance.moneySplitArr = instance.orderSplits(value);
                                    if(instance.moneySplitArr){
                                        instance.moneySplitTip = true
                                    }else{
                                        instance.moneySplitTip = false
                                    }
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
            if(parseInt(this.admin.id)  === 1){
                this.init();
            }
        },
        watch: {
            'dialog.visible': function (newDate, oldDate) {
                if(newDate){
                    this.dialog.btnDisabled = false;
                }else{
                    this.dialog.btnDisabled = true;
                }
            }
        },
        methods:{

            /**
             * 订单拆分
             * @returns {boolean|Array}
             */
            orderSplits(money){
                if(money >= 5000){
                    let stroke = 0; // 最优拆分笔数
                    let max = 4999; // 每笔最大金额

                    for(let i = 0 ; i< 20;i++){ // 通过循环取得最大且小于5000的笔数
                        let mean = money / i;
                        if(mean <= max){
                            stroke = i;
                            break;
                        }
                    }

                    let every = parseInt(money/stroke),
                        residue = money - (every * stroke),
                        splits = [];

                    // let sum = 0;
                    // let find = false;
                    for(let i = 0; i<stroke;i++){
                        let temp = every + residue;
                        if(temp >= max){
                            splits[i] = max;
                            residue = temp - max;
                        }else{
                            splits[i] = temp;
                            residue = 0;
                        }

                        // sum+=splits[i];
                        // if(arr[i] > 4999){
                        //     console.error('平均有问题');
                        // }
                    }

                    return splits;
                    // if(sum !== money){
                    //     console.error('总和有问题');
                    // }

                    //
                    // console.log("金额%s可拆分%d 拆分方案 最终结果",money,stroke,arr,sum);
                    // console.log("有没有5000的",find);
                }else{
                    return false
                }
            },

            poll(){
                setTimeout(()=>{
                    this.netTableData(false,this.poll);
                },1000)
            },

            init(){
                this.netAdmins();
            },
            netAdmins(){
                request.get('api.php?a=admins')
                    .then(res => {
                        let {data} = res;
                        this.admins = data.data;
                    })
                    .catch(err=>{
                        this.$message.error(err);
                    })
            },
            netBanks(loading ,cb){
                this.banksLoading = loading;
                request.get('api.php?a=banks')
                    .then(res => {
                        let {data} = res;

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
                this.netTableData(true);
            },

            /**
             * 表单提交
             */
            dialogFormSubmit(){
                this.$refs.dialogForm.validate((valid) => {
                    if (valid) {
                        this.dialog.btnLoading = true;
                        let money = this.dialog.form.money,
                            split = (this.orderSplits(this.dialog.form.money) || [money]).map( value =>{
                            return this.createOrder(
                                Object.assign(JSON.parse(JSON.stringify(this.dialog.form)),{
                                    money : value
                                })
                            );
                        });

                        let ignore = split.length > 1;

                        axios.all(split)
                            .then(axios.spread((res) => {
                                let {data} = res;
                                if(!ignore){
                                    if(parseInt(data.data.status) === -1){
                                        this.$confirm('今天已经给 '+this.dialog.form.name+' 转过 '+this.dialog.form.money+'元，请确认是否继续?', '提示', {
                                            confirmButtonText: '确定',
                                            cancelButtonText: '关闭',
                                            type: 'warning'
                                        })
                                    }
                                }

                                this.moneySplitTip = false;
                                this.dialog.btnLoading = false;
                                this.netTableData();
                                this.closeDialog();
                            }))
                            .catch((err)=>{
                                this.moneySplitTip = false;
                                this.dialog.btnLoading = false;
                                this.$message.error(err);
                            });
                    }
                })

            },

            /**
             * 创建订单
             * @param data
             * @returns {*|void}
             */
            createOrder(data){
                return request.post('api.php?a=create',Object.assign(data,{
                    scatter : data.money !== this.dialog.form.money
                }))
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

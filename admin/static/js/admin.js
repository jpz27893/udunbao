
var app = function (){
    var instance = new Vue({
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
                    username: [
                        { required: true, message: '用户名不能为空', trigger: 'blur' },
                        { pattern: /^[0-9a-zA-Z]+$/, message: '账号只能输入英文和数字', trigger: 'change' },
                    ],
                    nickname: [
                        { required: true, message: '昵称不能为空', trigger: 'blur' },
                    ],
                    password: [
                        { required: true, message: '密码不能为空', trigger: 'blur' },
                        { min: 6,max:19, message: '密码最小长度6位，最大长度16位', trigger: 'blur' },
                    ],
                    password1: [
                        { required: true, message: '确认密码不能为空', trigger: 'blur' },
                        {
                            validator: function(rule, value, callback){
                                if(instance.dialog.form.password != value ){
                                    callback(new Error('两次密码输入不一致'));
                                }else{
                                    callback();
                                }
                            },trigger: ['change','blur']
                        }
                    ],
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
                    password: [
                        { required: true, message: '密码不能为空', trigger: 'blur' },
                        { min: 6,max:19, message: '密码最小长度6位，最大长度16位', trigger: 'blur' },
                    ],
                    password1: [
                        { required: true, message: '确认密码不能为空', trigger: 'blur' },
                        {
                            validator: function(rule, value, callback){
                                if(instance.dialogEdit.form.password != value ){
                                    callback(new Error('两次密码输入不一致'));
                                }else{
                                    callback();
                                }
                            },trigger: ['change','blur']
                        }
                    ]
                }
            },
        },
        created(){
            this.init();
        },
        watch: {
            'dialog.visible':function (newData, oldData) {
                if(!newData){
                    this.$refs.dialogForm && this.$refs.dialogForm.resetFields();
                    this.$refs.dialogForm && this.$refs.dialogForm.clearValidate();
                }
            },
            'dialogEdit.visible':function (newData, oldData) {
                if(!newData){
                    this.$refs.dialogEditForm && this.$refs.dialogEditForm.resetFields();
                    this.$refs.dialogEditForm && this.$refs.dialogEditForm.clearValidate();
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
                        this.$message.error(err);
                    })
            },
            dialogFormSubmit(){
                this.$refs.dialogForm.validate((valid) => {
                    if (valid) {
                        this.dialog.btnLoading = true;
                        request.post('api.php?a=addAdmin',this.dialog.form)
                            .then(res => {
                                this.dialog.btnLoading = false;
                                this.dialog.visible = false;
                                if(res.data.success){
                                    this.$message.success(res.data.data);
                                    this.netTableData(true);
                                }else{
                                    this.$message.error(res.data.errMsg);
                                }
                            })
                            .catch(err=>{
                                this.dialog.btnLoading = false;
                                this.$message.error(err);
                            })
                    }
                })
            },
            onUpdateAdmin(scope){
                this.dialogEdit.visible = true;
                this.dialogEdit.form.id = scope.row.id;
                this.dialogEdit.form.username = scope.row.username;
            },
            dialogFormUpdate(){
                this.$refs.dialogEditForm.validate((valid) => {
                    if (valid) {
                        this.dialogEdit.btnLoading = true;
                        request.post('api.php?a=updateAdmin',this.dialogEdit.form)
                            .then(res => {
                                this.dialogEdit.btnLoading = false;
                                this.dialogEdit.visible = false;
                                if(res.data.success){
                                    this.$message.success(res.data.data)
                                }else{
                                    this.$message.error(res.data.errMsg);
                                }
                            })
                            .catch(err=>{
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


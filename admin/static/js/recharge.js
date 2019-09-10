var app = function () {
  new Vue({
    el: '#app',
    data: {
      query: {
        count: 10,
        page: 1
      },
      tableData: {
        list: [],
        count: 0,
        total: 0
      },
      tableLoading: false,
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

      dialog: {
        visible: false,
        btnLoading: false,
        btnDisabled: true,
        form: {
          money: '',
          bank_name: '',
          card_no: '',
          card_name: ''
        },
        rules: {
          money: [
            { required: true, message: '请输入充值金额', trigger: 'blur' },
            {pattern: /^[0-9]+$/, message: '不能包含字符串或其他特殊字符', trigger: ['change', 'blur']}
          ],
          bank_name: [
            { required: true, message: '请输入银行名称', trigger: 'blur' },
            {pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]+$/, message: '不能包含特殊字符', trigger: ['change', 'blur']}
          ],
          card_no: [
            { required: true, message: '请输入卡号', trigger: 'blur' },
            {pattern: /^[0-9]+$/, message: '不能包含字符串或其他特殊字符', trigger: ['change', 'blur']}
          ],
          card_name:[
            { required: true, message: '请输入姓名', trigger: 'blur' },
            {pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]+$/, message: '不能包含特殊字符', trigger: ['change', 'blur']}
          ]
        }
      }
    },
    created() {
      this.init();
    },
    filters: {
      getHref: function (val) {
        return 'bankslogs.html?card_no=' + val
      }
    },
    watch: {
      'dialog.visible': function (newDate, oldDate) {
        if (newDate) {
          this.dialog.btnDisabled = false;
        } else {
          this.dialog.btnDisabled = true;
          this.$refs.dialogForm && this.$refs.dialogForm.resetFields();
          this.$refs.dialogForm && this.$refs.dialogForm.clearValidate();
        }
      }
    },
    methods: {
      init() {
        this.netTableData(false);
      },
      //搜索
      onSearch() {
        this.query.page = 1;
        this.netTableData(true);
      },

      //获取表格数据
      netTableData(loading, cb) {
        this.tableLoading = loading;
        request.get('api.php?a=incomes', {
          params: this.query
        })
          .then(res => {
            let {data} = res;
            this.tableLoading = false;
            this.tableData = data.data;
            cb && cb();
          })
          .catch(err => {
            this.$message.error(err);
            this.tableLoading = false;
            cb && cb();
          })
      },
      //分页发生变化时
      handleCurrentChange() {
        this.netTableData(true)
      },
      //每页条数发生改变时
      handleSizeChange(val) {
        this.query.page = 1;
        this.query.count = val;
        this.netTableData(true);
      },
      onRecharge() {
        this.dialog.visible = true;
      },
      onDialogFormSubmit() {
        this.$refs.dialogForm.validate((valid) => {
          if (valid) {
            this.dialog.btnLoading = true;
            request.post('api.php?a=recharge', this.dialog.form)
              .then(res => {
                let {data} = res;
                if (data.success) {
                  this.$message.success(data.data);
                } else {
                  this.$message.error(data.errMsg);
                }
                this.dialog.visible = false;
                this.dialog.btnLoading = false;
                this.netTableData(true);
              })
              .catch(err => {
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

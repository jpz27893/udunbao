var app = function (){
    new Vue({
        el: '#app',
        data(){
          return{
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
              table: []
            }
          }
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
                let query = [];
                Object.keys(this.query).forEach(key => {
                    let value = this.query[key];
                    if(value === null || typeof value === 'undefined' || value === ''){
                        return ;
                    }
                    query.push(key+'='+value)
                });
                if(query.length) query.unshift('&');
                request.get('api.php?a=banksOrder'+query.join('&'),this.query)
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
            onDialogView(row){
                this.dialog.visible = true;
                this.dialog.table = row;
            },
            onStatus(scope,val){
                request.get('api.php?a=banksOrderStatus',{
                    params: {
                        order_id: scope.row.id,
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

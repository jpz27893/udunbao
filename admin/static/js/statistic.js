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
      moneyFormat:function(val){
        if(val){
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
        request.get('api.php?a=getOrders',{
          params: this.query
        })
          .then(res => {
            let {data} = res;
            this.tableLoading = false;
            this.tableData.list = data.data;
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

    }
  })
};

window.onload = app;

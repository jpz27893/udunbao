(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-168e1887"],{"150b":function(t,e,a){},"66f7":function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"banksOrder"},[a("h4",{staticClass:"title"},[t._v("\n      卡池订单\n    ")]),t._v(" "),a("el-form",{staticClass:"demo-form-inline",attrs:{inline:!0,model:t.query,size:"small"}},[a("el-form-item",[a("el-input",{staticClass:"input-with-select",attrs:{placeholder:"请输入查询的内容",clearable:""},model:{value:t.query[t.select],callback:function(e){t.$set(t.query,t.select,e)},expression:"query[select]"}},[a("el-select",{staticStyle:{width:"130px","text-align":"center"},attrs:{slot:"prepend",placeholder:"请选择"},on:{change:t.changeQuery},slot:"prepend",model:{value:t.select,callback:function(e){t.select=e},expression:"select"}},[a("el-option",{attrs:{label:"姓名",value:"name"}}),t._v(" "),a("el-option",{attrs:{label:"转出卡姓名",value:"task_card_name"}}),t._v(" "),a("el-option",{attrs:{label:"卡号",value:"card_number"}}),t._v(" "),a("el-option",{attrs:{label:"金额",value:"money"}})],1)],1)],1),t._v(" "),a("el-form-item",{attrs:{label:"订单状态"}},[a("el-select",{attrs:{placeholder:"请选择订单状态",clearable:""},model:{value:t.query.status,callback:function(e){t.$set(t.query,"status",e)},expression:"query.status"}},[a("el-option",{attrs:{label:"全部",value:""}}),t._v(" "),a("el-option",{attrs:{label:"未处理",value:0}}),t._v(" "),a("el-option",{attrs:{label:"进行中",value:1}}),t._v(" "),a("el-option",{attrs:{label:"成功",value:2}}),t._v(" "),a("el-option",{attrs:{label:"失败",value:3}})],1)],1),t._v(" "),a("el-form-item",{attrs:{label:"时间"}},[a("el-date-picker",{attrs:{type:"datetimerange","picker-options":t.pickerOptions,"value-format":"yyyy-MM-dd HH:mm:ss","range-separator":"至","start-placeholder":"开始日期","end-placeholder":"结束日期",align:"right"},model:{value:t.query.range,callback:function(e){t.$set(t.query,"range",e)},expression:"query.range"}})],1),t._v(" "),a("el-form-item",[a("el-button",{attrs:{type:"primary"},on:{click:t.onSearch}},[t._v("查询")])],1)],1),t._v(" "),a("el-table",{directives:[{name:"loading",rawName:"v-loading",value:t.tableLoading,expression:"tableLoading"}],staticStyle:{width:"100%"},attrs:{data:t.tableData.list,border:"",size:"small"}},[a("el-table-column",{attrs:{width:"80px",prop:"id",label:"id"}}),t._v(" "),a("el-table-column",{attrs:{prop:"name",label:"姓名"}}),t._v(" "),a("el-table-column",{attrs:{prop:"money",label:"金额"}}),t._v(" "),a("el-table-column",{attrs:{prop:"task_card_name",label:"转出卡姓名"},scopedSlots:t._u([{key:"default",fn:function(e){return[t._v("\n          "+t._s(e.row.task_card_name||"-")+"\n        ")]}}])}),t._v(" "),a("el-table-column",{attrs:{prop:"created_at",label:"创建时间"}}),t._v(" "),a("el-table-column",{attrs:{prop:"updated_at",label:"更新时间"}}),t._v(" "),a("el-table-column",{attrs:{label:"状态"},scopedSlots:t._u([{key:"default",fn:function(e){return[2==e.row.status?a("el-tag",{attrs:{type:"success",size:"small"}},[t._v("成功")]):3==e.row.status?a("el-tag",{attrs:{type:"danger",size:"small"}},[t._v("失败")]):1==e.row.status?a("el-tag",{attrs:{size:"small"}},[t._v("进行中")]):-1==e.row.status?a("el-tag",{attrs:{type:"warning",size:"small"}},[t._v("未确认")]):a("el-tag",{attrs:{type:"info",size:"small"}},[t._v("未处理")])]}}])}),t._v(" "),a("el-table-column",{attrs:{label:"操作",width:"280px"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-button",{attrs:{size:"mini"},on:{click:function(a){return t.onDialogView(e.row)}}},[t._v("查看详情\n          ")]),t._v(" "),0==e.row.status||1==e.row.status?a("el-popover",{attrs:{placement:"top",width:"200"},model:{value:e.row.popover,callback:function(a){t.$set(e.row,"popover",a)},expression:"scope.row.popover"}},[a("p",[t._v("请确认订单 "+t._s(e.row.name)+" ￥"+t._s(e.row.money)+" 是否成功？")]),t._v(" "),a("div",{staticStyle:{"text-align":"right",margin:"10px 0 0 0"}},[a("el-button",{attrs:{type:"success",size:"mini"},on:{click:function(a){return t.onStatus(e,2)}}},[t._v("成功")]),t._v(" "),a("el-button",{attrs:{type:"danger",size:"mini"},on:{click:function(a){return t.onStatus(e,3)}}},[t._v("失败")])],1),t._v(" "),a("el-button",{attrs:{slot:"reference",size:"mini"},slot:"reference"},[t._v("确认订单\n            ")])],1):t._e()]}}])})],1),t._v(" "),a("div",{staticClass:"block",staticStyle:{"margin-top":"20px","text-align":"right"}},[a("el-pagination",{attrs:{"current-page":t.query.page,"page-size":t.query.count,layout:"sizes ,prev, pager, next",total:t.tableData.total},on:{"size-change":t.handleSizeChange,"update:currentPage":function(e){return t.$set(t.query,"page",e)},"update:current-page":function(e){return t.$set(t.query,"page",e)},"current-change":t.handleCurrentChange}})],1),t._v(" "),a("el-dialog",{attrs:{title:"卡池设置",visible:t.dialog.visible,width:"600px"},on:{"update:visible":function(e){return t.$set(t.dialog,"visible",e)}}},[a("div",{staticClass:"view-table-div",staticStyle:{"margin-top":"-15px"}},[a("table",{attrs:{border:"0px",cellpadding:"0",cellspacing:"0"}},[a("thead",[a("tr",[a("td",{attrs:{colspan:"2"}},[t._v("订单信息")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("订单号")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.order_id))])]),t._v(" "),a("tr",[a("td",[t._v("外部订单号")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.out_order_no))])]),t._v(" "),a("tr",[a("td",[t._v("银行名称")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.bank_name))])]),t._v(" "),a("tr",[a("td",[t._v("转账金额")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.money))])]),t._v(" "),a("tr",[a("td",[t._v("银行卡号")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.card_number))])]),t._v(" "),a("tr",[a("td",[t._v("姓名")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.name))])]),t._v(" "),a("tr",[a("td",[t._v("确认工号")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.worker||"-"))])]),t._v(" "),a("tr",[a("td",[t._v("创建时间")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.created_at))])]),t._v(" "),a("tr",[a("td",[t._v("最后更新时间")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.updated_at))])])])]),t._v(" "),a("table",{attrs:{border:"0px",cellpadding:"0",cellspacing:"0"}},[a("thead",[a("tr",[a("td",{attrs:{colspan:"2"}},[t._v("处理结果")])])]),t._v(" "),a("tbody",[a("tr",[a("td",[t._v("操作状态")]),t._v(" "),a("td",[2==t.dialog.table.status?a("span",{staticStyle:{color:"#67c23a"}},[t._v("成功")]):3==t.dialog.table.status?a("span",{staticStyle:{color:"#f56c6c"}},[t._v("失败")]):-1==t.dialog.table.status?a("span",[t._v("待确认")]):1==t.dialog.table.status?a("span",{staticStyle:{color:"#409EFF"}},[t._v("进行中")]):a("span",{staticStyle:{color:"#909399"}},[t._v("未处理")])])]),t._v(" "),a("tr",[a("td",[t._v("转出卡号")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.task_card_no||"-"))])]),t._v(" "),a("tr",[a("td",[t._v("转出姓名")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.task_card_name||"-"))])]),t._v(" "),a("tr",[a("td",[t._v("账面余额")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.task_balance||"-"))])]),t._v(" "),a("tr",[a("td",[t._v("失败原因")]),t._v(" "),a("td",[t._v(t._s(t.dialog.table.msg||"-"))])])])])])])],1)},n=[],s=a("b775");function r(t){return Object(s["a"])({url:"api.php?a=banksOrder",method:"get",params:t})}function i(t){return Object(s["a"])({url:"api.php?a=banksOrderStatus",method:"get",params:t})}var o={name:"index",data:function(){return{query:{count:10,page:1},select:"name",tableData:{list:[],count:0,total:0},tableLoading:!1,pickerOptions:{shortcuts:[{text:"最近一周",onClick:function(t){var e=new Date,a=new Date;a.setTime(a.getTime()-6048e5),t.$emit("pick",[a,e])}},{text:"最近一个月",onClick:function(t){var e=new Date,a=new Date;a.setTime(a.getTime()-2592e6),t.$emit("pick",[a,e])}},{text:"最近三个月",onClick:function(t){var e=new Date,a=new Date;a.setTime(a.getTime()-7776e6),t.$emit("pick",[a,e])}}]},dialog:{visible:!1,table:[]}}},created:function(){this.init()},methods:{changeQuery:function(){this.query={count:10,page:1}},init:function(){this.netTableData(!0)},onSearch:function(){this.query.page=1,this.netTableData(!0)},netTableData:function(t,e){var a=this;this.tableLoading=t,r(this.query).then(function(t){var l=t.data;a.tableLoading=!1,l.list.map(function(t){Object.assign(t,{popover:!1})}),a.tableData=l,e&&e()}).catch(function(t){a.$message.error(t),a.tableLoading=!1,e&&e()})},handleCurrentChange:function(){this.netTableData(!0)},handleSizeChange:function(t){this.query.page=1,this.query.count=t,this.netTableData(!0)},onDialogView:function(t){this.dialog.visible=!0,this.dialog.table=t},onStatus:function(t,e){var a=this;i({order_id:t.row.id,status:e}).then(function(e){e.success?(a.$message.success(e.data),a.tableData.list[t.$index].popover=!1,a.netTableData(!0)):a.$message.error(e.errMsg)}).catch(function(t){a.$message.error(t),a.tableLoading=!1})}}},c=o,u=(a("9bdb"),a("2877")),d=Object(u["a"])(c,l,n,!1,null,null,null);e["default"]=d.exports},"9bdb":function(t,e,a){"use strict";var l=a("150b"),n=a.n(l);n.a}}]);
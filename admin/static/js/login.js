var app = function (){
    new Vue({
        el: '#app',
        data : {
            btnLoading : false,
            form: {
                username:'',
                password:'',
                code : ''
            },
        },
        methods:{
            onSubmit(){
                this.btnLoading = true;
                request.post('api.php?a=login',this.form)
                    .then( (response) =>{
                        let {data} = response;
                        if(data.success){
                            setToken(data.data.token)
                            location.href = 'index.html'
                        }else{
                            this.$notify.error({
                                title: '错误',
                                message: data.errMsg
                            });
                        }
                        this.btnLoading = false;
                    })
                    .catch(function (error) {
                        console.log(error);
                        this.btnLoading = false;
                    });
            }
        }
    })
};

window.onload = app;

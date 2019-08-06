let request = axios.create({
    headers: {
        'token' : getToken()
    }
});

request.interceptors.response.use(function (response) {
    if(! response.data.success){
        if(response.data.errMsg.indexOf('Unauthorized') !== -1){
            return location.href = 'login.html';
        }
    }
    return response;
}, function (error) {
    return Promise.reject(error);
});

function getToken(){
    return localStorage.getItem('token');
}

function getAdmin() {
    return getToken()?JSON.parse(Base64.decode(getToken().split('.')[1])):'';
}

function setToken(token){
    localStorage.setItem('token',token)
}

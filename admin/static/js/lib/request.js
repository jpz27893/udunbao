
let request = axios.create({
    headers: {
        'token' : getToken()
    }
});

function getToken(){
    return localStorage.getItem('token');
}


function setToken(token){
    localStorage.setItem('token',token)
}

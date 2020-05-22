var aiConfig = {
    appsecret:'',
    appkey:'',
    api:'nli',
    cusid:'',
};

// 如果修改了这部分内容 必须对应修改html文件里的ajax请求方式
var servConfig = {
    url:'/speaker',// 请求接口的url
    method:'POST',// 接口请求方式
    port:9999,// 端口
    acceptToken:'yourtoken', // 接收token
};
var webConfig = {
    port:8899,
};
module.exports = {
    servConfig,webConfig,aiConfig
};
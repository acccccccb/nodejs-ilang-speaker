var http = require('http');
var https = require('https');
var iconv = require("iconv-lite");
var crypto = require('crypto');
var md5 = require('md5-node');
var exec = require('child_process').exec;
var os=require('os');


function func(){}
func.prototype = {
    execute:function(cmd,callback){
        exec(cmd, function(error, stdout, stderr) {
            if(error){
                console.log(cmd+ ' fail');
                if(callback && typeof callback === 'function') {
                    console.log(error);
                    callback(false);
                }
            } else{
                console.log(cmd+ ' success');
                if(callback && typeof callback === 'function') {
                    callback(true);
                }
            }
        });
        return this;
    }
};
function run() { return new func(); }
function setToRobot(msg,callback){
    var appsecret = 'd1e824c701d7442bbd4a7f50adc63932';
    var appkey = '7be9fa0d22de484fb39ad76c3fe6daf0';
    var api = 'nli';
    var timestamp = new Date().getTime();
    var cusid = '';
    var rq = JSON.stringify({
        "data_type":"stt",
        "data":{
            "input_type":1,
            "text":msg,
        }
    });
    console.log(msg);
    var sign = appsecret + "api=" + api + "appkey=" + appkey + "timestamp=" + timestamp + appsecret;
    var url="https://cn.olami.ai/cloudservice/api?appkey="+ appkey +"&api="+ api +"&timestamp=" + timestamp + "&sign=" + md5(sign) + "&rq="+ rq;
    https.get(url, function (res) {
        var datas = [];
        var size = 0;
        res.on('data', function (data) {
            datas.push(data);
            size += data.length;
            //process.stdout.write(data);
        });
        res.on("end", function () {
            var buff = Buffer.concat(datas, size);
            var result = iconv.decode(buff, "utf8");//转码//var result = buff.toString();//不需要转编码,直接tostring
            console.log(result);
            var json = JSON.parse(result);
            callback(json);
        });
    }).on("error", function (err) {
        Logger.error(err.stack);
        callback.apply(null);
    });
};
var init = function(option){
    http.createServer(function(req, res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'token');
        res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
        res.setHeader('content-type', 'application/json');

        if(req.method==='OPTIONS') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end()
        } else {
            if(req.headers['token']===option.acceptToken && req.method===option.method) {
                // 验证成功
                var post = '';
                // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
                req.on('data', function(chunk){
                    post += chunk;
                });
                // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
                req.on('end', function(){
                    var msg = post.split('=')[1];
                    if(msg) {
                        setToRobot(msg,function(result){
                            res.end(JSON.stringify({
                                success:true,
                                code:200,
                                msg:result.data.nli[0]
                            }));
                        });
                        // run().execute("ilang '" + msg + "'",function(){
                        //     res.end(JSON.stringify({
                        //         success:true,
                        //         code:200,
                        //         msg:'success'
                        //     }));
                        // })
                    } else {
                        res.end(JSON.stringify({
                            success:false,
                            code:200,
                            msg:'need msg'
                        }));
                    }
                });
            } else {
                res.end(JSON.stringify({
                    success:false,
                    code:402,
                    msg:'fail'
                }));
            }

        }

    }).listen(option.port);
    console.log('success! port:' + option.port);
};

init({
    url:'/speaker',
    method:'POST',
    port:9999,
    acceptToken:'yourtoken',
});


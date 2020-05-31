var { aiConfig,servConfig,webConfig ,speakerConfig} = require('./config');
var http = require('http');
var https = require('https');
var iconv = require("iconv-lite");
var crypto = require('crypto');
var md5 = require('md5-node');
var exec = require('child_process').exec;
var os=require('os');
var encoding = require('encoding');
var fs=require('fs-extra');


function func(){}
func.prototype = {
    execute:function(cmd,callback){
        exec(cmd, {encoding:'utf8'},function(error, stdout, stderr) {
            if(error){
                console.log(cmd+ ' fail');
					console.log(error);
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
    // document https://cn.olami.ai/
    var appsecret = aiConfig.appsecret;
    var appkey = aiConfig.appkey;
    var api = aiConfig.api;
    var timestamp = new Date().getTime();
    var cusid = aiConfig.cusid;
    var rq = JSON.stringify({
        "data_type":"stt",
        "data":{
            "input_type":1,
            "text":msg,
        }
    });
    var sign = appsecret + "api=" + api + "appkey=" + appkey + "timestamp=" + timestamp + appsecret;
    var url="https://cn.olami.ai/cloudservice/api?appkey="+ appkey +"&api="+ api +"&timestamp=" + timestamp + "&sign=" + md5(sign) + "&rq="+ rq + '&cusid' + cusid;
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
var init = function(){
    http.createServer(function(req, res){
        if(req.method==='GET') {
            var file = '';
            var ContentType = '';
            if(req.url == '/') {
                file = '/index.html';
                ContentType = 'text/html';
            } else {
                file = req.url;
                var arr = req.url.split('.');
                var fileType = arr[arr.length-1];
                if(fileType=='js') {
                    ContentType = 'application/javascript'
                }
                if(fileType=='css') {
                    ContentType = 'text/css'
                }
            }
            fs.readFile('./src/html' + file,function(err,data){
                if(err) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end("404 Not found");
                } else {
                    res.writeHead(200, { 'Content-Type': ContentType });
                    res.end(data);
                }
            })
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>err</h1>')
        }
    }).listen(webConfig.port);
    console.log('web service start on ' + webConfig.port);
    http.createServer(function(req, res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'token');
        res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
        res.setHeader('content-type', 'application/json');
		returnError = function(res){
			//console.log(res);
			res.end(JSON.stringify({
                    success:false,
                    code:402,
                    msg:'fail'
                }));
		};
        if(req.method==='OPTIONS') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end()
        } else {
			console.log(req.url);
			console.log(req.url===servConfig.url, req.headers['token']===servConfig.acceptToken , req.method===servConfig.method);
			if(req.url===speakerConfig.url && req.headers['token']===speakerConfig.acceptToken && req.method===speakerConfig.method) {
				console.log('speakerConfig');
				var post = '';
                req.on('data', function(chunk){
                    post += chunk;
                });
					req.on('end', function(){
						var msg = post.split('=')[1];
						if(msg) {
							run().execute('ilang "' + msg + '"');
							res.end(JSON.stringify({
                                    success:true,
                                    code:200,
                                    msg:msg
                             }));
						} else {
							console.log('err1');
							returnError(res)
						}
                   })
				} else if (req.url===servConfig.url&& req.headers['token']===servConfig.acceptToken && req.method===servConfig.method) {
				console.log('servConfig');
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
						console.log('servConfig:' + msg);
						if(msg == "light+on" ) {
								run().execute('python /home/pi/raspberry-python/light.py 1',function(){
									res.end(JSON.stringify({
										success:true,
										code:200,
										msg:{
												desc_obj:{
														result:'light on success'
												}
										}
								}));
									});
								
								
						} else if(msg == "light+off") {
							
							run().execute('python /home/pi/raspberry-python/light.py 0',function(){
									res.end(JSON.stringify({
										success:true,
										code:200,
										msg:{
												desc_obj:{
														result:'light off success'
												}
										}
								}));
									});
								}
						
						else {
								setToRobot(msg,function(result){
								console.log('setToRobot')
									var receiveMsg = result.data.nli[0]['desc_obj']['result'];
									res.end(JSON.stringify({
										success:true,
										code:200,
										msg:result.data.nli[0]
									}));
                        });
						}
                        
                    } else {
						console.log('err3');
                        returnError(res)
                    }
                });
			}  else {
				console.log('err4');
				returnError(res)
			}
		
        }

    }).listen(servConfig.port);
    console.log('chat service started! port:' + servConfig.port);
};
module.exports = {
    init
};


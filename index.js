var http = require('http');
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
                    console.log(msg);
                    if(msg) {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(JSON.stringify({
                            success:true,
                            code:200,
                            msg:'success:'+msg
                        }));
                        run().execute("ilang '" + msg + "'",function(){
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end(JSON.stringify({
                                success:true,
                                code:200,
                                msg:'success'
                            }));
                        })
                    } else {
                        res.end(JSON.stringify({
                            success:false,
                            code:200,
                            msg:'need msg'
                        }));
                    }
                });
            } else {
                res.writeHead(402, { 'Content-Type': 'text/plain' });
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
    acceptToken:'abc',
});
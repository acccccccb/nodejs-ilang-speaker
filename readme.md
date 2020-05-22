### 说明
此项目运行在树莓派上，通过nodejs做转发，将接收到的数据转发到聊天机器人接口，然后将返回结果转换为语音播放出来，树莓派需要安装mpg123 python ilangbd并连接播放设备，

![avatar](https://www.ihtmlcss.com/wp-content/uploads/2020/05/微信截图_20200522181456-1.png)

### 配置
复制 ./src/node/config.sample.js 为 config.js
修改config.js文件，可以只修改aiConfig，appsecret和appkey可以在 https://cn.olami.ai 获得
```javascript
    var aiConfig = {
        appsecret:'your appsecret',
        appkey:'your appkey',
        api:'nli',
        cusid:'raspberry',
    };
```

### 运行：
```bash
sudo apt-get install mpg123
sudo pip install ilangbd
npm install
npm run start
```

运行后将会开启两个端口8899 和 9999，通过浏览器访问http://localhost:8899打开聊天页面
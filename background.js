var flag = false;
var currentTabId;

var default_max = 3000;
var default_min = 5000;

var robot = true;

function randomTimeExecute(options, callback) {
    let maxInternal = options.max || default_max;
    let minInternal = options.min || default_min;
    let time = Math.ceil(Math.random() * (maxInternal - minInternal + 1) + minInternal);
    setTimeout(() => callback(time), time);
}

async function postData(requestBody) {

    $.ajax({
        type: "POST",
        cache: false,
        url: "https://test.seelyn.com/domain/receive",
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(requestBody),
        dataType: "json",
        success: function (message) {
            console.log("send data to remote done");
        },
        error: function (message) {
            if ("OK" !== message.responseText) {
                sendMsg2Tab(currentTabId, {cmd: "stop"});
                flag = false;
            }
        }
    });
}

function sendMsgForPopup(payload) {

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

        if ("start" === payload.cmd || "resume" === payload.cmd) {
            flag = true;
        } else if ("stop" === payload.cmd) {
            flag = false;
        }
        currentTabId = tabs[0].id;
        sendMsg2Tab(currentTabId, payload);
    });
}

function sendMsg2Tab(tabId, payload) {
    chrome.tabs.sendMessage(tabId, payload, function (response) {
        //console.log(response);
    });
}

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {

        if (request.msg.length > 0) {
            await postData(request.msg);
        }
        if ("stop" === request.cmd) {
            flag = false;
        }
        sendResponse({cmd: request.cmd});
    });


//监听所有请求
chrome.webRequest.onBeforeRequest.addListener(function (details) {
        flag = false;
        currentTabId = details.tabId;
        sendMsg2Tab(currentTabId, {cmd: "stop"});
        if (robot) {
            robot = false;
            randomTimeExecute({max: 1000 * 60 * 5, min: 1000 * 60 * 10}, function (time) {
                console.log("收到机器人验证，等待:" + time / 1000 + "秒");
                console.log("恢复执行采集");
                flag = true;
                robot = true;
                sendMsg2Tab(currentTabId, {cmd:"resume"});
            });
        }

        return {cancel: true};
    },
    {urls: ["*://icp.chinaz.com/sys/gee?act=get*"]},
    //check response: 1
    //get response: {"success":1,"gt":"3216efb2733cb3a8bc5bb3e5e2146fe5","challenge":"119c7329e4c127daba312641f5286215","new_captcha":true}
    ["blocking", "requestBody"]
);

//监听所有请求
chrome.webRequest.onBeforeRequest.addListener(function (details) {
        return {cancel: true};
    },
    {urls: ["*://icp.chinaz.com/sys/gee?act=check*"]},
    //check response: 1
    //get response: {"success":1,"gt":"3216efb2733cb3a8bc5bb3e5e2146fe5","challenge":"119c7329e4c127daba312641f5286215","new_captcha":true}
    ["blocking", "requestBody"]
);
/**
 * request 请求成功
 */
chrome.webRequest.onCompleted.addListener(function (details) {

    if (flag) {
        currentTabId = details.tabId;
        randomTimeExecute({max: default_max, min: default_min}, (time) => {
            console.log("请求间隔时间:" + time + "毫秒");
            sendMsg2Tab(currentTabId, {cmd: "parse_body"});
        });
    }

}, {urls: ["*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


chrome.webRequest.onErrorOccurred.addListener(function (details) {

    if (flag) {
        flag = false;
        currentTabId = details.tabId;
        randomTimeExecute({max: default_max, min: default_min}, (time) => {
            console.log("请求间隔时间:" + time + "毫秒");
            sendMsg2Tab(currentTabId, {cmd: "stop"});
        });
    }

}, {urls: ["*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


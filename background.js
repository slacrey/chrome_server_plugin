var flag = false;
var currentTabId;

var default_max = 5000;
var default_min = 3000;

var fetchCount = 0;
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

    //active: true, currentWindow: true
    chrome.tabs.query({active: true}, function (tabs) {

        if ("start" === payload.cmd || "resume" === payload.cmd) {
            flag = true;
        } else if ("stop" === payload.cmd) {
            flag = false;
        }
        sendMsg2Tab(tabs[0].id, payload);

    });
}

function sendMsg2Tab(tabId, payload) {
    currentTabId = tabId;
    chrome.tabs.sendMessage(tabId, payload, function (response) {

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
// chrome.webRequest.onBeforeRequest.addListener(function (details) {
//
//         flag = false;
//         sendMsg2Tab(details.tabId, {cmd: "stop"});
//         // randomTimeExecute({max: 1000 * 60, min: 1000 * 30}, function (time) {
//         //     console.log("收到机器人验证，等待:" + time / 1000 + "秒");
//         //     console.log("恢复执行采集");
//         //     flag = true;
//         //     robot = true;
//         //     sendMsg2Tab(currentTabId, {cmd: "resume"});
//         // });
//
//         return {cancel: false};
//     },
//     {urls: ["*://icp.chinaz.com/sys/gee?act=get*", "*://icp.chinaz.com/sys/gee?act=check*"]},
//     //check response: 1
//     //get response: {"success":1,"gt":"3216efb2733cb3a8bc5bb3e5e2146fe5","challenge":"119c7329e4c127daba312641f5286215","new_captcha":true}
//     ["blocking", "requestBody"]
// );

/**
 * request 请求成功
 */
chrome.webRequest.onCompleted.addListener(function (details) {

    let pageData = details.url.indexOf("://icp.chinaz.com/Provinces/PageData") != -1;
    if (pageData) {
        if (flag) {
            randomTimeExecute({max: default_max, min: default_min}, (time) => {
                console.log("请求间隔时间:" + time + "毫秒");
                sendMsg2Tab(details.tabId, {cmd: "parse_body"});
            });
        }
    } else {
        flag = false;
        sendMsg2Tab(details.tabId, {cmd: "stop"});
    }

}, {urls: ["*://icp.chinaz.com/sys/gee?act=get*",
        "*://icp.chinaz.com/sys/gee?act=check*",
        "*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


chrome.webRequest.onErrorOccurred.addListener(function (details) {

    if (flag) {
        flag = false;
        sendMsg2Tab(details.tabId, {cmd: "stop"});
    }

}, {urls: ["*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


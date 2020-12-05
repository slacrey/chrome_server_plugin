var flag = false;
var currentTabId;

var max = 3000;
var min = 5000;
var errList = [];

function ArrayQueue() {
    var arr = [];
    //入队操作
    this.push = function (element) {
        arr.push(element);
        return true;
    };
    //出队操作
    this.pop = function () {
        return arr.shift();
    };
    //获取队首
    this.getFront = function () {
        return arr[0];
    };
    //获取队尾
    this.getRear = function () {
        return arr[arr.length - 1]
    };
    //清空队列
    this.clear = function () {
        arr = [];
    };
    //获取队长
    this.size = function () {
        return length;
    };
}

var queue = new ArrayQueue();


function randomTimeExecute(param, callback) {
    let time = Math.ceil(Math.random() * (max - min + 1) + min);
    setTimeout(() => callback(param, time), time);
}

async function postData(requestBody) {

    $.ajax({
        type: "POST",
        cache: false,
        url: "http://turn.seelyn.com/domain/receive",
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(requestBody),
        dataType: "json",
        success:function (message) {
            console.log("send data to remote done");
        },
        error:function (message) {
            if ("OK" !== message.responseText) {
                sendMsg2Tab(currentTabId, {cmd: "stop"});
                flag = false;
            }
        }
    });
}

function sendMsgForPopup(payload) {

    chrome.tabs.getSelected(null, function (tab) {
        if ("start" === payload.cmd || "resume" === payload.cmd) {
            flag = true;
        } else if ("stop" === payload.cmd) {
            flag = false;
        }
        currentTabId = tab.id;
        sendMsg2Tab(currentTabId, payload)
    });

}

function sendMsg2Tab(tabId, payload) {
    chrome.tabs.sendMessage(tabId, payload, function (response) {
        console.log(response);
    });
}

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {

        if (request.msg.length > 0) {
           await postData(request.msg);
        }
        sendResponse({cmd: request.cmd});
    });

/**
 * request 请求成功
 */
chrome.webRequest.onCompleted.addListener(function (detail) {

    if (flag) {
        currentTabId = detail.tabId;
        randomTimeExecute(1, (param, time) => {
            console.log(time);
            sendMsg2Tab(currentTabId, {cmd: "parse_body"});
        });
    }

}, {urls: ["*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


chrome.webRequest.onErrorOccurred.addListener(function (detail) {

    if (flag) {
        flag = false;
        currentTabId = detail.tabId;
        randomTimeExecute(2, (param, time) => {
            sendMsg2Tab(currentTabId, {cmd: "stop"});
        });
    }

}, {urls: ["*://icp.chinaz.com/Provinces/PageData"]}, ["extraHeaders"]);


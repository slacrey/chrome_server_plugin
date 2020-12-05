var totalPage;
var page = 1;
var startDate;
var endDate;
var stopDate;
var isStop = false;

var max = 3000;
var min = 5000;
var stepQuery = 5;

function randomTimeExecute(param, callback) {
    let time = Math.ceil(Math.random() * (max - min + 1) + min);
    setTimeout(() => callback(param, time), time);
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if ("start" === request.cmd) {

            isStop = false;

            chrome.storage.sync.get({
                startDate: '2010-01-01',
                endDate: '2010-01-06',
                stopDate: '2015-01-01',
                currentPage: 1
            }, function (items) {

                startDate = moment(items.startDate, ["YYYY-MM-DD"]);
                endDate = moment(items.endDate, ["YYYY-MM-DD"]);
                stepQuery = endDate.diff(startDate, 'day');
                stopDate = items.stopDate;

                page = items.currentPage;
                doQueryHandler();

            });

        } else if ("resume" === request.cmd) {
            isStop = false;

            var currPageElement = $("#pagelist").children("a[data-page].col-white");
            if (currPageElement && currPageElement.length > 0) {

                chrome.storage.sync.get({
                    startDate: '2010-01-01',
                    endDate: '2010-01-06',
                    stopDate: '2015-01-01',
                    currentPage: parseInt(currPageElement.text())
                }, function (items) {

                    startDate = moment(items.startDate, ["YYYY-MM-DD"]);
                    endDate = moment(items.endDate, ["YYYY-MM-DD"]);
                    stepQuery = endDate.diff(startDate, 'day');
                    stopDate = items.stopDate;

                    page = items.currentPage;
                    if (page > 1) {
                        jumpPageHandler();
                    } else {
                        getDomainInfo();
                    }
                });
            }
        } else {
            isStop = true;
        }
        //
        sendResponse({cmd: "started"});
    });

function saveQueryCondition() {

    var startDate = document.getElementById('start').value;
    var endDate = document.getElementById('end').value;
    var currPageElement = $("#pagelist").children("a[data-page].col-white");
    if (currPageElement && currPageElement.length > 0) {
        page = parseInt(currPageElement.text());
    }

    console.log("保存条件 startDate:" + startDate + ",endDate:" + endDate + ",page:" + page);
    var options = {};
    if (startDate) {
        options.startDate = startDate;
    }
    if (endDate) {
        options.endDate = endDate;
    }
    options.currentPage = page;

    chrome.storage.sync.set(options, function () {
        console.log("save query condition is done")
    });
}

function jumpPageHandler() {
    var startFormat = startDate.format('YYYY-MM-DD');
    var endFormat = endDate.format('YYYY-MM-DD');

    $("a[val='cus']")[0].click();
    $("#start").val(startFormat);
    $("#end").val(endFormat);

    $('#btn_search')[0].click();

    setTimeout(function () {
        var enter = $("#pagelist a.col-white:last");
        $("#pn").val(page);
        enter[0].click();
        randomTimeExecute(1, function(param, time){
            getDomainInfo();
        });
    }, 5000);
}

function doQueryHandler() {

    page = 1;
    var startFormat = startDate.format('YYYY-MM-DD');
    var endFormat = endDate.format('YYYY-MM-DD');

    $("a[val='cus']")[0].click();
    $("#start").val(startFormat);
    $("#end").val(endFormat);

    $('#btn_search')[0].click();

    randomTimeExecute(2, function(param, time){
        getDomainInfo();
    });

}

//获取域名信息
function getDomainInfo() {

    if (isStop) {
        sendMsg([], "stop");
        return;
    }
    var pageSize = 20;
    var pageAmountElem = $("#pageamount");
    if (!pageAmountElem || pageAmountElem.length <= 0) {
        sendMsg([], "next_query");
        return;
    }
    var pageAmount = parseInt(pageAmountElem.text());
    totalPage = Math.ceil(pageAmount / pageSize);
    if (totalPage > 1000) {
        console.log("超过最大条数，不能采集，请添加条件");
        sendMsg([], "stop");
        return;
    }

    var domainList = [];
    $("#result_table").children("tr").each(function (index) {
        var tds = $(this).children("td");
        var domainInfo = {
            domainName: $(tds[0]).text(),
            organizerName: $(tds[1]).text(),
            unitNature: $(tds[2]).text(),
            icpNo: $(tds[3]).text(),
            siteName: $(tds[4]).text(),
            checkTime: $(tds[6]).text()
        };
        domainList.push(domainInfo);
    });

    var lastPage = $("#pagelist").children("a[title='尾页']");
    if (lastPage && lastPage.length > 0) {
        console.log("send data size:" + domainList.length);
        sendMsg(domainList, "next_page");
    } else {
        if (endDate.isAfter(stopDate)) {
            sendMsg(domainList, "stop");
        } else {
            sendMsg(domainList, "next_query");
        }

    }

}

function nextPageHandler() {
    var nextPage = $("#pagelist").children("a[title='下一页']");
    if (nextPage && nextPage.length > 0) {
        console.log("next page number:" + ++page);
        nextPage[nextPage.length - 1].click();

        randomTimeExecute(3, function(param, time){
            getDomainInfo();
        });
    }
}

function nextQueryHandler() {
    startDate.add(stepQuery, 'days');
    endDate.add(stepQuery, 'days');
    doQueryHandler();
}


//将获取内容传递给后台文件进行处理
function sendMsg(msg, cmd) {

    chrome.runtime.sendMessage({"msg": msg, "cmd": cmd}, function (response) {
        if ("next_page" === response.cmd) {
            nextPageHandler();
        } else if ('next_query' === response.cmd) {
            nextQueryHandler();
        } else {
            console.log("stop...");
            saveQueryCondition();
        }
    });

}



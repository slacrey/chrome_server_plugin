var flag = false;
var currentTabId;

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.msg.length > 0) {
            // postData(request.msg);
        }
        sendResponse({cmd: request.cmd});

    });

function postData(requestBody) {
    $.ajax({
        url: "http://turn.seelyn.com/domain/receive",
        cache: false,
        type: "POST",
        data: JSON.stringify(requestBody),
        contentType: "application/json",
        dataType: "json"
    }).done(function (msg) {
        console.log("send data to remote done");
    }).fail(function (jqXHR, textStatus) {
        sendMsgForPopup({msg: "stop"})
    });
}

function sendMsgForPopup(payload) {

    chrome.tabs.getSelected(null, function (tab) {
        flag = true;
        currentTabId = tab.id;
        chrome.tabs.sendMessage(tab.id, payload, function (response) {
            console.log(response);
        });
    });

}

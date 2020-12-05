// Saves options to chrome.storage
function save_options() {
    var startDate = document.getElementById('start_date').value;
    var endDate = document.getElementById('end_date').value;
    var stopDate = document.getElementById('stop_date').value;
    var errorPage = document.getElementById('error_page').value;
    var currentPage = errorPage || 1;
    chrome.storage.sync.set({
        startDate: startDate,
        endDate: endDate,
        stopDate: stopDate,
        currentPage: currentPage
    }, function () {
        tip('domain options saved.')
    });
}

function tip(msg) {
    var status = document.getElementById('status');
    status.innerText = msg || 'Options saved.';
    setTimeout(function () {
        status.innerText = '';
    }, 750);
}
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        startDate: '2010-01-01',
        endDate: '2010-01-06',
        stopDate: '2015-01-01',
        currentPage: 1
    }, function (items) {
        document.getElementById('start_date').value = items.startDate;
        document.getElementById('end_date').value = items.endDate;
        document.getElementById('stop_date').value = items.stopDate;
        document.getElementById('error_page').value = items.currentPage;
    });
}

/**
 * 开始采集
 */
function start_crawling() {
    var backPage = chrome.extension.getBackgroundPage();
    backPage.sendMsgForPopup({cmd:"start"});
    tip('domain crawling start.');
}

/**
 * 恢复采集
 */
function resume_crawling() {
    var backPage = chrome.extension.getBackgroundPage();
    backPage.sendMsgForPopup({cmd:"resume"});
    tip('domain crawling resume.')
}

/**
 * 停止采集
 */
function stop_crawling() {
    var backPage = chrome.extension.getBackgroundPage();
    backPage.sendMsgForPopup({cmd:"stop"});
    tip('domain crawling stop.')
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save_btn').addEventListener('click',
    save_options);
document.getElementById('start_btn').addEventListener('click',
    start_crawling);
document.getElementById('stop_btn').addEventListener('click',
    stop_crawling);
document.getElementById('resume_btn').addEventListener('click',
    resume_crawling);

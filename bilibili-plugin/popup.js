document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggle-switch');

    if (!toggleSwitch) {
        console.error('Toggle switch element not found.');
        return;
    }

    // 从 storage 中获取当前开关状态，并设置开关状态
    chrome.storage.sync.get(['hideElement'], function(result) {
        toggleSwitch.checked = result.hideElement || false;
    });

    // 当开关状态改变时更新 storage，并立即应用更改
    toggleSwitch.addEventListener('change', function() {
        const hideElement = toggleSwitch.checked;
        chrome.storage.sync.set({ hideElement: hideElement }, function() {
            // 向当前活动的标签页发送消息，通知更新
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { hideElement: hideElement });
            });
        });
    });
});

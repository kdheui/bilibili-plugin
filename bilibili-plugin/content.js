function loadCSS(filePaths) {
    filePaths.forEach(filePath => {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = chrome.runtime.getURL(filePath);
        document.head.appendChild(linkElement);
    });
}

function createFloatingPanel() {
    if (document.getElementById('bilibili-plugin-panel')) return;

    loadCSS(['panel.css', 'danmu.css']); // 引用多个 CSS 文件

    console.log('Creating floating panel...'); // 调试信息

    const panel = document.createElement('div');
    panel.id = 'bilibili-plugin-panel';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'icon-container';

    // 加载弹幕数据并创建按钮
    loadDanmus().then(danmus => {
        const categories = [...new Set(danmus.map(danmu => danmu.category))];
        
        // 自定义排序顺序
        const customOrder = ['感叹','搞笑', '吐槽', '应援', '剧情讨论','知识补充', '其他']; // 自定义排序顺序

        // 根据自定义顺序排序类别
        categories.sort((a, b) => {
            return customOrder.indexOf(a) - customOrder.indexOf(b);
        });

        // 创建按钮
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `category-button ${category.toLowerCase()}`; // 给每个类别一个唯一的类名

            // 设置按钮样式
            button.style.width = '100px';
            button.style.height = '100px';
            button.style.borderRadius = '5px';
            button.style.border = 'none';
            button.style.backgroundSize = 'cover';
            button.style.backgroundRepeat = 'no-repeat';
            button.style.cursor = 'pointer';

            // 根据类别设置对应的图片
            switch (category) {
                case '感叹':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/gantan.png')})`;
                    break;
                case '搞笑':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/gaoxiao.png')})`;
                    break;
                case '吐槽':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/tucao.png')})`;
                    break;
                case '应援':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/yingyuan.png')})`;
                    break;
                case '剧情讨论':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/juqingtaolun.png')})`;
                    break;
                case '知识补充':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/zhishibuchong.png')})`;
                    break;
                case '其他':
                    button.style.backgroundImage = `url(${chrome.runtime.getURL('icons/qita.png')})`;
                    break;
                default:
                    button.style.backgroundColor = '#5daafc'; // 备用颜色
                    break;
            }

            // 点击事件，显示对应分类的弹幕
            button.addEventListener('click', function() {
                showDanmusByCategory(category, danmus);
            });

            iconContainer.appendChild(button);
        });

        const panelText = document.createElement('span');
        panelText.textContent = '弹幕类型';

        panel.appendChild(panelText);
        panel.appendChild(iconContainer);
        document.body.appendChild(panel);
    }).catch(error => {
        console.error('Failed to load danmus:', error);
    });
}


function loadDanmus() {
    return fetch(chrome.runtime.getURL('balanced_danmus.json'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => data)
        .catch(error => {
            console.error('Failed to load danmus:', error);
            return [];
        });
}

function showDanmusByCategory(category, danmus) {
    // 过滤弹幕，确保只显示选择的类别
    const filteredDanmus = danmus
        .filter(danmu => danmu.category === category) // 只保留选中类别的弹幕
        .sort((a, b) => a.time - b.time); // 按时间排序

    // 清除之前的所有弹幕，包括“我的弹幕”
    document.querySelectorAll('.danmu-item').forEach(item => item.remove());

    const danmuAreaTop = document.getElementById('danmu-area-top') || createDanmuAreaTop();
    const danmuAreaBottom = document.getElementById('danmu-area-bottom') || createDanmuAreaBottom();

    // 确保“我发的弹幕”至少出现 5 次
    const mineDanmus = Array(5).fill(null).map(() => ({
        content: '我发的弹幕',
        isMine: true, // 标记为我的弹幕
        time: Math.random() * 60 // 假设每个弹幕的时间范围是 60 秒内
    }));

    // 合并过滤后的弹幕和“我的弹幕”
    const totalDanmus = [...filteredDanmus, ...mineDanmus];

    // 按时间排序，确保顺序显示
    totalDanmus.sort((a, b) => a.time - b.time);

    totalDanmus.forEach((danmu) => {
        // 使用弹幕的 time 属性控制弹幕何时出现
        setTimeout(() => {
            const danmuElement = document.createElement('div');
            danmuElement.textContent = danmu.content;
            danmuElement.className = 'danmu-item';
            
            // 根据类别动态添加类名
            const categoryClass = danmu.category ? `category-${danmu.category.replace(/\s+/g, '-').toLowerCase()}` : 'category-unknown';
            danmuElement.classList.add(categoryClass);

            // 确定弹幕区域，如果是“我的弹幕”则在顶部区域
            let danmuArea = danmu.isMine ? danmuAreaTop : danmuAreaBottom;

            if (danmu.isMine) {
                danmuElement.classList.add('mine'); // 为“我的弹幕”添加特定样式
            }

            // 为弹幕元素添加上拉面板和下拉面板
            const upperPanel = createUpperPanel(danmu);
            const lowerPanel = createLowerPanel(danmu);
            danmuElement.appendChild(upperPanel);
            danmuElement.appendChild(lowerPanel);

            // 随机设置弹幕的位置
            const areaRect = danmuArea.getBoundingClientRect();
            const leftPosition = Math.random() * (areaRect.width - 200);
            const topPosition = Math.random() * (areaRect.height - 50);

            danmuElement.style.left = `${leftPosition}px`;
            danmuElement.style.top = `${topPosition}px`;

            // 将弹幕添加到对应区域
            danmuArea.appendChild(danmuElement);
        }, danmu.time * 1000); // 使用 time 来设置延迟，单位是秒
    });
}






function createUpperPanel(danmu) {
    const upperPanel = document.createElement('div');
    upperPanel.className = 'danmu-upper-panel';

    // 时间显示
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';
    timeDisplay.textContent = new Date(danmu.time * 1000).toISOString().substr(14, 5); // 格式化时间 00:00

    // 按钮容器
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';

    // 点赞按钮
    const likeButton = document.createElement('button');
    likeButton.className = 'like-icon';
    actionButtons.appendChild(likeButton);

    // 评论按钮
    const commentButton = document.createElement('button');
    commentButton.className = 'comment-icon';
    actionButtons.appendChild(commentButton);

    // 复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-icon';
    actionButtons.appendChild(copyButton);

    // 将时间和按钮添加到面板
    upperPanel.appendChild(timeDisplay);
    upperPanel.appendChild(actionButtons);

    return upperPanel;
}

function createLowerPanel(danmu) {
    const lowerPanel = document.createElement('div');
    lowerPanel.className = 'danmu-lower-panel';

    // 回复示例
    const replies = [
        { time: danmu.time + 2, content: "弹幕君飘过～" },
        { time: danmu.time + 4, content: "弹幕君飘过～弹幕君过" },
        { time: danmu.time + 6, content: "弹幕君" }
    ];

    replies.forEach(reply => {
        const replyItem = document.createElement('div');
        replyItem.className = 'reply-item';

        // 回复时间
        const replyTime = document.createElement('div');
        replyTime.className = 'reply-time';
        replyTime.textContent = new Date(reply.time * 1000).toISOString().substr(14, 5);

        // 回复内容
        const replyContent = document.createElement('div');
        replyContent.textContent = reply.content;

        // 将回复时间和内容添加到 replyItem
        replyItem.appendChild(replyTime);
        replyItem.appendChild(replyContent);

        lowerPanel.appendChild(replyItem);
    });

    return lowerPanel;
}


function createDanmuAreaTop() {
    const area = document.createElement('div');
    area.id = 'danmu-area-top';
    area.className = 'danmu-area-top';
    document.body.appendChild(area);
    return area;
}

function createDanmuAreaBottom() {
    const area = document.createElement('div');
    area.id = 'danmu-area-bottom';
    area.className = 'danmu-area-bottom';
    document.body.appendChild(area);
    return area;
}

// 初始化插件，创建悬浮面板
createFloatingPanel();

// 从 storage 中获取开关状态，并根据状态决定是否隐藏元素
chrome.storage.sync.get(['hideElement'], function(result) {
    if (result.hideElement) {
        const elementToHide = document.querySelector("#mirror-vdcon > div.right-container.is-in-large-ab");
        if (elementToHide) {
            elementToHide.style.display = 'none';
        }
    }
});

// 监听来自 popup.js 的消息，实时更新元素可见性
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hideElement !== undefined) {
        const panel = document.getElementById('bilibili-plugin-panel');
        if (request.hideElement) {
            if (!panel) {
                createFloatingPanel();
            }
        } else {
            if (panel) {
                panel.remove();
            }
        }

        const elementToHide = document.querySelector("#mirror-vdcon > div.right-container.is-in-large-ab");
        if (elementToHide) {
            elementToHide.style.display = request.hideElement ? 'none' : '';
        }
    }
});

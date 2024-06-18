// ==UserScript==
// @name         B站合集、列表时间查询
// @namespace    http://tampermonkey.net/
// @version      2
// @description  实现B站合集的总时长、观看时长、剩余时长
// @author       Lint
// @match        https://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=greasyfork.org
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/498267/B%E7%AB%99%E5%90%88%E9%9B%86%E3%80%81%E5%88%97%E8%A1%A8%E6%97%B6%E9%97%B4%E6%9F%A5%E8%AF%A2.user.js
// @updateURL https://update.greasyfork.org/scripts/498267/B%E7%AB%99%E5%90%88%E9%9B%86%E3%80%81%E5%88%97%E8%A1%A8%E6%97%B6%E9%97%B4%E6%9F%A5%E8%AF%A2.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // 创建时间显示的元素
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.style.position = 'fixed';
    timeDisplay.style.left = '10px';
    timeDisplay.style.bottom = '10px';
    timeDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timeDisplay.style.color = 'white';
    timeDisplay.style.padding = '10px';
    timeDisplay.style.borderRadius = '5px';
    document.body.appendChild(timeDisplay);

    // 创建按钮
    const executeButton = document.createElement('button');
    executeButton.id = 'execute-button';
    executeButton.textContent = '更新时间';
    executeButton.style.position = 'fixed';
    executeButton.style.right = '10px';
    executeButton.style.bottom = '10px';
    executeButton.style.backgroundColor = '#007BFF';
    executeButton.style.color = 'white';
    executeButton.style.border = 'none';
    executeButton.style.padding = '10px';
    executeButton.style.borderRadius = '5px';
    executeButton.style.cursor = 'pointer';
    executeButton.onmouseover = () => executeButton.style.backgroundColor = '#0056b3';
    executeButton.onmouseout = () => executeButton.style.backgroundColor = '#007BFF';
    document.body.appendChild(executeButton);

    // 格式化时长函数
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 解析时长并转换为秒的函数
    function parseDuration(durationText) {
        const timeParts = durationText.trim().split(':').map(Number);
        let seconds = 0;
        if (timeParts.length === 3) {
            // 如果包含小时部分
            const [hours, minutes, secs] = timeParts;
            seconds = hours * 3600 + minutes * 60 + secs;
        } else if (timeParts.length === 2) {
            // 如果只有分钟和秒
            const [minutes, secs] = timeParts;
            seconds = minutes * 60 + secs;
        }
        return seconds;
    }

    // 计算时长的函数
    function calculateDurations(durationsInSeconds, currentVideoIndex) {
        const totalDurationInSeconds = durationsInSeconds.reduce((total, duration) => total + duration, 0);
        const watchedDurationInSeconds = durationsInSeconds.slice(0, currentVideoIndex).reduce((total, duration) => total + duration, 0);
        const currentVideoProgressInSeconds = 0; // 假设当前视频的观看进度为0，需要根据实际情况调整
        const totalWatchedDurationInSeconds = watchedDurationInSeconds + currentVideoProgressInSeconds;
        const remainingDurationInSeconds = totalDurationInSeconds - totalWatchedDurationInSeconds;
        return {
            totalDurationInSeconds,
            totalWatchedDurationInSeconds,
            remainingDurationInSeconds
        };
    }

    // 更新合集时长的函数
    function updateCollectionDurations() {
        const currentPageElement = document.querySelector('.cur-page');
        if (!currentPageElement) return false;
        const [currentVideoIndex, totalVideos] = currentPageElement.textContent.match(/\d+/g).map(Number);
        const currentVideoZeroBasedIndex = currentVideoIndex - 1;

        const videoDurations = document.querySelectorAll('.video-episode-card__info-duration');
        if (videoDurations.length === 0) return false;

        const durationsInSeconds = Array.from(videoDurations).map(durationElement => parseDuration(durationElement.textContent));

        const { totalDurationInSeconds, totalWatchedDurationInSeconds, remainingDurationInSeconds } = calculateDurations(durationsInSeconds, currentVideoZeroBasedIndex);

        timeDisplay.innerHTML = `
            总时长: ${formatDuration(totalDurationInSeconds)}<br>
            已观看时长: ${formatDuration(totalWatchedDurationInSeconds)}<br>
            剩余时长: ${formatDuration(remainingDurationInSeconds)}
        `;
        return true;
    }

    // 更新列表时长的函数
    function updateListDurations() {
        const listBox = document.querySelector('.list-box');
        if (!listBox) return false;

        const videoItems = listBox.querySelectorAll('li');
        if (videoItems.length === 0) return false;

        const durationsInSeconds = Array.from(videoItems).map(item => {
            const durationElement = item.querySelector('.duration');
            return durationElement ? parseDuration(durationElement.textContent) : 0;
        });

        const currentVideoItem = listBox.querySelector('.on');
        if (!currentVideoItem) return false;

        const currentVideoIndex = Array.from(videoItems).indexOf(currentVideoItem);

        const { totalDurationInSeconds, totalWatchedDurationInSeconds, remainingDurationInSeconds } = calculateDurations(durationsInSeconds, currentVideoIndex);

        timeDisplay.innerHTML = `
            总时长: ${formatDuration(totalDurationInSeconds)}<br>
            已观看时长: ${formatDuration(totalWatchedDurationInSeconds)}<br>
            剩余时长: ${formatDuration(remainingDurationInSeconds)}
        `;
        return true;
    }

    // 更新时长的主函数
    function updateDurations() {
        if (!updateCollectionDurations()) {
            updateListDurations();
        }
    }

    // 添加按钮点击事件监听器
    executeButton.addEventListener('click', updateDurations);

    // 初始加载时执行一次
    updateDurations();
})();
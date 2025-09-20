// character.js

const characterImages = [
    './images/level-0.png', './images/level-1.png', './images/level-2.png',
    './images/level-3.png', './images/level-4.png', './images/level-5.png',
    './images/level-6.png', './images/level-7.png', './images/level-8.png',
    './images/level-9.png', './images/level-10.png', './images/level-11.png'
];

// 直接定義一個全域可存取的物件，而不是導出
const Character = {
    getImageByLevel: function(level) {
        const validLevel = Math.max(0, Math.min(level, characterImages.length - 1));
        return characterImages[validLevel];
    },
    
    // 新增：根據百分比獲取角色圖片
    getImageByPercentage: function(percentage) {
        if (percentage <= 0) return characterImages[0];
        if (percentage <= 10) return characterImages[1];
        if (percentage <= 20) return characterImages[2];
        if (percentage <= 30) return characterImages[3];
        if (percentage <= 40) return characterImages[4];
        if (percentage <= 50) return characterImages[5];
        if (percentage <= 60) return characterImages[6];
        if (percentage <= 70) return characterImages[7];
        if (percentage <= 80) return characterImages[8];
        if (percentage <= 90) return characterImages[9];
        if (percentage <= 100) return characterImages[10];
        // 超過100%的情況
        return characterImages[11];
    },
    
    // 新增：獲取角色狀態描述
    getCharacterStatus: function(percentage) {
        if (percentage <= 0) return { status: '完美', emoji: '😊', color: 'green' };
        if (percentage <= 10) return { status: '良好', emoji: '😌', color: 'green' };
        if (percentage <= 20) return { status: '正常', emoji: '🙂', color: 'green' };
        if (percentage <= 30) return { status: '注意', emoji: '😐', color: 'yellow' };
        if (percentage <= 40) return { status: '小心', emoji: '😟', color: 'yellow' };
        if (percentage <= 50) return { status: '警告', emoji: '😰', color: 'orange' };
        if (percentage <= 60) return { status: '危險', emoji: '😱', color: 'orange' };
        if (percentage <= 70) return { status: '嚴重', emoji: '😵', color: 'red' };
        if (percentage <= 80) return { status: '危急', emoji: '🤯', color: 'red' };
        if (percentage <= 90) return { status: '崩潰', emoji: '💀', color: 'red' };
        if (percentage <= 100) return { status: '破產', emoji: '💸', color: 'red' };
        // 超過100%的情況
        return { status: '超支', emoji: '🚨', color: 'purple' };
    }
};
// character.js

const characterImages = [
    './images/level-0.png', './images/level-1.png', './images/level-2.png',
    './images/level-3.png', './images/level-4.png', './images/level-5.png',
    './images/level-6.png', './images/level-7.png', './images/level-8.png',
    './images/level-9.png'
];

// 直接定義一個全域可存取的物件，而不是導出
const Character = {
    getImageByLevel: function(level) {
        const validLevel = Math.max(0, Math.min(level, characterImages.length - 1));
        return characterImages[validLevel];
    }
};
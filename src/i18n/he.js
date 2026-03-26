// Hebrew localization for Runner! game
export const T = {
  // StartScreen
  appTitle:        'ראנר!',
  subtitle:        'התחמק • אסוף • ענה',
  startGame:       '▶  התחל',
  openShop:        '🛒',
  shopLabel:       'חנות',
  version:         'v2.0 • מהדורת מתמטיקה',
  instrLanes:      'הקש שמאל / ימין להחלפת נתיב',
  instrDodge:      'התחמק ממכשולים',
  instrCoins:      'אסוף מטבעות — בזבז בחנות',
  instrQuiz:       'ענה נכון כדי להמשיך',
  instrCombo:      'בנה קומבו לכוחות מיוחדים!',

  // GameScreen HUD
  score:           'ניקוד',
  coins:           'מטבעות',
  comboX:          (n) => `קומבו ×${n}`,
  shieldBlocked:   '🛡️ המגן חסם!',
  doubleCoins:     '×2 מטבעות!',
  slowMo:          '⏳ איטי...',
  shieldActive:    '🛡️ מגן פעיל',
  laneBtns: {
    left:  '◀',
    right: '▶',
  },

  // QuizModal
  quizHeader:      'מהר! ענה כדי לשרוד!',
  quizLastChance:  '⚡ הזדמנות אחרונה!',
  tapAnswer:       'הקש על תשובה!',
  correct:         '🎉 נכון! המשך לרוץ!',
  wrong:           '💀 טעות!',
  waitRetry:       '⏳ רגע…',
  extraLifeAvail:  '❤️ חיים נוספים זמינים',

  // Second-chance screen
  extraLifeTitle:  'חיים נוספים!',
  extraLifeSub:    'טעית, אבל יש לך חיים נוספים.',
  tryAgain:        '🔄  נסה שוב',
  giveUp:          '💀  ויתור',

  // GameOverScreen
  gameOver:        '💀 המשחק נגמר 💀',
  statScore:       'ניקוד',
  statCoinsEarned: 'מטבעות שנצברו',
  statTotalCoins:  'סה"כ מטבעות',
  playAgain:       '🔄  שחק שוב',
  ranks: {
    legend:   'אגדה',
    master:   'מאסטר',
    pro:      'מקצוען',
    runner:   'ראנר',
    beginner: 'מתחיל',
  },
  tipText: 'קומבו ×2 = כפל מטבעות  •  ×3 = תנועה איטית  •  ×4 = מגן חינם',

  // ShopScreen
  shopTitle:       '🛒 חנות',
  shopCoins:       (n) => `🪙 ${n}`,
  buy:             'קנה',
  owned:           'נרכש',
  noCoins:         'אין מספיק מטבעות',
  shopItems: {
    extraLifeName: 'חיים נוספים',
    extraLifeDesc: 'ענה פעם נוספת אם טעית',
    shieldName:    'מגן התחלה',
    shieldDesc:    'מגן לפני השאלה הראשונה',
    colorName:     'צבע שחקן',
    colorDesc:     'שנה את צבע הדמות',
  },
  colorNames: {
    default: 'ברירת מחדל',
    teal:    'ירוק-כחול',
    purple:  'סגול',
    gold:    'זהב',
  },
  backBtn: '← חזרה',
};

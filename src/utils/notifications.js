export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ title, body });
  } else {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

export const scheduleDailyReminder = () => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);

  if (now > target) target.setDate(target.getDate() + 1);

  const msUntil = target - now;

  setTimeout(() => {
    showNotification(
      '📝 Daily Reminder',
      "Don't forget to log your expenses for today!"
    );
    setInterval(() => {
      showNotification(
        '📝 Daily Reminder',
        "Don't forget to log your expenses for today!"
      );
    }, 24 * 60 * 60 * 1000);
  }, msUntil);
};

export const checkStreakNotification = (currentStreak, bestStreak, prevBest) => {
  const milestones = [5, 10, 20];
  milestones.forEach((m) => {
    if (currentStreak === m) {
      showNotification(
        `🔥 ${m} Day No-Spend Streak!`,
        `Amazing! You've gone ${m} days without spending. Keep it up!`
      );
    }
  });

  if (currentStreak > prevBest && currentStreak > 0) {
    showNotification(
      '🏆 New Best Streak!',
      `You just hit your record of ${currentStreak} no-spend days!`
    );
  }
};

export const checkBudgetNotification = (totalSpent, monthlyGoal) => {
  const percent = (totalSpent / monthlyGoal) * 100;
  if (percent >= 100) {
    showNotification(
      '🚨 Over Budget!',
      `You've exceeded your ₹${monthlyGoal.toLocaleString('en-IN')} monthly goal.`
    );
  } else if (percent >= 90) {
    showNotification(
      '⚠️ Almost Over Budget!',
      `You've used ${Math.round(percent)}% of your monthly goal.`
    );
  }
};

export const checkMonthlySummary = (totalSpent, noSpendDays, bestStreak) => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (today.getDate() === lastDay) {
    showNotification(
      '📅 Monthly Summary',
      `This month: ₹${totalSpent.toLocaleString('en-IN')} spent, ${noSpendDays} no-spend days, best streak ${bestStreak} days.`
    );
  }
};
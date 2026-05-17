import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../App.css";
import {
  registerServiceWorker,
  requestNotificationPermission,
  scheduleDailyReminder,
  checkStreakNotification,
  checkBudgetNotification,
  checkMonthlySummary,
} from "../utils/notifications";

export default function Dashboard() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("calendar-expenses");
    return saved ? JSON.parse(saved) : {};
  });

  const [showModal, setShowModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReason, setExpenseReason] = useState("");

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("user-name") || "";
  });
  const [showNameModal, setShowNameModal] = useState(() => {
    return !localStorage.getItem("user-name");
  });
  const [nameInput, setNameInput] = useState("");

  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    return Number(localStorage.getItem("monthly-goal")) || 10000;
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const [activeTab, setActiveTab] = useState("home");
  const [prevBestStreak, setPrevBestStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Savings goals state
  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem("savings-goals");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalSaved, setNewGoalSaved] = useState("");

  useEffect(() => {
    localStorage.setItem("calendar-expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("savings-goals", JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    const init = async () => {
      await registerServiceWorker();
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        scheduleDailyReminder();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;
    checkStreakNotification(currentStreak, bestStreak, prevBestStreak);
    setPrevBestStreak(bestStreak);
    checkBudgetNotification(totalSpent, monthlyGoal);
    checkMonthlySummary(totalSpent, noSpendDays, bestStreak);
  }, [expenses]);

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const generateDateKey = (day) => `${currentYear}-${currentMonth + 1}-${day}`;

  const totalSpent = Object.entries(expenses)
    .filter(([date]) => {
      const [year, month] = date.split("-");
      return Number(year) === currentYear && Number(month) === currentMonth + 1;
    })
    .flatMap(([, value]) => value)
    .reduce((total, item) => total + Number(item.amount), 0);

  const noSpendDays = Object.entries(expenses)
    .filter(([date, value]) => {
      const [year, month] = date.split("-");
      return (
        Number(year) === currentYear &&
        Number(month) === currentMonth + 1 &&
        value.length === 0
      );
    }).length;

  const calculateStreaks = () => {
    let best = 0;
    let temp = 0;
    for (let d = 1; d <= today.getDate(); d++) {
      const key = `${today.getFullYear()}-${today.getMonth() + 1}-${d}`;
      const entry = expenses[key];
      if (entry && entry.length === 0) {
        temp++;
        if (temp > best) best = temp;
      } else if (entry !== undefined) {
        temp = 0;
      }
    }
    const current = temp;
    const allKeys = Object.keys(expenses).sort();
    let runningBest = 0;
    let runningTemp = 0;
    allKeys.forEach((key) => {
      if (expenses[key] && expenses[key].length === 0) {
        runningTemp++;
        if (runningTemp > runningBest) runningBest = runningTemp;
      } else {
        runningTemp = 0;
      }
    });
    return { current, best: Math.max(best, runningBest) };
  };

  const { current: currentStreak, best: bestStreak } = calculateStreaks();

  const goalPercent = Math.min(Math.round((totalSpent / monthlyGoal) * 100), 100);

  const recentExpenses = Object.entries(expenses)
    .filter(([, value]) => value.length > 0)
    .flatMap(([date, items]) => items.map((item) => ({ ...item, date })))
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // Analytics data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return { month: d.getMonth(), year: d.getFullYear(), label: monthNames[d.getMonth()].slice(0, 3) };
  }).reverse();

  const analyticsData = last6Months.map(({ month, year, label }) => {
    const spent = Object.entries(expenses)
      .filter(([date]) => {
        const [y, m] = date.split("-");
        return Number(y) === year && Number(m) === month + 1;
      })
      .flatMap(([, value]) => value)
      .reduce((total, item) => total + Number(item.amount), 0);
    const noSpend = Object.entries(expenses)
      .filter(([date, value]) => {
        const [y, m] = date.split("-");
        return Number(y) === year && Number(m) === month + 1 && value.length === 0;
      }).length;
    return { label, spent, noSpend };
  });

  const maxSpent = Math.max(...analyticsData.map((d) => d.spent), 1);

  // Category breakdown
  const categoryData = Object.entries(expenses)
    .flatMap(([, items]) => items)
    .reduce((acc, item) => {
      const reason = item.reason || "Other";
      acc[reason] = (acc[reason] || 0) + Number(item.amount);
      return acc;
    }, {});

  const topCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalAllTime = topCategories.reduce((sum, [, v]) => sum + v, 0);

  const getDateExpenses = (day) => expenses[generateDateKey(day)];

  const openExpenseModal = (day) => {
    setSelectedDate(generateDateKey(day));
    setShowModal(true);
  };

  const addExpense = () => {
    if (!expenseAmount || !expenseReason || !selectedDate) return;
    const newExpense = { id: Date.now(), amount: expenseAmount, reason: expenseReason };
    const currentExpenses = expenses[selectedDate] || [];
    setExpenses({ ...expenses, [selectedDate]: [...currentExpenses, newExpense] });
    setExpenseAmount("");
    setExpenseReason("");
    setShowModal(false);
  };

  const markNoSpendFromModal = () => {
    if (!selectedDate) return;
    setExpenses({ ...expenses, [selectedDate]: [] });
    setShowModal(false);
  };

  const deleteDay = (day) => {
    const key = generateDateKey(day);
    const updated = { ...expenses };
    delete updated[key];
    setExpenses(updated);
  };

  const previousMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const saveName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem("user-name", nameInput.trim());
    setUserName(nameInput.trim());
    setShowNameModal(false);
  };

  const saveGoal = () => {
    const val = Number(goalInput);
    if (!val || val <= 0) return;
    localStorage.setItem("monthly-goal", val);
    setMonthlyGoal(val);
    setGoalInput("");
    setShowGoalModal(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const addSavingsGoal = () => {
    if (!newGoalName || !newGoalTarget) return;
    const goal = {
      id: Date.now(),
      name: newGoalName,
      target: Number(newGoalTarget),
      saved: Number(newGoalSaved) || 0,
    };
    setSavingsGoals([...savingsGoals, goal]);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalSaved("");
    setShowSavingsGoalModal(false);
  };

  const updateSavedAmount = (id, amount) => {
    setSavingsGoals(savingsGoals.map((g) =>
      g.id === id ? { ...g, saved: Math.min(Number(amount), g.target) } : g
    ));
  };

  const deleteSavingsGoal = (id) => {
    setSavingsGoals(savingsGoals.filter((g) => g.id !== id));
  };

  const formatDate = (dateKey) => {
    const [year, month, day] = dateKey.split("-");
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const colors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

  return (
    <div className="app">
      <div className="container">

        {/* HOME TAB */}
        {activeTab === "home" && (
          <>
            <div className="greeting-bar">
              <div>
                <p className="greeting-text">{getGreeting()}, {userName || "there"} 👋</p>
                <p className="greeting-sub">Stay consistent, see the difference.</p>
              </div>
              <button className="edit-name-btn" onClick={() => setShowNameModal(true)}>✏️</button>
            </div>

            <div className="top-bar">
              <div className="stats">
                <div className="stat-card spent">
                  <p>This Month</p>
                  <h2>₹{totalSpent.toLocaleString("en-IN")}</h2>
                </div>
                <div className="stat-card nospend">
                  <p>No Spend Days</p>
                  <h2>{noSpendDays}</h2>
                </div>
                <div className="stat-card streak">
                  <p>Current Streak</p>
                  <h2>{currentStreak} 🔥</h2>
                </div>
                <div className="stat-card best-streak">
                  <p>Best Streak</p>
                  <h2>{bestStreak} 🏆</h2>
                </div>
              </div>
            </div>

            <div className="goal-section">
              <div className="goal-header">
                <span className="goal-label">Monthly Goal</span>
                <div className="goal-right">
                  <span className="goal-amount">₹{monthlyGoal.toLocaleString("en-IN")}</span>
                  <button className="edit-goal-btn" onClick={() => setShowGoalModal(true)}>Edit</button>
                </div>
              </div>
              <div className="goal-bar-bg">
                <div className="goal-bar-fill" style={{
                  width: `${goalPercent}%`,
                  background: goalPercent >= 100 ? "#dc2626" : goalPercent >= 75 ? "#ea580c" : "#16a34a"
                }} />
              </div>
              <div className="goal-footer">
                <span style={{ color: goalPercent >= 100 ? "#dc2626" : "#16a34a" }}>{goalPercent}% of goal</span>
                <span className="goal-left">
                  {totalSpent >= monthlyGoal
                    ? `₹${(totalSpent - monthlyGoal).toLocaleString("en-IN")} over budget`
                    : `₹${(monthlyGoal - totalSpent).toLocaleString("en-IN")} left`}
                </span>
              </div>
            </div>

            <div className="month-navigation">
              <button onClick={previousMonth} className="nav-button">←</button>
              <h2 className="month-title">{monthNames[currentMonth]} {currentYear}</h2>
              <button onClick={nextMonth} className="nav-button">→</button>
            </div>

            <div className="weekdays">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
              <div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="calendar-grid">
              {Array.from({ length: firstDay }).map((_, i) => <div key={i}></div>)}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateExpenses = getDateExpenses(day);
                const isFutureDate = currentYear === today.getFullYear() && currentMonth === today.getMonth() && day > today.getDate();
                const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate();
                const isNoSpend = dateExpenses && dateExpenses.length === 0;
                const spentAmount = dateExpenses ? dateExpenses.reduce((total, item) => total + Number(item.amount), 0) : 0;
                return (
                  <div
                    key={day}
                    className={`day-card ${isNoSpend ? "no-spend-day" : ""} ${isToday ? "today-card" : ""} ${isFutureDate ? "future-card" : ""}`}
                    onClick={() => !isFutureDate && openExpenseModal(day)}
                  >
                    <h3 className="day-number">{day}</h3>
                    {dateExpenses && (
                      <button className="delete-day" onClick={(e) => { e.stopPropagation(); deleteDay(day); }}>🗑</button>
                    )}
                    {isNoSpend && <div className="no-spend-text">✓ No Spend</div>}
                    {!isNoSpend && spentAmount > 0 && (
                      <div className="expense-content">
                        <p className="spent-amount">₹{spentAmount.toLocaleString("en-IN")}</p>
                        {dateExpenses.slice(0, 2).map((e) => (
                          <p key={e.id} className="expense-reason">• {e.reason}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {recentExpenses.length > 0 && (
              <div className="recent-section">
                <h3 className="recent-title">Recent Expenses</h3>
                {recentExpenses.map((item) => (
                  <div key={item.id} className="recent-item">
                    <div className="recent-left">
                      <span className="recent-reason">{item.reason}</span>
                      <span className="recent-date">{formatDate(item.date)}</span>
                    </div>
                    <span className="recent-amount">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="tab-content">
            <h2 className="tab-title">Analytics 📊</h2>

            <div className="analytics-card">
              <h3 className="analytics-subtitle">Monthly Spending (Last 6 Months)</h3>
              <div className="bar-chart">
                {analyticsData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <span className="bar-value">₹{d.spent > 0 ? (d.spent / 1000).toFixed(1) + "k" : "0"}</span>
                    <div className="bar-wrap">
                      <div className="bar-fill" style={{
                        height: `${(d.spent / maxSpent) * 100}%`,
                        background: "#6366f1"
                      }} />
                    </div>
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h3 className="analytics-subtitle">No-Spend Days (Last 6 Months)</h3>
              <div className="bar-chart">
                {analyticsData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <span className="bar-value">{d.noSpend}</span>
                    <div className="bar-wrap">
                      <div className="bar-fill" style={{
                        height: `${(d.noSpend / Math.max(...analyticsData.map(x => x.noSpend), 1)) * 100}%`,
                        background: "#16a34a"
                      }} />
                    </div>
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {topCategories.length > 0 && (
              <div className="analytics-card">
                <h3 className="analytics-subtitle">Top Spending Categories</h3>
                {topCategories.map(([name, amount], i) => (
                  <div key={i} className="category-item">
                    <div className="category-left">
                      <span className="category-dot" style={{ background: colors[i % colors.length] }} />
                      <span className="category-name">{name}</span>
                    </div>
                    <div className="category-right">
                      <div className="category-bar-bg">
                        <div className="category-bar-fill" style={{
                          width: `${(amount / totalAllTime) * 100}%`,
                          background: colors[i % colors.length]
                        }} />
                      </div>
                      <span className="category-amount">₹{amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="analytics-card">
              <h3 className="analytics-subtitle">All Time Stats</h3>
              <div className="alltime-stats">
                <div className="alltime-item">
                  <p>Total Spent</p>
                  <h3>₹{Object.values(expenses).flat().reduce((t, i) => t + Number(i.amount), 0).toLocaleString("en-IN")}</h3>
                </div>
                <div className="alltime-item">
                  <p>No Spend Days</p>
                  <h3>{Object.values(expenses).filter(v => v.length === 0).length}</h3>
                </div>
                <div className="alltime-item">
                  <p>Best Streak</p>
                  <h3>{bestStreak} 🔥</h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="tab-title">Goals 🎯</h2>
              <button className="add-goal-btn" onClick={() => setShowSavingsGoalModal(true)}>+ Add Goal</button>
            </div>

            {savingsGoals.length === 0 ? (
              <div className="empty-state">
                <p>🎯</p>
                <p>No goals yet!</p>
                <p>Add a savings goal to get started.</p>
              </div>
            ) : (
              savingsGoals.map((goal) => {
                const percent = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
                return (
                  <div key={goal.id} className="savings-goal-card">
                    <div className="savings-goal-header">
                      <span className="savings-goal-name">{goal.name}</span>
                      <button className="delete-goal-btn" onClick={() => deleteSavingsGoal(goal.id)}>🗑</button>
                    </div>
                    <div className="savings-goal-amounts">
                      <span>₹{goal.saved.toLocaleString("en-IN")} saved</span>
                      <span>₹{goal.target.toLocaleString("en-IN")} target</span>
                    </div>
                    <div className="goal-bar-bg">
                      <div className="goal-bar-fill" style={{
                        width: `${percent}%`,
                        background: percent >= 100 ? "#16a34a" : "#6366f1"
                      }} />
                    </div>
                    <div className="savings-goal-footer">
                      <span style={{ color: percent >= 100 ? "#16a34a" : "#6366f1" }}>{percent}% complete</span>
                      {percent < 100 && (
                        <input
                          type="number"
                          className="savings-input"
                          placeholder="Update saved ₹"
                          onBlur={(e) => updateSavedAmount(goal.id, e.target.value)}
                        />
                      )}
                      {percent >= 100 && <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ Achieved!</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <h2 className="tab-title">Profile 👤</h2>

            <div className="profile-card">
              <div className="profile-avatar">
                {userName ? userName.charAt(0).toUpperCase() : "?"}
              </div>
              <h3 className="profile-name">{userName || "No name set"}</h3>
              <p className="profile-sub">Expense Tracker User</p>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <h3>{Object.keys(expenses).length}</h3>
                <p>Days Logged</p>
              </div>
              <div className="profile-stat">
                <h3>{Object.values(expenses).filter(v => v.length === 0).length}</h3>
                <p>No Spend Days</p>
              </div>
              <div className="profile-stat">
                <h3>{bestStreak} 🔥</h3>
                <p>Best Streak</p>
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-btn" onClick={() => setShowNameModal(true)}>✏️ Edit Name</button>
              <button className="profile-btn" onClick={() => setShowGoalModal(true)}>🎯 Edit Monthly Goal</button>
              <button className="profile-btn signout-btn" onClick={handleSignOut}>🚪 Sign Out</button>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <button className={`nav-tab ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>
          <span>🏠</span><span>Home</span>
        </button>
        <button className={`nav-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          <span>📊</span><span>Analytics</span>
        </button>
        <button className={`nav-tab ${activeTab === "goals" ? "active" : ""}`} onClick={() => setActiveTab("goals")}>
          <span>🎯</span><span>Goals</span>
        </button>
        <button className={`nav-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          <span>👤</span><span>Profile</span>
        </button>
      </div>

      {/* EXPENSE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Expense</h2>
            <input type="number" placeholder="Amount (₹)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            <input type="text" placeholder="Reason" value={expenseReason} onChange={(e) => setExpenseReason(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={addExpense}>Save</button>
              <button onClick={markNoSpendFromModal}>No Spend</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NAME MODAL */}
      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Welcome! 👋</h2>
            <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>What should we call you?</p>
            <input type="text" placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} />
            <div className="modal-buttons">
              <button onClick={saveName}>Let's go!</button>
            </div>
          </div>
        </div>
      )}

      {/* GOAL MODAL */}
      {showGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Set Monthly Goal</h2>
            <p style={{ color: "#666", marginTop: "8px", fontSize: "14px" }}>Current goal: ₹{monthlyGoal.toLocaleString("en-IN")}</p>
            <input type="number" placeholder="New goal amount (₹)" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveGoal()} />
            <div className="modal-buttons">
              <button onClick={saveGoal}>Save</button>
              <button onClick={() => setShowGoalModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SAVINGS GOAL MODAL */}
      {showSavingsGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Savings Goal</h2>
            <input type="text" placeholder="Goal name (e.g. New Phone)" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
            <input type="number" placeholder="Target amount (₹)" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} />
            <input type="number" placeholder="Already saved (₹) — optional" value={newGoalSaved} onChange={(e) => setNewGoalSaved(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={addSavingsGoal}>Add</button>
              <button onClick={() => setShowSavingsGoalModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}
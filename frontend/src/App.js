import React, { useState, useEffect } from 'react';
import './App.css';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#FFB3BA', icon: '🍕' },
  { id: 'transport', name: 'Transportation', color: '#BAFFC9', icon: '🚗' },
  { id: 'entertainment', name: 'Entertainment', color: '#BAE1FF', icon: '🎬' },
  { id: 'bills', name: 'Bills & Utilities', color: '#FFFFBA', icon: '📄' },
  { id: 'shopping', name: 'Shopping', color: '#FFDFBA', icon: '🛍️' },
  { id: 'health', name: 'Health & Fitness', color: '#E0BBE4', icon: '💊' },
  { id: 'education', name: 'Education', color: '#FFC9DE', icon: '📚' },
  { id: 'other', name: 'Other', color: '#D4EDDA', icon: '📦' },
  { id: 'salary', name: 'Salary', color: '#D1ECF1', icon: '💰' },
  { id: 'freelance', name: 'Freelance', color: '#F8D7DA', icon: '💻' },
  { id: 'investment', name: 'Investment', color: '#FFEAA7', icon: '📈' },
];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Load transactions from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('budgetTransactions');
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        if (Array.isArray(parsedTransactions)) {
          setTransactions(parsedTransactions);
        }
      } catch (error) {
        console.error('Error loading transactions from localStorage:', error);
        localStorage.removeItem('budgetTransactions');
      }
    }
  }, []);

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const newTransaction = {
      id: Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
      timestamp: new Date().toISOString()
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({
      amount: '',
      type: 'expense',
      category: 'food',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const getCategoryData = () => {
    const currentMonthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      return t.date.startsWith(selectedMonth);
    });

    const categoryTotals = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'expense' && t.category && t.amount) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (Number(t.amount) || 0);
      }
    });

    return categoryTotals;
  };

  const getMonthlyData = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    const monthlyTotals = months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(monthStr));
      
      const income = monthTransactions
        .filter(t => t.type === 'income' && t.amount)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense' && t.amount)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      return {
        month: format(month, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses
      };
    });

    return monthlyTotals;
  };

  const getCurrentMonthTransactions = () => {
    return transactions.filter(t => {
      if (!t.date) return false;
      return t.date.startsWith(selectedMonth);
    });
  };

  const currentMonthTransactions = getCurrentMonthTransactions();

  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();

  // Chart configurations
  const monthlyChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(d => d.income),
        backgroundColor: '#81C784',
        borderColor: '#4CAF50',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(d => d.expenses),
        backgroundColor: '#F8BBD9',
        borderColor: '#E91E63',
        borderWidth: 1,
      }
    ]
  };

  const categoryChartData = {
    labels: Object.keys(categoryData).map(cat => 
      CATEGORIES.find(c => c.id === cat)?.name || cat
    ),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: Object.keys(categoryData).map(cat => 
        CATEGORIES.find(c => c.id === cat)?.color || '#E0E0E0'
      ),
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Budget Planner
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Balance: <span className={`font-bold ${currentIncome - currentExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(currentIncome - currentExpenses).toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-sm">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'add', label: 'Add Transaction', icon: '➕' },
            { id: 'transactions', label: 'Transactions', icon: '📝' },
            { id: 'categories', label: 'Categories', icon: '🏷️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-purple-600'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-white/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 font-medium">Monthly Income</p>
                    <p className="text-2xl font-bold text-green-800">${currentIncome.toFixed(2)}</p>
                  </div>
                  <span className="text-3xl">💰</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 font-medium">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-red-800">${currentExpenses.toFixed(2)}</p>
                  </div>
                  <span className="text-3xl">💸</span>
                </div>
              </div>
              
              <div className={`bg-gradient-to-br ${currentIncome - currentExpenses >= 0 ? 'from-blue-100 to-blue-200' : 'from-orange-100 to-orange-200'} rounded-xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${currentIncome - currentExpenses >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium`}>Net Balance</p>
                    <p className={`text-2xl font-bold ${currentIncome - currentExpenses >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      ${(currentIncome - currentExpenses).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-3xl">{currentIncome - currentExpenses >= 0 ? '📈' : '📉'}</span>
                </div>
              </div>
            </div>

            {/* Month Selector */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
                <Bar data={monthlyChartData} options={chartOptions} />
              </div>
              
              {Object.keys(categoryData).length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Categories</h3>
                  <Doughnut data={categoryChartData} options={doughnutOptions} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Transaction Tab */}
        {activeTab === 'add' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 shadow-sm max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add Transaction</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'income'})}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      formData.type === 'income'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💰 Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      formData.type === 'expense'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💸 Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {CATEGORIES
                    .filter(cat => formData.type === 'income' 
                      ? ['salary', 'freelance', 'investment', 'other'].includes(cat.id)
                      : !['salary', 'freelance', 'investment'].includes(cat.id)
                    )
                    .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What was this for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                Add Transaction
              </button>
            </form>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📝</span>
                <p className="text-gray-500 text-lg">No transactions yet</p>
                <p className="text-gray-400">Add your first transaction to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 20).map(transaction => {
                  const category = CATEGORIES.find(cat => cat.id === transaction.category);
                  return (
                    <div key={transaction.id} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: category?.color || '#E0E0E0' }}
                        >
                          {category?.icon || '📦'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {category?.name || transaction.category} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold text-lg ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Category Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map(category => {
                const total = categoryData[category.id] || 0;
                const percentage = currentExpenses > 0 ? (total / currentExpenses * 100) : 0;
                
                return (
                  <div 
                    key={category.id}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{category.name}</p>
                        <p className="text-sm text-gray-500">${total.toFixed(2)}</p>
                      </div>
                    </div>
                    {total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: category.color,
                            width: `${Math.min(percentage, 100)}%`
                          }}
                        />
                      </div>
                    )}
                    {total > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of expenses</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
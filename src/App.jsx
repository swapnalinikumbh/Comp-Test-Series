import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Play,
  Clock,
  FileText,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import dataService from "./services/dataService.js";
import Login from "./Login";
import Register from "./Register";

const TestSeriesApp = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Data state
  const [testSeries, setTestSeries] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await dataService.initializeData();
        setTestSeries(dataService.getTestSeries());
        setUserProgress(dataService.getUserProgress());
        // Load user from localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh data (useful after completing a test)
  const refreshData = () => {
    setTestSeries(dataService.getTestSeries());
    setUserProgress(dataService.getUserProgress());
  };

  // Timer effect
  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && testStarted) {
      handleSubmitTest();
    }
  }, [timeRemaining, testStarted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const startTest = (test) => {
    const testQuestions = dataService.getQuestions(test.id);
    if (testQuestions.length === 0) {
      alert("No questions available for this test!");
      return;
    }

    setSelectedTest(test);
    setQuestions(testQuestions);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(test.duration * 60); // Convert minutes to seconds
    setTestStartTime(Date.now());
    setTestStarted(true);
    setCurrentView("test");
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmitTest = async () => {
    if (!selectedTest) return;

    const timeTaken = Math.round((Date.now() - testStartTime) / 1000); // in seconds
    const result = dataService.calculateScore(selectedTest.id, answers);

    const testResult = {
      testId: selectedTest.id,
      answers: answers,
      timeTaken: Math.round(timeTaken / 60), // Convert to minutes
      ...result,
    };

    // Save the test result
    await dataService.saveTestResult(testResult);

    // Refresh dashboard data
    refreshData();

    // Reset test state
    setTestStarted(false);
    setSelectedTest(null);
    setQuestions([]);
    setAnswers({});
    setCurrentView("dashboard");

    // Show results
    alert(
      `Test completed!\nScore: ${result.score}%\nCorrect Answers: ${
        result.correctAnswers
      }/${result.totalQuestions}\nTime Taken: ${Math.round(
        timeTaken / 60
      )} minutes`
    );
  };

  const goToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  // Admin Dashboard
  const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [testSeries, setTestSeries] = useState([]);

    // Fetch data for admin dashboard
    useEffect(() => {
      fetch('http://localhost:3001/users')
        .then(res => res.json())
        .then(setUsers);
      fetch('http://localhost:3001/testResults')
        .then(res => res.json())
        .then(setTestResults);
      fetch('http://localhost:3001/testSeries')
        .then(res => res.json())
        .then(setTestSeries);
    }, []);

    const handleDeleteUser = async (userId) => {
      // Delete user from json-server
      await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE',
      });
      // Optionally, delete all testResults for this user
      const res = await fetch(`http://localhost:3001/testResults?userId=${userId}`);
      const results = await res.json();
      for (const result of results) {
        await fetch(`http://localhost:3001/testResults/${result.id}`, {
          method: 'DELETE',
        });
      }
      // Refresh users and results
      fetch('http://localhost:3001/users')
        .then(res => res.json())
        .then(setUsers);
      fetch('http://localhost:3001/testResults')
        .then(res => res.json())
        .then(setTestResults);
    };

    // Map userId to email
    const userMap = {};
    users.forEach((u) => {
      userMap[u.id] = u.email;
    });

    // Count completed tests per user
    const userStats = users
      .filter(u => u.role === "user")
      .map(u => {
        const userResults = testResults.filter(r => String(r.userId) === String(u.id));
        const completedTestIds = [...new Set(userResults.map(r => r.testId))];
        return {
          email: u.email,
          completed: completedTestIds.length,
          remaining: testSeries.length - completedTestIds.length,
          results: userResults,
        };
      });

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={() => {
              localStorage.removeItem('currentUser');
              setUser(null);
            }}
          >
            Logout
          </button>
        </div>
        <table className="w-full mb-8 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User</th>
              <th className="p-2 border">Completed Tests</th>
              <th className="p-2 border">Remaining</th>
              <th className="p-2 border">Results</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((stat, idx) => (
              <tr key={idx}>
                <td className="p-2 border">{stat.email}</td>
                <td className="p-2 border">{stat.completed}</td>
                <td className="p-2 border">{stat.remaining}</td>
                <td className="p-2 border">
                  {stat.results.length > 0 ? (
                    <ul>
                      {stat.results.map((r, i) => (
                        <li key={i}>
                          {testSeries.find(t => String(t.id) === String(r.testId))?.title || r.testId}: {r.score}%
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No results</span>
                  )}
                </td>
                <td className="p-2 border">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this user?")) {
                        // Call delete handler
                        await handleDeleteUser(stat.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Dashboard component
  const Dashboard = () => {
    if (loading) {
      return (
        <div className="p-6 flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading dashboard...</div>
        </div>
      );
    }

    const chartData = userProgress.recentScores || [];
    const pieData = [
      {
        name: "Completed",
        value: userProgress.completedTests || 0,
        color: "#10b981",
      },
      {
        name: "Remaining",
        value:
          (userProgress.totalTests || 0) - (userProgress.completedTests || 0),
        color: "#e5e7eb",
      },
    ];

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-gray-800 ">Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView("allTests")}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              All Tests
            </button>
            <button
              onClick={async () => {
                if (
                  confirm("This will reset all your test data. Are you sure?")
                ) {
                  await dataService.resetData();
                  refreshData();
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Data
            </button>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={() => {
                localStorage.removeItem('currentUser');
                setUser(null);
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress.totalTests || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress.completedTests || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress.averageScore || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(userProgress.totalTests || 0) -
                    (userProgress.completedTests || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Test Scores
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No test data available. Take a test to see your scores!
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Test Progress
            </h3>
            {(userProgress.totalTests || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No progress data available
              </div>
            )}
          </div>
        </div>

        {/* Areas of Improvement */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Performance Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">
                Strong Subjects
              </h4>
              <div className="space-y-2">
                {(userProgress.strongSubjects || []).length > 0 ? (
                  userProgress.strongSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{subject}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    Take more tests to see your strong subjects
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">
                Needs Improvement
              </h4>
              <div className="space-y-2">
                {(userProgress.weakSubjects || []).length > 0 ? (
                  userProgress.weakSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{subject}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    Take more tests to identify areas for improvement
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // All Tests component
  const AllTests = () => {
    if (loading) {
      return (
        <div className="p-6 flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading tests...</div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">All Test Series</h1>
          <button
            onClick={() => setCurrentView("dashboard")}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {testSeries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No tests available. Please check your db.json file.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSeries.map((test) => {
              // Check if the user has completed this test
              const userId = user?.id;
              const hasAttempted = dataService
                .getTestResults()
                .some(
                  (result) =>
                    String(result.userId) === String(userId) &&
                    String(result.testId) === String(test.id)
                );

              return (
                <div
                  key={test.id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Subject: {test.subject}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{test.duration} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <FileText className="w-4 h-4 mr-1" />
                      <span>{test.totalQuestions} questions</span>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        test.difficulty === "Easy"
                          ? "bg-green-100 text-green-800"
                          : test.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {test.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => startTest(test)}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
                      hasAttempted
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {hasAttempted ? "Reattempt" : "Start Test"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Test component
  const TestPage = () => {
    if (!selectedTest || !questions || questions.length === 0) {
      return (
        <div className="p-6 flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading test questions...</div>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedTest.title}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Section */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Question {currentQuestion + 1}: {currentQ.question}
                  </h2>

                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQ.id}`}
                          value={index}
                          checked={answers[currentQ.id] === index}
                          onChange={() =>
                            handleAnswerSelect(currentQ.id, index)
                          }
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={() =>
                      setCurrentQuestion(Math.max(0, currentQuestion - 1))
                    }
                    disabled={currentQuestion === 0}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentQuestion(
                        Math.min(questions.length - 1, currentQuestion + 1)
                      )
                    }
                    disabled={currentQuestion === questions.length - 1}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow-sm sticky top-4">
                {/* Timer */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Time Remaining
                  </h3>
                  <div
                    className={`text-2xl font-bold ${
                      timeRemaining < 300 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                {/* Question Navigation */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Questions
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-8 h-8 text-sm rounded ${
                          index === currentQuestion
                            ? "bg-blue-500 text-white"
                            : answers[questions[index].id] !== undefined
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                      <span>Answered ({Object.keys(answers).length})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                      <span>
                        Not Answered (
                        {questions.length - Object.keys(answers).length})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitTest}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-xl">Loading application...</div>
        </div>
      );
    }
    return showRegister ? (
      <Register onRegister={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={setUser} onShowRegister={() => setShowRegister(true)} />
    );
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-xl">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === "dashboard" && <Dashboard />}
      {currentView === "allTests" && <AllTests />}
      {currentView === "test" && <TestPage />}
    </div>
  );
};

export default TestSeriesApp;

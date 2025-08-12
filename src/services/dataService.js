// Data service to manage test data and results
class DataService {
  constructor() {
    this.storageKey = 'testSeriesData';
    this.initializeData();
  }

  // Initialize data from db.json or localStorage
  async initializeData() {
    try {
      // Try to load from localStorage first
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        this.data = JSON.parse(savedData);
        return;
      }

      // If no saved data, load from db.json
      const response = await fetch('/db.json');
      this.data = await response.json();
      
      // Initialize empty arrays if they don't exist
      if (!this.data.testResults) {
        this.data.testResults = [];
      }
      if (!this.data.userProgress) {
        this.data.userProgress = {
          totalTests: this.data.testSeries.length,
          completedTests: 0,
          averageScore: 0,
          strongSubjects: [],
          weakSubjects: [],
          recentScores: []
        };
      }

      this.saveData();
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to empty structure
      this.data = {
        testSeries: [],
        questions: {},
        testResults: [],
        userProgress: {
          totalTests: 0,
          completedTests: 0,
          averageScore: 0,
          strongSubjects: [],
          weakSubjects: [],
          recentScores: []
        }
      };
    }
  }

  // Save data to localStorage (simulating db.json update)
  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Get all test series
  getTestSeries() {
    return this.data.testSeries || [];
  }

  // Get questions for a specific test
  getQuestions(testId) {
    return this.data.questions[testId] || [];
  }

  // Get user progress
  getUserProgress() {
    return this.data.userProgress || {};
  }

  // Get test results
  getTestResults() {
    return this.data.testResults || [];
  }

  // Save test result and update progress
  async saveTestResult(testResult) {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser?.id;

    const newResult = {
      id: Date.now().toString(),
      testId: testResult.testId,
      userId: userId,
      score: testResult.score,
      totalQuestions: testResult.totalQuestions,
      correctAnswers: testResult.correctAnswers,
      timeTaken: testResult.timeTaken,
      completedAt: new Date().toISOString(),
      answers: testResult.answers
    };

    // POST to json-server
    const response = await fetch('http://localhost:3001/testResults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResult)
    });

    if (response.ok) {
      // Optionally, update local cache if needed
      this.data.testResults.push(newResult);
      this.updateUserProgress();
      this.saveData();
      return newResult;
    } else {
      throw new Error('Failed to save test result');
    }
  }

  // Update user progress based on test results
  updateUserProgress() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser?.id;
    const results = this.data.testResults.filter(r => String(r.userId) === String(userId));
    const testSeries = this.data.testSeries;

    if (results.length === 0) {
      return;
    }

    // Calculate completed tests (unique test IDs)
    const completedTestIds = [...new Set(results.map(result => result.testId))];
    const completedTests = completedTestIds.length;
    
    // Calculate average score
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = Math.round(totalScore / completedTests);

    // Get recent scores (last 5 tests)
    const recentScores = results
      .slice(-5)
      .map(result => {
        const test = testSeries.find(t => t.id === result.testId);
        return {
          test: test ? test.title : `Test-${result.testId}`,
          score: result.score
        };
      });

    // Calculate subject performance
    const subjectScores = {};
    results.forEach(result => {
      const test = testSeries.find(t => t.id === result.testId);
      if (test) {
        if (!subjectScores[test.subject]) {
          subjectScores[test.subject] = [];
        }
        subjectScores[test.subject].push(result.score);
      }
    });

    // Calculate average per subject
    const subjectAverages = {};
    Object.keys(subjectScores).forEach(subject => {
      const scores = subjectScores[subject];
      subjectAverages[subject] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Determine strong and weak subjects
    const subjects = Object.keys(subjectAverages);
    const sortedSubjects = subjects.sort((a, b) => subjectAverages[b] - subjectAverages[a]);
    
    const strongSubjects = sortedSubjects.filter(subject => subjectAverages[subject] >= averageScore);
    const weakSubjects = sortedSubjects.filter(subject => subjectAverages[subject] < averageScore);

    // Update progress
    this.data.userProgress = {
      totalTests: testSeries.length,
      completedTests,
      averageScore,
      strongSubjects: strongSubjects.slice(0, 3), // Top 3 strong subjects
      weakSubjects: weakSubjects.slice(-3), // Bottom 3 weak subjects
      recentScores
    };
  }

  // Get test by ID
  getTestById(testId) {
    return this.data.testSeries.find(test => test.id === testId);
  }

  // Calculate score for a test
  calculateScore(testId, answers) {
    const questions = this.getQuestions(testId);
    if (!questions || questions.length === 0) {
      return { score: 0, correctAnswers: 0, totalQuestions: 0 };
    }

    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    
    return {
      score,
      correctAnswers,
      totalQuestions: questions.length
    };
  }

  // Reset all data (for testing purposes)
  async resetData() {
    localStorage.removeItem(this.storageKey);
    await this.initializeData();
  }

  // Export data (to save as JSON file)
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
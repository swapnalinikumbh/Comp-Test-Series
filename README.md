# Test Series Application

A comprehensive test series application built with React, Vite, and Tailwind CSS. This application allows users to take tests, view their progress through interactive dashboards, and track their performance across different subjects.

## Features

### 🏠 Dashboard
- **Interactive Charts**: Bar charts for recent test scores and pie charts for progress tracking
- **Statistics Cards**: Display total tests, completed tests, average scores, and tests in progress
- **Performance Analytics**: Shows strong subjects and areas needing improvement
- **Responsive Design**: Works seamlessly across all device sizes

### 📚 Test Management
- **Test Library**: Browse all available tests in an organized card format
- **Test Information**: Each test card shows title, subject, duration, difficulty level, and question count
- **Easy Navigation**: Quick access between dashboard and test sections

### 🎯 Test Taking Experience
- **Clean Interface**: Distraction-free test environment
- **Question Navigation**: Previous/Next buttons and direct question jumping
- **Live Timer**: Real-time countdown with color-coded warnings
- **Progress Tracking**: Visual indicators for answered and unanswered questions
- **Flexible Navigation**: Jump to any question using numbered buttons

### 📊 Progress Tracking
- **Real-time Analytics**: Track performance across different subjects
- **Score History**: View recent test performance trends
- **Subject Analysis**: Identify strengths and weaknesses

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone/Download the project**
   ```bash
   # Create a new directory for your project
   mkdir test-series-app
   cd test-series-app
   ```

2. **Copy all the provided files into your project directory with the following structure:**
   ```
   test-series-app/
   ├── public/
   │   └── db.json
   ├── src/
   │   ├── App.jsx
   │   ├── main.jsx
   │   └── index.css
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── tailwind.config.js
   ├── postcss.config.js
   ├── .eslintrc.cjs
   ├── .gitignore
   └── README.md
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev:all
   ```

5. **Open your browser and navigate to `http://localhost:3000`**

### Available Scripts

- `npm run dev:all` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── App.jsx          # Main application component with all views
├── main.jsx         # Application entry point
└── index.css        # Global styles and Tailwind imports

public/
└── db.json          # Mock database with test data
```

## Data Structure

The application uses a JSON-based data structure stored in `public/db.json`:

### Test Series
```json
{
  "id": 1,
  "title": "Mathematics Basic",
  "duration": 60,
  "totalQuestions": 10,
  "difficulty": "Easy",
  "subject": "Mathematics"
}
```

### Questions
```json
{
  "id": 1,
  "question": "What is 15 + 25?",
  "options": ["35", "40", "45", "50"],
  "correctAnswer": 1
}
```

### User Progress
```json
{
  "totalTests": 12,
  "completedTests": 8,
  "averageScore": 78,
  "strongSubjects": ["Mathematics", "Physics"],
  "weakSubjects": ["English", "Chemistry"]
}
```

## Customization

### Adding New Tests
1. Add test series data to the `testSeries` array in `db.json`
2. Add corresponding questions to the `questions` object using the test ID as key

### Styling
- Modify `tailwind.config.js` to customize the design system
- Update `src/index.css` for global styles
- Component styles use Tailwind utility classes

### API Integration
To connect with a real backend:
1. Replace the `mockData` in `App.jsx` with API calls
2. Use fetch/axios to get data from your backend
3. Update the data handling logic accordingly

## Features in Detail

### Timer Functionality
- Automatic countdown during tests
- Color-coded warnings (red when < 5 minutes remaining)
- Auto-submit when time expires

### Question Navigation
- Previous/Next buttons for sequential navigation
- Numbered grid for direct question access
- Visual indicators for answered/unanswered questions

### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Touch-friendly interface elements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or need help with setup, please create an issue in the repository or contact the development team.

---

**Happy Testing! 🚀**# Comp-Test-Series

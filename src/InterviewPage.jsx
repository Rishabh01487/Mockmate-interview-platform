import React, { useState } from 'react';

const InterviewPage = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const technicalQuestions = [
    "What are React hooks and why are they useful?",
    "Explain the difference between useState and useEffect.",
    "What is the purpose of useContext hook?",
    "How does React handle component state updates?",
    "What is the virtual DOM and how does it improve performance?"
  ];

  const behavioralQuestions = [
    "Tell me about a time you faced a challenging project. How did you handle it?",
    "Describe a situation where you had to work with a difficult team member.",
    "How do you prioritize multiple tasks with the same deadline?",
    "Give an example of when you had to learn something new quickly.",
    "Tell me about a time you failed and what you learned from it."
  ];

  const questions = interviewType === 'technical' ? technicalQuestions : behavioralQuestions;

  const startInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setFeedback('');
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please enter an answer');
      return;
    }

    setLoading(true);
    
    // Simulate AI feedback (in production, call your AI API)
    const mockFeedback = generateMockFeedback(currentAnswer, currentQuestion);
    
    setTimeout(() => {
      setAnswers([...answers, { question: questions[currentQuestion], answer: currentAnswer, feedback: mockFeedback }]);
      setFeedback(mockFeedback);
      setCurrentAnswer('');
      setLoading(false);
    }, 1000);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback('');
    } else {
      endInterview();
    }
  };

  const endInterview = () => {
    setInterviewStarted(false);
  };

  const generateMockFeedback = (answer, questionIndex) => {
    const feedbackOptions = [
      'Good answer! You covered the key points. Consider adding more specific examples next time.',
      'Great response! You demonstrated good understanding. How would you handle edge cases?',
      'Solid answer with good depth. You could strengthen this by providing real-world applications.',
      'Excellent explanation! You clearly understand the concept. Well structured response.',
      'Good start! You touched on important aspects. Try to be more concise while maintaining clarity.'
    ];
    return feedbackOptions[questionIndex % feedbackOptions.length];
  };

  if (!interviewStarted) {
    return (
      <div className="interview-page">
        <div className="interview-header">
          <h1>🎯 AI-Powered Mock Interview</h1>
          <p>Practice your interview skills with instant AI feedback</p>
        </div>

        {answers.length > 0 ? (
          <div className="interview-results">
            <h2>Interview Summary</h2>
            <div className="results-list">
              {answers.map((item, index) => (
                <div key={index} className="result-item">
                  <h3>Question {index + 1}</h3>
                  <p className="question-text"><strong>Q:</strong> {item.question}</p>
                  <p className="answer-text"><strong>Your Answer:</strong> {item.answer}</p>
                  <p className="feedback-text"><strong>Feedback:</strong> {item.feedback}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setAnswers([])}>
              Clear Results
            </button>
          </div>
        ) : null}

        <div className="interview-selector">
          <h2>Select Interview Type</h2>
          <div className="interview-options">
            <div
              className={`option ${interviewType === 'technical' ? 'active' : ''}`}
              onClick={() => setInterviewType('technical')}
            >
              <span className="option-icon">💻</span>
              <h3>Technical Interview</h3>
              <p>React, JavaScript, Web Development</p>
            </div>
            <div
              className={`option ${interviewType === 'behavioral' ? 'active' : ''}`}
              onClick={() => setInterviewType('behavioral')}
            >
              <span className="option-icon">🤝</span>
              <h3>Behavioral Interview</h3>
              <p>Problem-solving, teamwork, experience</p>
            </div>
          </div>
        </div>

        <button className="btn-start" onClick={startInterview}>
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <div className="interview-session">
      <div className="interview-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p>Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="interview-container">
        <div className="question-box">
          <h2>{questions[currentQuestion]}</h2>
        </div>

        <textarea
          className="answer-input"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer here..."
          disabled={loading}
        />

        {feedback && (
          <div className="feedback-box">
            <h3>💡 Feedback</h3>
            <p>{feedback}</p>
          </div>
        )}

        <div className="button-group">
          <button
            className="btn-submit"
            onClick={submitAnswer}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Submit Answer'}
          </button>
          {feedback && (
            <button className="btn-next" onClick={nextQuestion}>
              {currentQuestion === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
            </button>
          )}
          <button className="btn-exit" onClick={endInterview}>
            Exit Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;

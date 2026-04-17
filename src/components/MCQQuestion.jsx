import React, { useState } from 'react';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/**
 * MCQQuestion
 * Props:
 *   question: { text, options: [{text, isCorrect}], explanation, correctOptionIndex, difficulty }
 *   onSubmit(selectedIndex, isCorrect, score) — called when user submits
 *   readOnly — show result without interaction (for review mode)
 *   submittedIndex — if readOnly, which index was selected
 */
const MCQQuestion = ({ question, onSubmit, readOnly = false, submittedIndex = null }) => {
  const [selected, setSelected] = useState(submittedIndex !== null ? submittedIndex : null);
  const [submitted, setSubmitted] = useState(readOnly);

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = question.options[selected]?.isCorrect === true;
    const score = isCorrect ? 100 : 0;
    setSubmitted(true);
    onSubmit && onSubmit(selected, isCorrect, score);
  };

  const getOptionState = (idx) => {
    if (!submitted) return 'default';
    const isThisCorrect = question.options[idx]?.isCorrect;
    const isSelected = selected === idx;
    if (isThisCorrect) return 'correct';
    if (isSelected && !isThisCorrect) return 'wrong';
    return 'neutral';
  };

  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="mcq-wrapper">
      {/* Options */}
      <div className="mcq-options">
        {question.options.map((opt, idx) => {
          const state = getOptionState(idx);
          return (
            <button
              key={idx}
              id={`mcq-option-${idx}`}
              className={`mcq-option mcq-option--${state}${selected === idx && !submitted ? ' mcq-option--selected' : ''}`}
              onClick={() => !submitted && setSelected(idx)}
              disabled={submitted}
              aria-pressed={selected === idx}
              aria-label={`Option ${OPTION_LABELS[idx]}: ${opt.text}`}
            >
              <span className="mcq-option-label">{OPTION_LABELS[idx]}</span>
              <span className="mcq-option-text">{opt.text}</span>
              {submitted && state === 'correct' && (
                <span className="mcq-option-icon mcq-icon--correct"><CheckIcon /></span>
              )}
              {submitted && state === 'wrong' && (
                <span className="mcq-option-icon mcq-icon--wrong"><XIcon /></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          id="mcq-submit-btn"
          className="mcq-submit ip-btn-primary"
          onClick={handleSubmit}
          disabled={selected === null}
        >
          <CheckIcon /> Confirm Answer
        </button>
      )}

      {/* Result + Explanation */}
      {submitted && (
        <div className={`mcq-result ${question.options[selected]?.isCorrect ? 'mcq-result--correct' : 'mcq-result--wrong'}`}>
          <div className="mcq-result-header">
            {question.options[selected]?.isCorrect ? (
              <><span className="mcq-result-icon mcq-icon--correct"><CheckIcon /></span> Correct!</>
            ) : (
              <><span className="mcq-result-icon mcq-icon--wrong"><XIcon /></span> Incorrect</>
            )}
          </div>
          {question.explanation && (
            <p className="mcq-explanation">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;

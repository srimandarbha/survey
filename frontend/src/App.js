import React, { useState, useMemo, useEffect } from 'react';

const QuestionnairePanels = () => {
  const [activePanel, setActivePanel] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const panels = [
    {
      title: 'Availability & SLOs',
      questions: [
        {
          text: 'What is your target availability percentage?',
          options: ['99.9%', '99.95%', '99.99%', '99.999%', 'Other']
        },
        {
          text: 'How frequently do you review SLO compliance?',
          options: ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Never']
        },
        {
          text: 'Do you have error budgets defined?',
          options: ['Yes - Implemented', 'Yes - Planned', 'No', 'Not Sure', 'N/A']
        }
      ]
    },
    {
      title: 'Monitoring & Observability',
      questions: [
        {
          text: 'What monitoring systems do you currently use?',
          options: ['Prometheus', 'Grafana', 'DataDog', 'Multiple Tools', 'None']
        },
        {
          text: 'What is your logging retention period?',
          options: ['30 days', '90 days', '6 months', '1 year+', 'Varies']
        },
        {
          text: 'Do you use distributed tracing?',
          options: ['Yes - Full Coverage', 'Yes - Partial', 'Planning to', 'No', 'N/A']
        }
      ]
    },
    {
      title: 'Incident Response',
      questions: [
        {
          text: 'How is your on-call rotation structured?',
          options: ['24/7 Coverage', 'Business Hours', 'Follow the Sun', 'Ad-hoc', 'None']
        },
        {
          text: 'Do you conduct post-mortems?',
          options: ['Always', 'For Major Issues', 'Sometimes', 'Rarely', 'Never']
        },
        {
          text: 'What is your incident communication channel?',
          options: ['Dedicated Platform', 'Slack/Teams', 'Email', 'Phone', 'Mixed']
        }
      ]
    },
    {
      title: 'Change Management',
      questions: [
        {
          text: 'What is your deployment frequency?',
          options: ['Multiple Daily', 'Daily', 'Weekly', 'Monthly', 'Varies']
        },
        {
          text: 'Do you use feature flags?',
          options: ['Extensively', 'Sometimes', 'Rarely', 'Never', 'Planning to']
        },
        {
          text: 'How do you handle rollbacks?',
          options: ['Automated', 'Semi-automated', 'Manual', 'Case-by-case', 'No process']
        }
      ]
    },
    {
      title: 'Capacity Planning',
      questions: [
        {
          text: 'How do you forecast capacity needs?',
          options: ['ML/AI Models', 'Trending', 'Manual Analysis', 'React to Needs', 'No Process']
        },
        {
          text: 'What is your scaling strategy?',
          options: ['Auto-scaling', 'Manual Scaling', 'Hybrid', 'Fixed Capacity', 'None']
        },
        {
          text: 'How far ahead do you plan capacity?',
          options: ['1-3 Months', '3-6 Months', '6-12 Months', '1+ Year', 'No Planning']
        }
      ]
    },
    {
      title: 'Configuration Management',
      questions: [
        {
          text: 'How is your infrastructure defined?',
          options: ['All as Code', 'Mostly as Code', 'Hybrid', 'Manual', 'No Standard']
        },
        {
          text: 'What CM tools do you use?',
          options: ['Terraform', 'Ansible', 'Puppet/Chef', 'Multiple', 'None']
        },
        {
          text: 'How do you manage secrets?',
          options: ['Vault Service', 'Cloud Native', 'Manual', 'Mixed', 'No Standard']
        }
      ]
    },
    {
      title: 'Security & Compliance',
      questions: [
        {
          text: 'How often do you conduct security audits?',
          options: ['Monthly', 'Quarterly', 'Bi-annually', 'Yearly', 'Ad-hoc']
        },
        {
          text: 'What compliance frameworks do you follow?',
          options: ['SOC2', 'ISO27001', 'Multiple', 'Custom', 'None']
        },
        {
          text: 'How do you manage vulnerabilities?',
          options: ['Automated Scanning', 'Regular Reviews', 'Ad-hoc', 'External Audit', 'No Process']
        }
      ]
    }
  ];

  const handleAnswerChange = (panelIndex, questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [`panel_${panelIndex}_question_${questionIndex}`]: value
    }));
  };

  // Check if all questions in the current panel are answered
  const isPanelComplete = (panelIndex) => {
    const panelQuestions = panels[panelIndex].questions;
    return panelQuestions.every(
      (_, questionIndex) => 
        answers[`panel_${panelIndex}_question_${questionIndex}`] !== undefined
    );
  };

  // Check the number of completed questions for each panel
  const getPanelCompletionStatus = (panelIndex) => {
    const panelQuestions = panels[panelIndex].questions;
    const completedQuestions = panelQuestions.filter(
      (_, questionIndex) => 
        answers[`panel_${panelIndex}_question_${questionIndex}`] !== undefined
    ).length;

    return {
      completedQuestions,
      totalQuestions: panelQuestions.length,
      isComplete: completedQuestions === panelQuestions.length
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answers,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const result = await response.json();
      alert('Assessment submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionsCompletion = useMemo(() => {
    const totalQuestions = panels.reduce((total, panel) => total + panel.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    return { 
      totalQuestions, 
      answeredQuestions,
      percentComplete: Math.round((answeredQuestions / totalQuestions) * 100)
    };
  }, [answers, panels]);

  const isQuestionsComplete = questionsCompletion.answeredQuestions === questionsCompletion.totalQuestions;

  return (
    <div className="flex flex-col min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        SRE Maturity Assessment
      </h1>
      
      <div className="mb-4 bg-gray-100 p-3 rounded">
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{width: `${questionsCompletion.percentComplete}%`}}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {questionsCompletion.percentComplete}% ({questionsCompletion.answeredQuestions} / {questionsCompletion.totalQuestions} Questions)
          </span>
        </div>
      </div>

      <div className="flex mb-4 overflow-x-auto pb-2">
        {panels.map((panel, index) => {
          const panelStatus = getPanelCompletionStatus(index);
          return (
            <button
              key={index}
              onClick={() => setActivePanel(index)}
              className={`
                px-4 py-2 mr-2 rounded whitespace-nowrap relative
                ${activePanel === index 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                ${panelStatus.isComplete ? 'border-2 border-green-500' : ''}
              `}
            >
              {panel.title}
              {panelStatus.completedQuestions > 0 && !panelStatus.isComplete && (
                <span 
                  className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 
                    bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {panelStatus.completedQuestions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-grow bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-700">
          {panels[activePanel].title}
        </h2>
        <div className="space-y-6">
          {panels[activePanel].questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-lg mb-3 text-gray-700">{question.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="inline-flex items-center p-2 hover:bg-gray-100 rounded">
                    <input
                      type="radio"
                      name={`panel_${activePanel}_question_${qIndex}`}
                      value={option}
                      checked={answers[`panel_${activePanel}_question_${qIndex}`] === option}
                      onChange={(e) => handleAnswerChange(activePanel, qIndex, e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {submitError}
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {getPanelCompletionStatus(activePanel).completedQuestions} / {panels[activePanel].questions.length} Questions Answered
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!isQuestionsComplete || isSubmitting}
          className={`px-6 py-2 rounded 
            ${isQuestionsComplete 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            disabled:opacity-50`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QuestionnairePanels;
import React from 'react';

function ExecutionVisualizer({ steps, currentStep, code }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="execution-visualizer">
        <h3>Execution Flow</h3>
        <div className="step-info">
          <p className="step-description">Click "Run Code" to start visualization</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const codeLines = code.split('\n');

  return (
    <div className="execution-visualizer">
      <h3>Execution Flow</h3>
      
      <div className="step-info">
        <div className="step-number">
          Step {currentStep + 1} of {steps.length}
        </div>
        <div className="step-description">
          {currentStepData?.description || 'Ready to execute'}
        </div>
        {currentStepData?.line > 0 && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
            <code style={{ color: '#7ee787', fontSize: '0.85rem' }}>
              {codeLines[currentStepData.line - 1]?.trim()}
            </code>
          </div>
        )}
      </div>

      <div className="step-progress">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`step-dot ${
              index < currentStep ? 'completed' : index === currentStep ? 'current' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default ExecutionVisualizer;

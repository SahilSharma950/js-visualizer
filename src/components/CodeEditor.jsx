import React from 'react';

function CodeEditor({ code, setCode, currentLine }) {
  const lines = code.split('\n');

  const handleChange = (e) => {
    setCode(e.target.value);
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="dot red"></div>
        <div className="dot yellow"></div>
        <div className="dot green"></div>
        <span>main.js</span>
      </div>
      <div className="editor-container">
        <div className="line-numbers">
          {lines.map((_, index) => (
            <div 
              key={index} 
              className={`line-number ${currentLine === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <textarea
          className="code-input"
          value={code}
          onChange={handleChange}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default CodeEditor;

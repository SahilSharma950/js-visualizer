import React from 'react'

function ConsoleOutput({ output }) {
  return (
    <div className="console-output">
      <h3>Console</h3>
      <div className="console-content">
        {output.length === 0 ? (
          <div className="empty-console">Console is empty</div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="console-line">
              <span className="console-prompt">&gt;</span>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ConsoleOutput

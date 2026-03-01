import React from 'react'

function CallStack({ stack }) {
  return (
    <div className="runtime-component call-stack">
      <h4 className="component-title">
        <span className="icon">STACK</span>
        Call Stack
      </h4>
      <div className="stack-container">
        {stack.length === 0 ? (
          <div className="empty-state">Empty</div>
        ) : (
          <div className="stack-items">
            {stack.map((frame, index) => (
              <div
                key={index}
                className={`stack-frame ${index === stack.length - 1 ? 'active' : ''}`}
              >
                <div className="frame-name">{frame.name || 'anonymous'}</div>
                {frame.params && (
                  <div className="frame-params">
                    ({frame.params.join(', ')})
                  </div>
                )}
                {frame.line && (
                  <div className="frame-line">Line {frame.line}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="component-info">
        LIFO - Last In, First Out
      </div>
    </div>
  )
}

export default CallStack

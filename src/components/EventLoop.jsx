import React from 'react'

function EventLoop({ status }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return '[CHECK]'
      case 'executing':
        return '[RUN]'
      case 'waiting':
        return '[WAIT]'
      case 'idle':
        return '[IDLE]'
      default:
        return '[LOOP]'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking queues...'
      case 'executing':
        return 'Executing task'
      case 'waiting':
        return 'Waiting for tasks'
      case 'idle':
        return 'Idle'
      default:
        return 'Running'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return '#f0883e'
      case 'executing':
        return '#238636'
      case 'waiting':
        return '#58a6ff'
      case 'idle':
        return '#6e7681'
      default:
        return '#58a6ff'
    }
  }

  return (
    <div className="runtime-component event-loop">
      <h4 className="component-title">
        <span className="icon">LOOP</span>
        Event Loop
      </h4>

      <div className="event-loop-container">
        <div
          className="event-loop-status"
          style={{ borderColor: getStatusColor() }}
        >
          <div
            className="status-icon"
            style={{
              color: getStatusColor(),
              animation: status === 'executing' ? 'spin 1s linear infinite' : 'none',
            }}
          >
            {getStatusIcon()}
          </div>
          <div className="status-text" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </div>
        </div>

        <div className="event-loop-flow">
          <div className="flow-step">
            <div className={`flow-box ${status === 'checking' ? 'active' : ''}`}>
              Check Call Stack
            </div>
            <div className="flow-arrow">v</div>
          </div>

          <div className="flow-step">
            <div className={`flow-box ${status === 'checking' ? 'active' : ''}`}>
              Check Microtasks
            </div>
            <div className="flow-arrow">v</div>
          </div>

          <div className="flow-step">
            <div className={`flow-box ${status === 'checking' ? 'active' : ''}`}>
              Check Macrotasks
            </div>
            <div className="flow-arrow">v</div>
          </div>

          <div className="flow-step">
            <div className={`flow-box ${status === 'executing' ? 'active' : ''}`}>
              Push to Call Stack
            </div>
          </div>
        </div>
      </div>

      <div className="component-info">
        Orchestrates async operations
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default EventLoop

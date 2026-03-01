import React from 'react'

function TaskQueues({ macrotasks, microtasks }) {
  const getTaskIcon = (type) => {
    switch (type) {
      case 'setTimeout':
        return 'TIMER'
      case 'setInterval':
        return 'INTERVAL'
      case 'fetch':
        return 'FETCH'
      case 'DOM':
        return 'DOM'
      case 'event':
        return 'EVENT'
      case 'promise':
        return 'PROMISE'
      case 'mutation':
        return 'MUTATION'
      default:
        return 'TASK'
    }
  }

  return (
    <div className="runtime-component task-queues">
      <h4 className="component-title">
        <span className="icon">QUEUE</span>
        Task Queues
      </h4>

      <div className="queues-container">
        <div className="queue-section">
          <h5 className="queue-title">
            <span className="queue-icon">MACRO</span>
            Macrotasks
            <span className="queue-count">({macrotasks.length})</span>
          </h5>
          <div className="queue-items">
            {macrotasks.length === 0 ? (
              <div className="empty-state">Empty</div>
            ) : (
              macrotasks.map((task, index) => (
                <div key={index} className="queue-item macrotask">
                  <span className="task-icon">{getTaskIcon(task.type)}</span>
                  <div className="task-details">
                    <div className="task-type">{task.type}</div>
                    {task.callback && (
                      <div className="task-callback">{task.callback}</div>
                    )}
                  </div>
                  <span className="task-priority">Macro</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="queue-section">
          <h5 className="queue-title">
            <span className="queue-icon">MICRO</span>
            Microtasks
            <span className="queue-count">({microtasks.length})</span>
          </h5>
          <div className="queue-items">
            {microtasks.length === 0 ? (
              <div className="empty-state">Empty</div>
            ) : (
              microtasks.map((task, index) => (
                <div key={index} className="queue-item microtask">
                  <span className="task-icon">{getTaskIcon(task.type)}</span>
                  <div className="task-details">
                    <div className="task-type">{task.type}</div>
                    {task.callback && (
                      <div className="task-callback">{task.callback}</div>
                    )}
                  </div>
                  <span className="task-priority">Micro</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="component-info">
        Microtasks have higher priority
      </div>
    </div>
  )
}

export default TaskQueues

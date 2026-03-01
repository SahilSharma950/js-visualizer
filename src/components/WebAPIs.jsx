import React from 'react'

function WebAPIs({ apis }) {
  const getIcon = (type) => {
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
      default:
        return 'API'
    }
  }

  const getDescription = (api) => {
    switch (api.type) {
      case 'setTimeout':
        return `Timer: ${api.delay}ms`
      case 'setInterval':
        return `Interval: ${api.delay}ms`
      case 'fetch':
        return `Request: ${api.url}`
      case 'DOM':
        return `Element: ${api.selector}`
      case 'event':
        return `Event: ${api.eventType}`
      default:
        return api.description || 'Web API'
    }
  }

  return (
    <div className="runtime-component web-apis">
      <h4 className="component-title">
        <span className="icon">WEB</span>
        Web APIs
      </h4>
      <div className="apis-container">
        {apis.length === 0 ? (
          <div className="empty-state">No active APIs</div>
        ) : (
          <div className="api-items">
            {apis.map((api, index) => (
              <div key={index} className="api-item">
                <span className="api-icon">{getIcon(api.type)}</span>
                <div className="api-details">
                  <div className="api-type">{api.type}</div>
                  <div className="api-desc">{getDescription(api)}</div>
                  {api.status && (
                    <div className={`api-status ${api.status}`}>
                      {api.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="component-info">
        Browser-provided APIs
      </div>
    </div>
  )
}

export default WebAPIs

import React from 'react';

function VariablePanel({ variables }) {
  const getValueType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'function') return 'function';
    return typeof value;
  };

  const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'function') return 'ƒ()';
    return String(value);
  };

  const entries = Object.entries(variables);

  return (
    <div className="variable-panel">
      <h3>Variables</h3>
      {entries.length === 0 ? (
        <div className="no-variables">No variables in scope</div>
      ) : (
        <div className="variables-grid">
          {entries.map(([name, value]) => (
            <div key={name} className="variable-card">
              <div className="variable-name">{name}</div>
              <div className="variable-value">{formatValue(value)}</div>
              <div className="variable-type">{getValueType(value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VariablePanel;

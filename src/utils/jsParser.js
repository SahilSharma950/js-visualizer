// JavaScript Parser and Executor for Visualization
// This module parses JavaScript code and creates step-by-step execution data.

export function parseAndExecute(code) {
  const steps = []
  const variables = {}
  const callStack = []
  const webAPIs = []
  const macrotaskQueue = []
  const microtaskQueue = []
  const functions = {}
  const pendingMicrotasks = []
  const pendingMacrotasks = []

  const lines = code.split('\n')

  const cloneFrames = () => callStack.map((frame) => ({ ...frame, params: [...(frame.params || [])] }))
  const cloneTasks = (tasks) => tasks.map((task) => ({ ...task }))

  const pushStep = (line, description, consoleOutput = null, eventLoopStatus = 'executing') => {
    steps.push({
      line,
      description,
      variables: { ...variables },
      consoleOutput,
      callStack: cloneFrames(),
      webAPIs: cloneTasks(webAPIs),
      macrotaskQueue: cloneTasks(macrotaskQueue),
      microtaskQueue: cloneTasks(microtaskQueue),
      eventLoopStatus,
    })
  }

  const safeHas = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

  const parseFunctionAt = (startIndex) => {
    const startLine = lines[startIndex].trim()
    const declaration = startLine.match(/^(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{\s*$/)
    if (!declaration) {
      return null
    }

    const [, asyncFlag, name, paramsText] = declaration
    const params = paramsText
      .split(',')
      .map((param) => param.trim())
      .filter(Boolean)

    const body = []
    let depth = 1
    let endIndex = startIndex

    for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
      const raw = lines[idx]
      const openCount = (raw.match(/\{/g) || []).length
      const closeCount = (raw.match(/\}/g) || []).length
      depth += openCount
      depth -= closeCount

      if (depth <= 0) {
        endIndex = idx
        break
      }

      body.push(raw.trim())
      endIndex = idx
    }

    return {
      name,
      params,
      body,
      endIndex,
      isAsync: Boolean(asyncFlag),
    }
  }

  const runFunctionBody = (fnName, argValues) => {
    const fn = functions[fnName]
    if (!fn) {
      return undefined
    }

    const localVars = { ...variables }
    fn.params.forEach((param, idx) => {
      localVars[param] = idx < argValues.length ? argValues[idx] : undefined
    })

    for (const bodyLineRaw of fn.body) {
      const bodyLine = bodyLineRaw.trim()
      if (!bodyLine || bodyLine.startsWith('//')) {
        continue
      }

      const reassignMatch = bodyLine.match(/^(\w+)\s*=\s*(.+?);?$/)
      if (reassignMatch) {
        const [, varName, expr] = reassignMatch
        const value = evaluateExpression(expr, localVars)
        localVars[varName] = value
        variables[varName] = value
        continue
      }

      const returnMatch = bodyLine.match(/^return\s+(.+?);?$/)
      if (returnMatch) {
        return evaluateExpression(returnMatch[1], localVars)
      }
    }

    return undefined
  }

  const resolveArgument = (arg) => {
    const cleanArg = arg.trim()
    if (!cleanArg) return undefined

    if ((cleanArg.startsWith('"') && cleanArg.endsWith('"')) || (cleanArg.startsWith("'") && cleanArg.endsWith("'"))) {
      return cleanArg.slice(1, -1)
    }
    if (safeHas(variables, cleanArg)) {
      return variables[cleanArg]
    }
    return evaluateExpression(cleanArg, variables)
  }

  const flushMicrotasks = () => {
    while (pendingMicrotasks.length > 0) {
      const task = pendingMicrotasks.shift()
      pushStep(task.line, `Microtask queued: ${task.callback}`, null, 'checking')

      callStack.push({ name: task.callback, params: [], line: task.line })
      microtaskQueue.shift()
      const consoleOutput = task.consoleText || null
      pushStep(task.line, `Microtask executes: ${task.callback}`, consoleOutput, 'executing')
      callStack.pop()
    }
  }

  const flushMacrotasks = () => {
    while (pendingMacrotasks.length > 0) {
      const task = pendingMacrotasks.shift()
      pushStep(task.line, `Macrotask ready: ${task.callback}`, null, 'checking')

      callStack.push({ name: task.callback, params: [], line: task.line })
      macrotaskQueue.shift()
      const consoleOutput = task.consoleText || null
      pushStep(task.line, `Macrotask executes: ${task.callback}`, consoleOutput, 'executing')
      callStack.pop()
    }
  }

  pushStep(0, 'Program starts execution', null, 'idle')
  callStack.push({ name: 'main', params: [], line: 1 })

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    const lineNumber = i + 1

    if (!line || line.startsWith('//')) {
      continue
    }

    try {
      const fnInfo = parseFunctionAt(i)
      if (fnInfo) {
        functions[fnInfo.name] = {
          params: fnInfo.params,
          body: fnInfo.body,
          isAsync: fnInfo.isAsync,
        }
        variables[fnInfo.name] = `${fnInfo.isAsync ? 'async ' : ''}function(${fnInfo.params.join(', ')})`
        pushStep(lineNumber, `Function "${fnInfo.name}" is declared`, null, 'executing')
        i = fnInfo.endIndex
        continue
      }

      const varDecl = line.match(/^(let|const|var)\s+(\w+)\s*=\s*(.+?);?$/)
      if (varDecl) {
        const [, , varName, expr] = varDecl

        const callExpr = expr.match(/^(\w+)\s*\((.*)\)$/)
        if (callExpr && safeHas(functions, callExpr[1])) {
          const [, fnName, argsText] = callExpr
          const argValues = argsText
            .split(',')
            .map((arg) => arg.trim())
            .filter(Boolean)
            .map(resolveArgument)

          callStack.push({ name: fnName, params: argValues, line: lineNumber })
          pushStep(lineNumber, `Function "${fnName}" called`, null, 'executing')

          const result = runFunctionBody(fnName, argValues)
          variables[varName] = result
          pushStep(lineNumber, `Variable "${varName}" assigned ${formatValue(result)}`, null, 'executing')

          callStack.pop()
        } else {
          const value = evaluateExpression(expr, variables)
          variables[varName] = value
          pushStep(lineNumber, `Variable "${varName}" is declared and assigned ${formatValue(value)}`)
        }
        continue
      }

      const reassignCall = line.match(/^(\w+)\s*=\s*(\w+)\s*\((.*)\);?$/)
      if (reassignCall && safeHas(functions, reassignCall[2])) {
        const [, targetVar, fnName, argsText] = reassignCall
        const argValues = argsText
          .split(',')
          .map((arg) => arg.trim())
          .filter(Boolean)
          .map(resolveArgument)

        callStack.push({ name: fnName, params: argValues, line: lineNumber })
        pushStep(lineNumber, `Function "${fnName}" called`, null, 'executing')

        const result = runFunctionBody(fnName, argValues)
        variables[targetVar] = result
        pushStep(lineNumber, `Variable "${targetVar}" is reassigned to ${formatValue(result)}`)

        callStack.pop()
        continue
      }

      const timeoutMatch = line.match(/^setTimeout\s*\(\s*(.+?)\s*,\s*(\d+)\s*\);?$/)
      if (timeoutMatch) {
        const [, callbackExpr, delayText] = timeoutMatch
        const delay = Number(delayText)
        const callbackName = extractCallbackName(callbackExpr)
        const consoleText = extractInlineConsoleText(callbackExpr, variables)

        webAPIs.push({ type: 'setTimeout', delay, callback: callbackName, status: 'pending' })
        pushStep(lineNumber, `setTimeout registered (${delay}ms)`, null, 'waiting')

        webAPIs[webAPIs.length - 1].status = 'completed'
        macrotaskQueue.push({ type: 'setTimeout', callback: callbackName })
        pendingMacrotasks.push({ line: lineNumber, callback: callbackName, consoleText })
        pushStep(lineNumber, 'Timer completed and moved to macrotask queue', null, 'checking')
        continue
      }

      const promiseThenMatch = line.match(/^Promise\.(resolve|reject)\((.*?)\)\.then\s*\(\s*(.+?)\s*\);?$/)
      if (promiseThenMatch) {
        const [, stateType, valueExpr, callbackExpr] = promiseThenMatch
        const settledValue = evaluateExpression(valueExpr, variables)
        const callbackName = extractCallbackName(callbackExpr)
        const consoleText = extractInlineConsoleText(callbackExpr, { ...variables, value: settledValue })

        microtaskQueue.push({ type: 'promise', callback: callbackName })
        pendingMicrotasks.push({ line: lineNumber, callback: callbackName, consoleText })
        pushStep(lineNumber, `Promise ${stateType} queued microtask`, null, 'checking')
        continue
      }

      const awaitMatch = line.match(/^await\s+(.+?);?$/)
      if (awaitMatch) {
        const awaitedExpr = awaitMatch[1]
        webAPIs.push({ type: 'fetch', url: awaitedExpr, status: 'pending' })
        pushStep(lineNumber, `Awaiting async operation: ${awaitedExpr}`, null, 'waiting')

        webAPIs[webAPIs.length - 1].status = 'completed'
        microtaskQueue.push({ type: 'promise', callback: 'resume async function' })
        pendingMicrotasks.push({ line: lineNumber, callback: 'resume async function', consoleText: null })
        pushStep(lineNumber, 'Async operation resolved; continuation queued as microtask', null, 'checking')
        continue
      }

      const logMatch = line.match(/^console\.log\((.*)\);?$/)
      if (logMatch) {
        const args = splitArguments(logMatch[1])
        const evaluatedArgs = args.map((arg) => evaluateLogArgument(arg, variables))
        const output = evaluatedArgs.join(' ')
        pushStep(lineNumber, `Console output: ${output}`, output)
        continue
      }

      const ifMatch = line.match(/^if\s*\((.*)\)\s*\{?$/)
      if (ifMatch) {
        const condition = ifMatch[1]
        const result = evaluateExpression(condition, variables)
        pushStep(lineNumber, `If condition "${condition}" evaluates to ${result}`)
        continue
      }

      const forMatch = line.match(/^for\s*\(\s*(let|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\2\s*<\s*(\d+)\s*;\s*\2\+\+\s*\)/)
      if (forMatch) {
        const [, , varName, startVal, endVal] = forMatch
        pushStep(lineNumber, `For loop starts: ${varName} from ${startVal} to ${Number(endVal) - 1}`)
        continue
      }

      const assignMatch = line.match(/^(\w+)\s*=\s*(.+?);?$/)
      if (assignMatch) {
        const [, varName, expr] = assignMatch
        const value = evaluateExpression(expr, variables)
        variables[varName] = value
        pushStep(lineNumber, `Variable "${varName}" is reassigned to ${formatValue(value)}`)
      }
    } catch (error) {
      pushStep(lineNumber, `Error: ${error.message}`, null, 'idle')
    }
  }

  callStack.pop()

  flushMicrotasks()
  flushMacrotasks()

  pushStep(0, 'Program execution completed', null, 'idle')

  return { steps }
}

function splitArguments(input) {
  const args = []
  let current = ''
  let quote = null

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if ((char === '"' || char === "'" || char === '`') && input[i - 1] !== '\\') {
      if (quote === char) {
        quote = null
      } else if (quote === null) {
        quote = char
      }
      current += char
      continue
    }

    if (char === ',' && quote === null) {
      args.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

function evaluateLogArgument(arg, variables) {
  const cleanArg = arg.trim()

  if ((cleanArg.startsWith('"') && cleanArg.endsWith('"')) || (cleanArg.startsWith("'") && cleanArg.endsWith("'"))) {
    return cleanArg.slice(1, -1)
  }

  if (cleanArg.startsWith('`') && cleanArg.endsWith('`')) {
    return evaluateTemplateLiteral(cleanArg, variables)
  }

  if (Object.prototype.hasOwnProperty.call(variables, cleanArg)) {
    return variables[cleanArg]
  }

  return evaluateExpression(cleanArg, variables)
}

function extractCallbackName(callbackExpr) {
  const callback = callbackExpr.trim()

  if (callback.startsWith('() =>')) {
    return 'anonymous callback'
  }

  if (callback.startsWith('function')) {
    return 'anonymous callback'
  }

  const directName = callback.match(/^(\w+)$/)
  if (directName) {
    return directName[1]
  }

  return 'callback'
}

function extractInlineConsoleText(callbackExpr, variables) {
  const match = callbackExpr.match(/console\.log\((.*?)\)/)
  if (!match) {
    return null
  }

  const args = splitArguments(match[1])
  const evaluated = args.map((arg) => evaluateLogArgument(arg, variables))
  return evaluated.join(' ')
}

function evaluateExpression(expr, variables) {
  let cleanExpr = expr.trim()

  if (cleanExpr.endsWith(';')) {
    cleanExpr = cleanExpr.slice(0, -1)
  }

  const hasOperator = /[+\-*/><=]/.test(cleanExpr)
  if (hasOperator) {
    try {
      let evalExpr = cleanExpr
      for (const [name, value] of Object.entries(variables)) {
        const serialized = JSON.stringify(value)
        evalExpr = evalExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), serialized)
      }
      return eval(evalExpr)
    } catch {
      // fall through to simpler parsing rules below
    }
  }

  if (cleanExpr.includes('+') || cleanExpr.includes('-') || cleanExpr.includes('*') || cleanExpr.includes('/')) {
    try {
      let evalExpr = cleanExpr
      for (const [name, value] of Object.entries(variables)) {
        if (typeof value === 'number') {
          evalExpr = evalExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), value)
        }
      }
      return eval(evalExpr)
    } catch {
      return cleanExpr
    }
  }

  if (cleanExpr.includes('>') || cleanExpr.includes('<') || cleanExpr.includes('===') || cleanExpr.includes('==')) {
    try {
      let evalExpr = cleanExpr
      for (const [name, value] of Object.entries(variables)) {
        if (typeof value === 'number') {
          evalExpr = evalExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), value)
        } else if (typeof value === 'string') {
          evalExpr = evalExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), `"${value}"`)
        }
      }
      return eval(evalExpr)
    } catch {
      return cleanExpr
    }
  }

  if ((cleanExpr.startsWith('"') && cleanExpr.endsWith('"')) || (cleanExpr.startsWith("'") && cleanExpr.endsWith("'"))) {
    return cleanExpr.slice(1, -1)
  }

  if (!Number.isNaN(Number(cleanExpr)) && Number.isFinite(Number(cleanExpr))) {
    return Number(cleanExpr)
  }

  if (Object.prototype.hasOwnProperty.call(variables, cleanExpr)) {
    return variables[cleanExpr]
  }

  return cleanExpr
}

function evaluateTemplateLiteral(template, variables) {
  let content = template.slice(1, -1)

  content = content.replace(/\$\{(\w+)\}/g, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName)) {
      return variables[varName]
    }
    return match
  })

  return content
}

function formatValue(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'function') return 'function()'
  return String(value)
}

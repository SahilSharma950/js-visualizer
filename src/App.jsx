import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import CodeEditor from './components/CodeEditor'
import ExecutionVisualizer from './components/ExecutionVisualizer'
import VariablePanel from './components/VariablePanel'
import ConsoleOutput from './components/ConsoleOutput'
import CallStack from './components/CallStack'
import EventLoop from './components/EventLoop'
import WebAPIs from './components/WebAPIs'
import TaskQueues from './components/TaskQueues'
import { parseAndExecute } from './utils/jsParser'

const DEFAULT_CODE = `// Welcome to JS Visualizer!
// See how JavaScript executes with Call Stack, Web APIs, and Event Loop

console.log("1. Start");

// Variable declaration
let count = 0;

// Function declaration
function increment() {
  count = count + 1;
  return count;
}

// Function call - pushed to call stack
let result = increment();
console.log("2. Result:", result);

// Another function call
result = increment();
console.log("3. Final count:", result);

console.log("4. End");`

const INITIAL_RESULT = parseAndExecute(DEFAULT_CODE)
const INITIAL_STEP = INITIAL_RESULT.steps[0] || {}

function App() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [executionSteps, setExecutionSteps] = useState(INITIAL_RESULT.steps)
  const [currentStep, setCurrentStep] = useState(INITIAL_RESULT.steps.length > 0 ? 0 : -1)
  const [variables, setVariables] = useState(INITIAL_STEP.variables || {})
  const [consoleOutput, setConsoleOutput] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000)
  const intervalRef = useRef(null)

  const [callStack, setCallStack] = useState(INITIAL_STEP.callStack || [])
  const [webAPIs, setWebAPIs] = useState(INITIAL_STEP.webAPIs || [])
  const [macrotaskQueue, setMacrotaskQueue] = useState(INITIAL_STEP.macrotaskQueue || [])
  const [microtaskQueue, setMicrotaskQueue] = useState(INITIAL_STEP.microtaskQueue || [])
  const [eventLoopStatus, setEventLoopStatus] = useState(INITIAL_STEP.eventLoopStatus || 'idle')

  const applyStepState = useCallback((step, nextStepIndex) => {
    if (!step) return

    setCurrentStep(nextStepIndex)
    setVariables(step.variables || {})
    setCallStack(step.callStack || [])
    setWebAPIs(step.webAPIs || [])
    setMacrotaskQueue(step.macrotaskQueue || [])
    setMicrotaskQueue(step.microtaskQueue || [])
    setEventLoopStatus(step.eventLoopStatus || 'idle')
  }, [])

  const runCode = useCallback(() => {
    const result = parseAndExecute(code)
    const firstStep = result.steps[0] || {}

    setExecutionSteps(result.steps)
    setCurrentStep(result.steps.length > 0 ? 0 : -1)
    setVariables(firstStep.variables || {})
    setConsoleOutput([])
    setCallStack(firstStep.callStack || [])
    setWebAPIs(firstStep.webAPIs || [])
    setMacrotaskQueue(firstStep.macrotaskQueue || [])
    setMicrotaskQueue(firstStep.microtaskQueue || [])
    setEventLoopStatus(firstStep.eventLoopStatus || 'idle')
  }, [code])

  const stepForward = useCallback(() => {
    if (currentStep >= executionSteps.length - 1) {
      return
    }

    const nextStep = currentStep + 1
    const step = executionSteps[nextStep]

    applyStepState(step, nextStep)

    if (step?.consoleOutput) {
      setConsoleOutput((prev) => [...prev, step.consoleOutput])
    }
  }, [applyStepState, currentStep, executionSteps])

  const stepBackward = useCallback(() => {
    if (currentStep <= 0) {
      return
    }

    const prevStep = currentStep - 1
    const step = executionSteps[prevStep]
    applyStepState(step, prevStep)

    const outputs = []
    for (let i = 0; i <= prevStep; i += 1) {
      if (executionSteps[i]?.consoleOutput) {
        outputs.push(executionSteps[i].consoleOutput)
      }
    }
    setConsoleOutput(outputs)
  }, [applyStepState, currentStep, executionSteps])

  const play = () => {
    if (currentStep >= executionSteps.length - 1) {
      runCode()
    }
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  const reset = () => {
    setIsPlaying(false)
    setCurrentStep(-1)
    setVariables({})
    setConsoleOutput([])
    setCallStack([])
    setWebAPIs([])
    setMacrotaskQueue([])
    setMicrotaskQueue([])
    setEventLoopStatus('idle')
  }

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < executionSteps.length - 1) {
            const next = prev + 1
            const step = executionSteps[next]
            setVariables(step.variables || {})
            setCallStack(step.callStack || [])
            setWebAPIs(step.webAPIs || [])
            setMacrotaskQueue(step.macrotaskQueue || [])
            setMicrotaskQueue(step.microtaskQueue || [])
            setEventLoopStatus(step.eventLoopStatus || 'idle')
            if (step.consoleOutput) {
              setConsoleOutput((consoleOut) => [...consoleOut, step.consoleOutput])
            }
            return next
          }

          setIsPlaying(false)
          return prev
        })
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, executionSteps, speed])

  return (
    <div className="app">
      <header className="header">
        <h1>JavaScript Visualizer</h1>
        <p>See how your JavaScript code executes step by step</p>
      </header>

      <main className="main">
        <div className="left-panel">
          <CodeEditor
            code={code}
            setCode={setCode}
            currentLine={currentStep >= 0 ? executionSteps[currentStep]?.line : -1}
          />
          <div className="controls">
            <button onClick={runCode} className="btn btn-play">Run</button>
            <button onClick={reset} className="btn btn-reset">Reset</button>
            <button onClick={stepBackward} disabled={currentStep <= 0} className="btn btn-step">
              Back
            </button>
            {isPlaying ? (
              <button onClick={pause} className="btn btn-pause">Pause</button>
            ) : (
              <button onClick={play} className="btn btn-play">Play</button>
            )}
            <button onClick={stepForward} disabled={currentStep >= executionSteps.length - 1} className="btn btn-step">
              Next
            </button>
            <div className="speed-control">
              <label htmlFor="speed-range">Speed:</label>
              <input
                id="speed-range"
                type="range"
                min="200"
                max="2000"
                step="200"
                value={2100 - speed}
                onChange={(e) => setSpeed(2100 - parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="runtime-section">
            <h3 className="section-title">JavaScript Runtime Environment</h3>
            <div className="runtime-grid">
              <CallStack stack={callStack} />
              <WebAPIs apis={webAPIs} />
              <TaskQueues
                macrotasks={macrotaskQueue}
                microtasks={microtaskQueue}
              />
              <EventLoop status={eventLoopStatus} />
            </div>
          </div>
          <ExecutionVisualizer
            steps={executionSteps}
            currentStep={currentStep}
            code={code}
          />
          <VariablePanel variables={variables} />
          <ConsoleOutput output={consoleOutput} />
        </div>
      </main>
    </div>
  )
}

export default App

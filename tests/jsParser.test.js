import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAndExecute } from '../src/utils/jsParser.js'

test('parses variable updates and console output', () => {
  const code = `let count = 1;
count = count + 1;
console.log("count", count);`

  const result = parseAndExecute(code)
  const descriptions = result.steps.map((step) => step.description)

  assert.ok(descriptions.some((d) => d.includes('Variable "count" is declared')))
  assert.ok(descriptions.some((d) => d.includes('Variable "count" is reassigned')))
  assert.ok(result.steps.some((step) => step.consoleOutput === 'count 2'))
})

test('queues and flushes microtasks before macrotasks', () => {
  const code = `Promise.resolve(1).then(() => console.log("micro"));
setTimeout(() => console.log("macro"), 0);`

  const result = parseAndExecute(code)
  const descriptions = result.steps.map((step) => step.description)

  const microExecIndex = descriptions.findIndex((d) => d.includes('Microtask executes'))
  const macroExecIndex = descriptions.findIndex((d) => d.includes('Macrotask executes'))

  assert.ok(microExecIndex > -1)
  assert.ok(macroExecIndex > -1)
  assert.ok(microExecIndex < macroExecIndex)

  const outputs = result.steps
    .filter((step) => step.consoleOutput)
    .map((step) => step.consoleOutput)

  assert.deepEqual(outputs.slice(-2), ['micro', 'macro'])
})

test('captures await as web API + continuation microtask', () => {
  const code = `await fetch("/api/data");`

  const result = parseAndExecute(code)
  const descriptions = result.steps.map((step) => step.description)

  assert.ok(descriptions.some((d) => d.includes('Awaiting async operation')))
  assert.ok(descriptions.some((d) => d.includes('continuation queued as microtask')))
})

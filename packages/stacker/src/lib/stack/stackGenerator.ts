import { outputJson, readJSON } from 'fs-extra'
import { resolve } from 'path'
import { StackLoadOptions, StackPrepareOptions } from '../../types/stack'
import {
  CollectionStackModel,
  CollectionStackInput,
  StackInput,
  WorkflowStackModel,
  WorkflowStackInput,
  ViewStackModel,
  ViewStackInput,
  StackModel,
  ServiceStackModel,
  ServiceStackInput
} from '@lotusengine/types'
import { stringifyData } from '../utils/dataUtils'
import { InvalidStackConfigError } from '../system/systemErrors'

export const STACK_NAME = 'stack.json'
export const STACK_PATH = '.lotus'

// Accepts a stack input and writes it to output dir for deploy
export const prepareStack = async (
  stack: StackModel,
  options?: StackPrepareOptions
) => {
  const output = options?.path || STACK_PATH
  await outputJson(resolve(output, STACK_NAME), prepareStackData(stack))
}

// Prepare stack data for deploy
export const prepareStackData = (input: StackModel): StackInput => {
  const { service, workflows, collections, views } = input
  const { id, data } = service

  return {
    service: {
      id,
      data: prepareServiceData(data)
    },
    workflows: workflows.map(({ id, data }) => ({
      id,
      data: prepareWorkflowData(data)
    })),
    collections: collections.map(({ id, data }) => ({
      id,
      data: prepareCollectionData(data)
    })),
    views: views.map(({ id, data }) => ({
      id,
      data: prepareViewData(data)
    }))
  }
}

// Stringify necessary workflow props
export const prepareWorkflowData = (
  workflow: WorkflowStackModel
): WorkflowStackInput => {
  return stringifyData(workflow, ['definition'])
}

// Stringify necessary collection props
export const prepareCollectionData = (
  collection: CollectionStackModel
): CollectionStackInput => {
  return stringifyData(collection, [
    'mapping',
    'triggers',
    'options',
    'queries'
  ])
}

// Stringify necessary view props
export const prepareViewData = (view: ViewStackModel): ViewStackInput => {
  return stringifyData(view)
}

// Stringify necessary service props
export const prepareServiceData = (
  service: ServiceStackModel
): ServiceStackInput => {
  return stringifyData(service, ['parameters', 'settings'])
}

// Read stack data from build file
export const loadStackData = async (options?: StackLoadOptions) => {
  const path = options?.path || './'

  console.log(resolve(path, STACK_PATH, STACK_NAME))
  const config = await readJSON(resolve(path, STACK_PATH, STACK_NAME))

  if (!config) throw new InvalidStackConfigError()

  return config
}

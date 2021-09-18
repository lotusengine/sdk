import { doMutation, doQuery, parseFields, removeEmpty } from 'lib/query'
import { parseJson } from 'lib/json'
import { ISO8601DateTime, UUID } from 'typings/common'
import { ServiceModel, ServiceDefinition, ServiceSettings, ServiceUpdateInput, ServiceCreateInput } from 'typings/service'
import { IOptionFlag } from '@oclif/command/lib/flags'
import { LogType, LogModel } from 'typings/log'
import { ActionResponseResult, ActionType } from 'typings/action'

// Find a service by ID
export const findService = async (id: UUID): Promise<ServiceModel> => {
  const query = `query GetService($id: ID!){
    service(id: $id) {  
      id
      label
      summary
      description
      domain
      settings
      definition
      createdAt
      updatedAt
    }
  }`

  const res = await doQuery<{ service: ServiceModel }>(query, { id })
  if (!res) throw new Error('Missing')

  const {
    label, summary, description, definition, settings, createdAt, updatedAt, domain } = res.service


  return parseFields<{ id: UUID, createdAt: ISO8601DateTime, updatedAt: ISO8601DateTime, label: string, summary: string, domain: string, description: string, definition: ServiceDefinition, settings: ServiceSettings }>({ id, createdAt, updatedAt, label, summary, domain, description, definition, settings }, ['definition', 'settings'])
}

// Delete a service by ID
export const deleteService = async (id: UUID): Promise<void> => {
  const query = `mutation DeleteService($input: DeleteServiceInput!) { 
    deleteService(input: $input) {
     id
    }
  }`

  await doMutation(query, { input: { id } })
}

// Validate a service
export const validateService = async (params: ServiceCreateInput) => {

  const query = `mutation ValidateService($input: ValidateServiceInput!) {
      validateService(input: $input) {
        id
      }
    }`

  const res = await doMutation(query, {
    input: removeEmpty(params)
  })

  return !res.errors
}

// Update a service
export const updateService = async (params: ServiceUpdateInput) => {

  const query = `mutation UpdateService($input: UpdateServiceInput!) {
      updateService(input: $input) {
        id
      }
    }`

  await doMutation(query, {
    input: removeEmpty(params)
  })

}

// Create a new service
export const createService = async (params: ServiceCreateInput) => {
  const query = `mutation CreateService($input: CreateServiceInput!) {
      createService(input: $input) {
        id
      }
    }`

  const res = await doMutation(query, {
    input: removeEmpty(params)
  })

  return res.data.createService
}

// List services
export const listServices = async (): Promise<Partial<ServiceModel>[]> => {
  const query = `query Services($after: String, $limit: Int) {
    services(limit: $limit, after: $after) {
      nodes {
        id
        label
        createdAt
      }
    }
  }`

  const res = await doQuery<{ services: { nodes: ServiceModel[] } }>(query)

  return res.services.nodes.map(({ id, label, createdAt }) => ({ id, label, createdAt } as ServiceModel))
}

// Fetch service logs
export const fetchLogs = async (params: {
  id: IOptionFlag<string | undefined>,
  workflowId: IOptionFlag<string | undefined>,
  processId: IOptionFlag<string | undefined>,
  status: IOptionFlag<string | undefined>,
  term: IOptionFlag<string | undefined>,
  scope: IOptionFlag<string | undefined>,
  until: IOptionFlag<string | undefined>,
  from: IOptionFlag<string | undefined>,
}): Promise<LogModel[]> => {

  const {
    id,
    processId,
    status,
    term,
    scope,
    until,
    from
  } = params

  const query = `query logs($filter: LogFilter, $search: LogSearch, $serviceId: ID) {
  logs(filter: $filter, search: $search, serviceId: $serviceId) {
    nodes {
      id
      triggeredAt
      result
      workflowId
      processId
      status
      type
      name    
    }
  }
}`

  const variables = {
    serviceId: id,
    filter: removeEmpty({
      processId,
      status,
      until,
      from
    }),
    search: removeEmpty({
      query: term,
      scope
    }),
  }
  const res = await doQuery<{
    logs: {
      nodes: LogType[]
    }
  }>(query, variables)

  return res.logs.nodes.map(log => {
    const { id, name, processId, result, status, triggeredAt, type, workflowId } = log
    return { id, triggeredAt, processId, workflowId, name, type, status, result: parseJson<{ id: UUID, processId: UUID, workflowId: UUID, name: string, type: ActionType, result: ActionResponseResult, label: string, triggeredAt: ISO8601DateTime }>(result) }
  })
}

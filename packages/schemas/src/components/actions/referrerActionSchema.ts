import S from 'fluent-json-schema'
import {
  baseActionSchema,
  actionSchemaNextParameterSchema
} from '../../utils/schemaUtils'

export const validationSchema = S.object()
  .prop('type', S.const('referrer'))
  .prop(
    'parameters',
    S.object()
      .prop('origins', S.array().items(S.string()))
      .prop('next', actionSchemaNextParameterSchema)
  )
  .extend(baseActionSchema)

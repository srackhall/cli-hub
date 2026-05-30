import { useTranslation } from "react-i18next"
import type { ToolSchema } from "@/api"

export function useLocalizedSchema(schema: ToolSchema | null) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith("zh")

  if (!schema) return null

  return {
    ...schema,
    title: isZh ? (schema.title_zh || schema.title) : schema.title,
    description: isZh
      ? (schema.description_zh || schema.description)
      : schema.description,
    long_description: isZh
      ? (schema.long_description_zh || schema.long_description)
      : schema.long_description,
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([key, prop]) => [
        key,
        {
          ...prop,
          description: isZh
            ? (prop.description_zh || prop.description)
            : prop.description,
        },
      ])
    ),
    "x-steps": schema["x-steps"]?.map((step) => ({
      ...step,
      title: isZh ? (step.title_zh || step.title) : step.title,
    })),
  }
}

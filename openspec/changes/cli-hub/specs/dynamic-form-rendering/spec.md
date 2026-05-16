## ADDED Requirements

### Requirement: Frontend SHALL render parameter forms dynamically from JSON Schema

The React frontend MUST parse a `ToolSchema` object, iterate its `properties` map, and render each property as the appropriate shadcn/ui form control based on its `type` and optional `format`/`enum` fields.

#### Scenario: String property without format
- **WHEN** the schema has a property with `type: "string"` and no `format` field
- **THEN** the form renders a text `Input` with the property's `description` as label

#### Scenario: String property with file-path format
- **WHEN** the schema has a property with `type: "string"` and `format: "file-path"`
- **THEN** the form renders an Input with placeholder `/path/to/file` (native dialog integration deferred)

#### Scenario: Number property with min/max
- **WHEN** the schema has a property with `type: "number"`, `minimum: 1`, `maximum: 100`
- **THEN** the form renders a number Input with `min=1` and `max=100` attributes

#### Scenario: Boolean property
- **WHEN** the schema has a property with `type: "boolean"`
- **THEN** the form renders a Checkbox with the property's `description` as label

#### Scenario: String property with enum
- **WHEN** the schema has a property with `type: "string"` and `enum: ["a", "b", "c"]`
- **THEN** the form renders a Select dropdown with those options plus a "(none)" option for non-required fields

#### Scenario: Array property with string items
- **WHEN** the schema has a property with `type: "array"` and `items: { type: "string" }`
- **THEN** the form renders a list of text Inputs with Add and per-item Remove buttons

#### Scenario: Default values pre-populate form
- **WHEN** a schema property has a `default` value
- **THEN** the corresponding form control is initialized with that value

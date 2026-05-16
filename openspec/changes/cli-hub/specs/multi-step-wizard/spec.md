## ADDED Requirements

### Requirement: Frontend SHALL support multi-step parameter forms via x-steps schema extension

When a tool's JSON Schema includes the custom `x-steps` array, the frontend MUST split parameter rendering into sequential steps. Each step displays only its declared fields. Form values MUST be preserved across step navigation.

#### Scenario: Tool with x-steps definition
- **WHEN** the schema has `x-steps: [{title: "Step 1", fields: ["a"]}, {title: "Step 2", fields: ["b"]}]`
- **THEN** the form shows "Step 1" with only field "a" on initial load, and a "Next" button
- **AND** clicking "Next" advances to "Step 2" with only field "b", preserving the value entered for "a"
- **AND** a "Previous" button is available on step 2 to return to step 1

#### Scenario: Tool without x-steps
- **WHEN** the schema has no `x-steps` field or an empty `x-steps` array
- **THEN** all properties are displayed in a single step titled "Parameters"
- **AND** no Previous/Next navigation buttons are shown

#### Scenario: Switching tools resets step state
- **WHEN** the user selects a different tool from the sidebar
- **THEN** the current step index resets to 0 and all form values are cleared

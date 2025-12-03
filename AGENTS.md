# Project Instructions

## Code style

- Follow industry best practices.
- Make only surgical edits, keeping changes as small and manageable as possible to achieve the task given.
- When adding a new feature, always ensure changes are made to the UI in /src and the backend code in /src-tauri.

## In the src-tauri folder where the Rust code lives

- Always collapse if statements per https://rust-lang.github.io/rust-clippy/master/index.html#collapsible_if
- Always inline format! args when possible per https://rust-lang.github.io/rust-clippy/master/index.html#uninlined_format_args
- Use method references over closures when possible per https://rust-lang.github.io/rust-clippy/master/index.html#redundant_closure_for_method_calls
- Do not use unsigned integer even if the number cannot be negative.
<!-- - When making a change that adds or changes an API, ensure that the documentation in the docs/ folder is up to date if applicable. -->

## In the src folder where the Typescript code lives

- ONLY use top level imports
- Use tailwindCSS for styling.
- Use headless components where possible.
- Use modular imports over mass import where possible. e.g import { DragEvent } from 'react' instead of import React from 'react'.
- Function Components First: Use function components and Hooks
- TypeScript Types: Define interfaces for all props
- Component Naming: Use PascalCase, file name matches component name
- Functional programming: Each function and component handles only one functionality
- All components should be functional.
- NEVER cast types to `any`.

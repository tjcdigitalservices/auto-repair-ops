import { DEFAULT_MERGE_VARIABLES } from "@/components/document-engine/variables/definitions";
import type { MergeVariableDefinition } from "@/components/document-engine/variables/types";

const mergeVariableRegistry = new Map<string, MergeVariableDefinition>(
  DEFAULT_MERGE_VARIABLES.map((definition) => [definition.id, definition]),
);

export function registerMergeVariable(definition: MergeVariableDefinition) {
  mergeVariableRegistry.set(definition.id, definition);
}

export function registerMergeVariables(definitions: MergeVariableDefinition[]) {
  definitions.forEach(registerMergeVariable);
}

export function getMergeVariable(variableId: string) {
  return mergeVariableRegistry.get(variableId);
}

export function listMergeVariables() {
  return Array.from(mergeVariableRegistry.values());
}

export function listMergeVariableGroups() {
  const groups = new Map<string, MergeVariableDefinition[]>();

  for (const variable of listMergeVariables()) {
    const existing = groups.get(variable.group) ?? [];
    existing.push(variable);
    groups.set(variable.group, existing);
  }

  return Array.from(groups.entries()).map(([group, variables]) => ({
    group,
    variables,
  }));
}

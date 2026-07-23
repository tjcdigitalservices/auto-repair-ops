export type MergeVariableDefinition = {
  id: string;
  label: string;
  group: string;
  sampleValue?: string;
};

export type MergeVariableRenderProps = {
  variableId: string;
  selected?: boolean;
};

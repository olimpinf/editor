import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import { registerSaciBlocks } from './saci-blocks';

registerSaciBlocks();

let workspace: Blockly.WorkspaceSvg | null = null;
let changeCallback: (() => void) | null = null;
let activeContainerId: string | null = null;

export function setBlocklyChangeCallback(cb: () => void): void {
  changeCallback = cb;
}

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'E/S',
      colour: '#bb6622',
      contents: [
        { kind: 'block', type: 'saci_text_print' },
        { kind: 'block', type: 'saci_text_print_with_end' },
        { kind: 'block', type: 'saci_input_int' },
        { kind: 'block', type: 'saci_input_str' },
      ],
    },
    {
      kind: 'category',
      name: 'Matemática',
      colour: '230',
      contents: [
        { kind: 'block', type: 'saci_math_number' },
        { kind: 'block', type: 'saci_math_arithmetic' },
        { kind: 'block', type: 'saci_math_remainder' },
      ],
    },
    {
      kind: 'category',
      name: 'Texto',
      colour: '160',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'saci_text_split_into_int' },
        { kind: 'block', type: 'saci_text_split' },
      ],
    },
    {
      kind: 'category',
      name: 'Lógica',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'controls_if', extraState: { elseCount: 1 } },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Laços',
      colour: '120',
      contents: [
        { kind: 'block', type: 'saci_controls_repeat_ext' },
        { kind: 'block', type: 'saci_controls_for' },
        { kind: 'block', type: 'saci_controls_flow_statements' },
        { kind: 'block', type: 'saci_controls_while' },
      ],
    },
    {
      kind: 'category',
      name: 'Listas',
      colour: '260',
      contents: [
        { kind: 'block', type: 'lists_create_empty' },
        { kind: 'block', type: 'saci_lists_append' },
        { kind: 'block', type: 'saci_lists_getIndex' },
        { kind: 'block', type: 'saci_lists_setIndex' },
      ],
    },
    { kind: 'sep' },
    {
      kind: 'category',
      name: 'Variáveis',
      colour: '330',
      custom: 'VARIABLE',
    },
  ],
};

function variablesFlyout(workspace: Blockly.WorkspaceSvg): Element[] {
  const xmlList: Element[] = [];

  const button = document.createElement('button');
  button.setAttribute('text', 'Crie variável...');
  button.setAttribute('callbackKey', 'CREATE_VARIABLE');
  xmlList.push(button);

  const variables = workspace.getAllVariables()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  for (const v of variables) {
    const setBlock = document.createElement('block');
    setBlock.setAttribute('type', 'variables_set');
    const setField = document.createElement('field');
    setField.setAttribute('name', 'VAR');
    setField.setAttribute('id', v.getId());
    setField.textContent = v.name;
    setBlock.appendChild(setField);
    xmlList.push(setBlock);

    const getBlock = document.createElement('block');
    getBlock.setAttribute('type', 'variables_get');
    const getField = document.createElement('field');
    getField.setAttribute('name', 'VAR');
    getField.setAttribute('id', v.getId());
    getField.textContent = v.name;
    getBlock.appendChild(getField);
    xmlList.push(getBlock);
  }

  return xmlList;
}

function injectWorkspace(containerId: string): Blockly.WorkspaceSvg {
  const ws = Blockly.inject(containerId, {
    toolbox: TOOLBOX,
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
  });
  ws.registerButtonCallback('CREATE_VARIABLE', (btn: any) => {
    Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace());
  });
  ws.registerToolboxCategoryCallback('VARIABLE', variablesFlyout);
  ws.addChangeListener(() => changeCallback?.());
  return ws;
}

export function initBlockly(containerId: string): void {
  activeContainerId = containerId;
  if (!workspace) {
    workspace = injectWorkspace(containerId);
  } else {
    Blockly.svgResize(workspace);
  }
}

export function getBlocklyPython(): string {
  if (!workspace) return '';
  return pythonGenerator.workspaceToCode(workspace);
}

export function getBlocklyXml(): string {
  if (!workspace) return '';
  return JSON.stringify(Blockly.serialization.workspaces.save(workspace));
}

export function loadBlocklyXml(serialized: string): void {
  if (!activeContainerId) return;

  // Dispose the old workspace and inject a fresh one — workspace.clear() leaves
  // Blockly v12 internal state (focus manager, flyout) in a broken condition.
  const saved = changeCallback;
  changeCallback = null;

  if (workspace) {
    workspace.dispose();
    workspace = null;
  }
  workspace = injectWorkspace(activeContainerId);

  if (serialized) {
    try {
      // Try new JSON serialization first (Blockly v10+)
      const state = JSON.parse(serialized);
      Blockly.serialization.workspaces.load(state, workspace);
    } catch (_) {
      // Fall back to legacy XML format
      try {
        const xml = Blockly.Xml.textToDom(serialized);
        Blockly.Xml.domToWorkspace(xml, workspace);
      } catch (e) {
        console.error('[Blockly] Failed to restore workspace:', e);
      }
    }
  }

  changeCallback = saved;
}

export function resizeBlockly(): void {
  if (workspace) Blockly.svgResize(workspace);
}

export function setBlocklyTheme(dark: boolean): void {
  if (!workspace) return;
  workspace.setTheme(dark ? Blockly.Themes.Dark : Blockly.Themes.Classic);
}

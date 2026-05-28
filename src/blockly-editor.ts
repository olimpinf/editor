import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import { registerSaciBlocks } from './saci-blocks';

registerSaciBlocks();

// Override Blockly's window.prompt-based dialog with a custom HTML modal,
// because window.prompt is suppressed in Electron webviews.
Blockly.dialog.setPrompt((message, defaultValue, callback) => {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;padding:24px;border-radius:8px;min-width:300px;font-family:sans-serif';
  const label = document.createElement('p');
  label.style.cssText = 'margin:0 0 12px;font-size:14px';
  label.textContent = message;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = defaultValue ?? '';
  input.style.cssText = 'width:100%;padding:8px;box-sizing:border-box;font-size:14px;border:1px solid #ccc;border-radius:4px';
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px';
  const btnOk = document.createElement('button');
  btnOk.textContent = 'OK';
  btnOk.style.cssText = 'padding:6px 16px;background:#667eea;color:#fff;border:none;border-radius:4px;cursor:pointer';
  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancelar';
  btnCancel.style.cssText = 'padding:6px 16px;border:1px solid #ccc;border-radius:4px;cursor:pointer';
  btnRow.append(btnCancel, btnOk);
  box.append(label, input, btnRow);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const finish = (value: string | null) => { document.body.removeChild(overlay); callback(value); };
  btnOk.addEventListener('click', () => finish(input.value));
  btnCancel.addEventListener('click', () => finish(null));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(input.value); if (e.key === 'Escape') finish(null); });
  input.focus();
  input.select();
});

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

function variablesFlyout(workspace: Blockly.WorkspaceSvg): object[] {
  workspace.registerButtonCallback('CREATE_VARIABLE', (btn: any) => {
    Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace());
  });

  const items: object[] = [
    { kind: 'button', text: 'Crie variável...', callbackKey: 'CREATE_VARIABLE' },
  ];

  const variables = workspace.getAllVariables()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  for (const v of variables) {
    items.push({ kind: 'block', type: 'variables_set', fields: { VAR: { name: v.name, type: v.type } } });
    items.push({ kind: 'block', type: 'variables_get', fields: { VAR: { name: v.name, type: v.type } } });
  }

  return items;
}

function injectWorkspace(containerId: string): Blockly.WorkspaceSvg {
  const ws = Blockly.inject(containerId, {
    toolbox: TOOLBOX,
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
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

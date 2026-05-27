import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';

let workspace: Blockly.WorkspaceSvg | null = null;
let changeCallback: (() => void) | null = null;

export function setBlocklyChangeCallback(cb: () => void): void {
  changeCallback = cb;
}

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Lógica',
      colour: '%{BKY_LOGIC_HUE}',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Laços',
      colour: '%{BKY_LOOPS_HUE}',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_forEach' },
        { kind: 'block', type: 'controls_flow_statements' },
      ],
    },
    {
      kind: 'category',
      name: 'Matemática',
      colour: '%{BKY_MATH_HUE}',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_number_property' },
        { kind: 'block', type: 'math_round' },
        { kind: 'block', type: 'math_modulo' },
      ],
    },
    {
      kind: 'category',
      name: 'Texto',
      colour: '%{BKY_TEXTS_HUE}',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_isEmpty' },
        { kind: 'block', type: 'text_indexOf' },
        { kind: 'block', type: 'text_charAt' },
        { kind: 'block', type: 'text_getSubstring' },
        { kind: 'block', type: 'text_changeCase' },
        { kind: 'block', type: 'text_trim' },
        { kind: 'block', type: 'text_print' },
      ],
    },
    {
      kind: 'category',
      name: 'Listas',
      colour: '%{BKY_LISTS_HUE}',
      contents: [
        { kind: 'block', type: 'lists_create_empty' },
        { kind: 'block', type: 'lists_create_with' },
        { kind: 'block', type: 'lists_repeat' },
        { kind: 'block', type: 'lists_length' },
        { kind: 'block', type: 'lists_isEmpty' },
        { kind: 'block', type: 'lists_indexOf' },
        { kind: 'block', type: 'lists_getIndex' },
        { kind: 'block', type: 'lists_setIndex' },
        { kind: 'block', type: 'lists_sort' },
      ],
    },
    {
      kind: 'category',
      name: 'Variáveis',
      colour: '%{BKY_VARIABLES_HUE}',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: 'Funções',
      colour: '%{BKY_PROCEDURES_HUE}',
      custom: 'PROCEDURE',
    },
  ],
};

export function initBlockly(containerId: string): void {
  if (workspace) {
    resizeBlockly();
    return;
  }
  workspace = Blockly.inject(containerId, {
    toolbox: TOOLBOX,
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
  });
  workspace.addChangeListener(() => changeCallback?.());
}

export function getBlocklyPython(): string {
  if (!workspace) return '';
  return pythonGenerator.workspaceToCode(workspace);
}

export function getBlocklyXml(): string {
  if (!workspace) return '';
  const xml = Blockly.Xml.workspaceToDom(workspace);
  return Blockly.Xml.domToText(xml);
}

export function loadBlocklyXml(xmlText: string): void {
  if (!workspace) return;
  // Suppress the change callback during programmatic load so the debounced
  // save doesn't fire with a half-loaded (or empty) workspace.
  const saved = changeCallback;
  changeCallback = null;
  try {
    workspace.clear();
    if (xmlText) {
      const xml = Blockly.Xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(xml, workspace);
    }
  } catch (e) {
    console.error('[Blockly] Failed to load XML:', e);
  } finally {
    changeCallback = saved;
  }
}

export function resizeBlockly(): void {
  if (workspace) Blockly.svgResize(workspace);
}

export function setBlocklyTheme(dark: boolean): void {
  if (!workspace) return;
  workspace.setTheme(dark ? Blockly.Themes.Dark : Blockly.Themes.Classic);
}

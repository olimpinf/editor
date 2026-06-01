import * as Blockly from 'blockly/core';
import { pythonGenerator, Order } from 'blockly/python';

// Custom SACI blocks — reconstructed from olimpiada.ic.unicamp.br/saci/cursos/python/15/
// In Blockly v10+, forBlock functions take (block, generator) — two arguments.

const SACI_COLOUR = '#bb6622';
const PASS = '  pass\n';

export function registerSaciBlocks(): void {
  // Portuguese labels for the standard logic/control blocks we reuse
  Object.assign(Blockly.Msg, {
    LISTS_CREATE_EMPTY_TITLE:   'crie lista vazia',
    LISTS_CREATE_EMPTY_TOOLTIP: 'Retorna uma lista sem itens.',
    CONTROLS_IF_MSG_IF:              'se',
    CONTROLS_IF_MSG_THEN:            'então',
    CONTROLS_IF_MSG_ELSE:            'senão',
    CONTROLS_IF_MSG_ELSEIF:          'senão se',
    CONTROLS_IF_IF_TITLE_IF:         'se',
    CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'senão se',
    CONTROLS_IF_ELSE_TITLE_ELSE:     'senão',
    LOGIC_OPERATION_AND:        'e',
    LOGIC_OPERATION_OR:         'ou',
    LOGIC_NEGATE_TITLE:         'não %1',
    LOGIC_BOOLEAN_TRUE:         'verdadeiro',
    LOGIC_BOOLEAN_FALSE:        'falso',
    LOGIC_BOOLEAN_TOOLTIP:      'Retorna verdadeiro ou falso.',
    VARIABLES_DEFAULT_NAME:     'item',
    NEW_VARIABLE_TITLE:         'Nome:',
    RENAME_VARIABLE:            'Renomear variável...',
    DELETE_VARIABLE:            'Excluir variável "%1"',
    TEXT_TEXT_TOOLTIP:          'Um texto (cadeia de caracteres).',
  });

  // Redefine variables_set: inline layout, Portuguese label
  Blockly.Blocks['variables_set'] = {
    init(this: Blockly.Block) {
      this.jsonInit({
        message0: 'faça %1 valer %2',
        args0: [
          { type: 'field_variable', name: 'VAR', variable: 'item' },
          { type: 'input_value',    name: 'VALUE' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        style: 'variable_blocks',
        tooltip: '',
        helpUrl: '',
      });
    },
  };

  Blockly.defineBlocksWithJsonArray([
    // ── E/S ──────────────────────────────────────────────────────────────────
    {
      type: 'saci_text_print',
      message0: 'imprima %1',
      args0: [{ type: 'input_value', name: 'TEXT' }],
      previousStatement: null,
      nextStatement: null,
      colour: SACI_COLOUR,
      tooltip: 'imprime na saída o especificado',
      helpUrl: '',
      extensions: ['text_quotes'],
    },
    {
      type: 'saci_text_print_with_end',
      message0: 'imprima com final %2 %1',
      args0: [
        { type: 'input_value', name: 'PTEXT' },
        { type: 'field_input', name: 'TEXT', text: '' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: SACI_COLOUR,
      tooltip: 'imprime na saída o especificado',
      helpUrl: '',
    },
    {
      type: 'saci_input_int',
      message0: 'leia número',
      inputsInline: false,
      output: 'Number',
      colour: SACI_COLOUR,
      tooltip: 'lê um número inteiro da entrada',
      helpUrl: '',
    },
    {
      type: 'saci_input_str',
      message0: 'leia linha',
      inputsInline: false,
      output: 'String',
      colour: SACI_COLOUR,
      tooltip: 'lê uma linha da entrada',
      helpUrl: '',
    },

    // ── Texto ─────────────────────────────────────────────────────────────────
    {
      type: 'saci_text_indexOf',
      message0: 'procure %1 em %2',
      args0: [
        { type: 'input_value', name: 'FIND', check: 'String' },
        { type: 'input_value', name: 'VALUE', check: 'String' },
      ],
      output: 'Number',
      style: 'text_blocks',
      helpUrl: '',
      inputsInline: true,
      tooltip: 'Retorna a posição da primeira ocorrência. Retorna -1 se não encontrado.',
    },
    {
      type: 'saci_text_split',
      message0: 'separe %1',
      args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }],
      output: 'Array',
      style: 'text_blocks',
      inputsInline: true,
      helpUrl: '',
      tooltip: "Cria uma lista separando o texto por espaços em branco.",
    },
    {
      type: 'saci_text_split_into_int',
      message0: 'separe %1 como inteiros',
      args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }],
      output: 'Array',
      style: 'text_blocks',
      inputsInline: true,
      helpUrl: '',
      tooltip: "Cria uma lista de inteiros separando o texto por espaços em branco.",
    },
    {
      type: 'saci_text_length',
      message0: 'comprimento de %1',
      args0: [{ type: 'input_value', name: 'VALUE', check: ['String', 'Array'] }],
      output: 'Number',
      style: 'text_blocks',
      inputsInline: true,
      tooltip: 'Retorna o comprimento do texto ou lista.',
      helpUrl: '',
    },

    // ── Matemática ────────────────────────────────────────────────────────────
    {
      type: 'saci_math_number',
      message0: '%1',
      args0: [{ type: 'field_number', name: 'NUM', value: 0, precision: 1 }],
      output: 'Number',
      style: 'math_blocks',
      helpUrl: '',
      tooltip: 'Um número inteiro.',
    },
    {
      type: 'saci_math_arithmetic',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['+', 'ADD'],
            ['-', 'MINUS'],
            ['×', 'MULTIPLY'],
            ['÷', 'DIVIDE'],
            ['^', 'POWER'],
          ],
        },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      style: 'math_blocks',
      helpUrl: '',
      tooltip: 'Operação aritmética. ÷ é divisão inteira.',
    },
    {
      type: 'saci_math_remainder',
      message0: 'resto de %1 ÷ %2',
      args0: [
        { type: 'input_value', name: 'DIVIDEND', check: 'Number' },
        { type: 'input_value', name: 'DIVISOR',  check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      style: 'math_blocks',
      helpUrl: '',
      tooltip: 'Retorna o resto da divisão inteira.',
    },

    // ── Laços ─────────────────────────────────────────────────────────────────
    {
      type: 'saci_controls_repeat_ext',
      message0: 'por %1 vezes',
      args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
      message1: 'execute %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      style: 'loop_blocks',
      tooltip: 'Repete os comandos o número de vezes especificado.',
      helpUrl: '',
    },
    {
      type: 'saci_controls_while',
      message0: 'enquanto %1',
      args0: [{ type: 'input_value', name: 'BOOL', check: 'Boolean' }],
      message1: 'execute %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      style: 'loop_blocks',
      helpUrl: '',
      tooltip: 'Enquanto for verdadeiro, execute os comandos.',
    },
    {
      type: 'saci_controls_for',
      message0: 'para %1 de %2 até %3',
      args0: [
        { type: 'field_variable', name: 'VAR', variable: null },
        { type: 'input_value', name: 'FROM', check: 'Number', align: 'RIGHT' },
        { type: 'input_value', name: 'TO',   check: 'Number', align: 'RIGHT' },
      ],
      message1: 'execute %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'loop_blocks',
      helpUrl: '',
      extensions: ['contextMenu_newGetVariableBlock', 'controls_for_tooltip'],
    },
    {
      type: 'saci_controls_forEach',
      message0: 'para cada item %1 em %2',
      args0: [
        { type: 'field_variable', name: 'VAR', variable: null },
        { type: 'input_value', name: 'LIST', check: ['Array', 'String'] },
      ],
      message1: 'execute %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      style: 'loop_blocks',
      inputsInline: true,
      helpUrl: '',
      extensions: ['contextMenu_newGetVariableBlock', 'controls_forEach_tooltip'],
    },
    {
      type: 'saci_controls_flow_statements',
      message0: '%1 o laço',
      args0: [
        {
          type: 'field_dropdown',
          name: 'FLOW',
          options: [
            ['encerre', 'BREAK'],
            ['continue', 'CONTINUE'],
          ],
        },
      ],
      previousStatement: null,
      style: 'loop_blocks',
      helpUrl: '',
      extensions: ['controls_flow_in_loop_check'],
    },

    // ── Listas ────────────────────────────────────────────────────────────────
    {
      type: 'saci_lists_length',
      message0: 'comprimento de %1',
      args0: [{ type: 'input_value', name: 'VALUE', check: ['String', 'Array'] }],
      output: 'Number',
      style: 'list_blocks',
      inputsInline: true,
      tooltip: 'Retorna o número de itens na lista.',
      helpUrl: '',
    },
    {
      type: 'saci_lists_indexOf',
      message0: 'na lista %1 procure o item %2',
      args0: [
        { type: 'input_value', name: 'VALUE', check: ['String', 'Array'] },
        { type: 'input_value', name: 'FIND',  check: ['String', 'Array', 'Number'] },
      ],
      output: 'Number',
      style: 'list_blocks',
      helpUrl: '',
      inputsInline: true,
      tooltip: 'Retorna a posição do item na lista. Retorna -1 se não encontrado.',
    },
    {
      type: 'saci_lists_sort',
      message0: 'ordene %1',
      args0: [{ type: 'input_value', name: 'LIST', check: 'Array' }],
      output: 'Array',
      style: 'list_blocks',
      inputsInline: true,
      tooltip: 'Retorna uma cópia ordenada da lista.',
      helpUrl: '',
    },
    {
      type: 'saci_lists_append',
      message0: 'na lista %1 acrescente %2',
      args0: [
        { type: 'input_value', name: 'LIST',  check: 'Array' },
        { type: 'input_value', name: 'VALUE' },
      ],
      previousStatement: null,
      nextStatement: null,
      style: 'list_blocks',
      inputsInline: true,
      tooltip: 'Acrescenta um item ao final da lista.',
      helpUrl: '',
    },
    {
      type: 'saci_lists_getIndex',
      message0: 'na lista %1 pegue o item de índice %2',
      args0: [
        { type: 'input_value', name: 'LIST',  check: 'Array' },
        { type: 'input_value', name: 'INDEX', check: 'Number' },
      ],
      inputsInline: true,
      output: null,
      style: 'list_blocks',
      tooltip: 'Retorna o item na posição especificada (índice começa em 0).',
      helpUrl: '',
    },
    {
      type: 'saci_lists_setIndex',
      message0: 'na lista %1 faça o item de índice %2 valer %3',
      args0: [
        { type: 'input_value', name: 'LIST',  check: 'Array' },
        { type: 'input_value', name: 'INDEX', check: 'Number' },
        { type: 'input_value', name: 'VALUE' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'list_blocks',
      tooltip: 'Define o valor do item na posição especificada (índice começa em 0).',
      helpUrl: '',
    },
  ]);

  // ── Python generators (Blockly v10+ API: forBlock takes (block, generator)) ─

  pythonGenerator.forBlock['saci_text_print'] = (block, gen) => {
    const text = gen.valueToCode(block, 'TEXT', Order.NONE) || "''";
    return `print(${text})\n`;
  };

  pythonGenerator.forBlock['saci_text_print_with_end'] = (block, gen) => {
    const text = gen.valueToCode(block, 'PTEXT', Order.NONE) || "''";
    const end  = block.getFieldValue('TEXT') ?? '';
    return `print(${text}, end="${end}")\n`;
  };

  pythonGenerator.forBlock['saci_input_int'] = (_block, _gen) => {
    return ['int(input())', Order.NONE];
  };

  pythonGenerator.forBlock['saci_input_str'] = (_block, _gen) => {
    return ['input()', Order.NONE];
  };

  pythonGenerator.forBlock['saci_text_indexOf'] = (block, gen) => {
    const find  = gen.valueToCode(block, 'FIND',  Order.NONE)   || "''";
    const value = gen.valueToCode(block, 'VALUE', Order.MEMBER) || "''";
    return [`${value}.find(${find})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_text_split'] = (block, gen) => {
    const text = gen.valueToCode(block, 'TEXT', Order.NONE) || "''";
    return [`${text}.split()`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_text_split_into_int'] = (block, gen) => {
    const text = gen.valueToCode(block, 'TEXT', Order.NONE) || "''";
    return [`[int(i) for i in ${text}.split()]`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_text_length'] = (block, gen) => {
    const value = gen.valueToCode(block, 'VALUE', Order.NONE) || "''";
    return [`len(${value})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_math_number'] = (block, _gen) => {
    return [String(block.getFieldValue('NUM')), Order.ATOMIC];
  };

  pythonGenerator.forBlock['saci_math_arithmetic'] = (block, gen) => {
    const ops: Record<string, [string, Order]> = {
      ADD:      [' + ',  Order.ADDITIVE],
      MINUS:    [' - ',  Order.ADDITIVE],
      MULTIPLY: [' * ',  Order.MULTIPLICATIVE],
      DIVIDE:   [' // ', Order.MULTIPLICATIVE],
      POWER:    [' ** ', Order.EXPONENTIATION],
    };
    const [op, order] = ops[block.getFieldValue('OP')];
    const a = gen.valueToCode(block, 'A', order) || '0';
    const b = gen.valueToCode(block, 'B', order) || '0';
    return [`${a}${op}${b}`, order];
  };

  pythonGenerator.forBlock['saci_math_remainder'] = (block, gen) => {
    const dividend = gen.valueToCode(block, 'DIVIDEND', Order.MULTIPLICATIVE) || '0';
    const divisor  = gen.valueToCode(block, 'DIVISOR',  Order.MULTIPLICATIVE) || '0';
    return [`${dividend} % ${divisor}`, Order.MULTIPLICATIVE];
  };

  pythonGenerator.forBlock['saci_controls_while'] = (block, gen) => {
    const cond = gen.valueToCode(block, 'BOOL', Order.NONE) || 'False';
    let body = gen.statementToCode(block, 'DO');
    body = gen.addLoopTrap(body, block) || PASS;
    return `while ${cond}:\n${body}`;
  };

  pythonGenerator.forBlock['saci_controls_repeat_ext'] = (block, gen) => {
    let times: string | number = gen.valueToCode(block, 'TIMES', Order.NONE) || '0';
    times = /^-?\d+$/.test(String(times).trim())
      ? parseInt(String(times), 10)
      : `int(${times})`;
    let body = gen.statementToCode(block, 'DO');
    body = gen.addLoopTrap(body, block) || PASS;
    const counter = (gen as any).nameDB_
      ? (gen as any).nameDB_.getDistinctName('count', 'VARIABLE')
      : 'count';
    return `for ${counter} in range(${times}):\n${body}`;
  };

  pythonGenerator.forBlock['saci_controls_for'] = (block, gen) => {
    const varName = gen.getVariableName(block.getFieldValue('VAR'));
    const from = gen.valueToCode(block, 'FROM', Order.NONE) || '0';
    const to   = gen.valueToCode(block, 'TO',   Order.NONE) || '0';
    let body = gen.statementToCode(block, 'DO');
    body = gen.addLoopTrap(body, block) || PASS;
    const isNum = (s: string) => /^-?\d+$/.test(s.trim());
    if (isNum(from) && isNum(to)) {
      return `for ${varName} in range(${from}, ${Number(to) + 1}):\n${body}`;
    }
    let preamble = '';
    let f = from, t = to;
    if (!isNum(from)) { const v = `${varName}_inicio`; preamble += `${v} = int(${from})\n`; f = v; }
    if (!isNum(to))   { const v = `${varName}_fim`;    preamble += `${v} = int(${to})\n`;   t = v; }
    return `${preamble}for ${varName} in range(${f}, ${t} + 1):\n${body}`;
  };

  pythonGenerator.forBlock['saci_controls_forEach'] = (block, gen) => {
    const varName = gen.getVariableName(block.getFieldValue('VAR'));
    const list = gen.valueToCode(block, 'LIST', Order.RELATIONAL) || '[]';
    let body = gen.statementToCode(block, 'DO');
    body = gen.addLoopTrap(body, block) || PASS;
    return `for ${varName} in ${list}:\n${body}`;
  };

  pythonGenerator.forBlock['saci_controls_flow_statements'] = (block, _gen) => {
    switch (block.getFieldValue('FLOW')) {
      case 'BREAK':    return 'break\n';
      case 'CONTINUE': return 'continue\n';
    }
    throw new Error('Unknown flow statement.');
  };

  pythonGenerator.forBlock['saci_lists_length'] = (block, gen) => {
    const value = gen.valueToCode(block, 'VALUE', Order.NONE) || '[]';
    return [`len(${value})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_lists_indexOf'] = (block, gen) => {
    const find  = gen.valueToCode(block, 'FIND',  Order.NONE) || "''";
    const value = gen.valueToCode(block, 'VALUE', Order.NONE) || '[]';
    const fn = gen.provideFunction_('first_index', [
      'def first_index(my_list, elem):',
      '  try: index = my_list.index(elem)',
      '  except: index = -1',
      '  return index',
    ]);
    return [`${fn}(${value}, ${find})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_lists_sort'] = (block, gen) => {
    const list = gen.valueToCode(block, 'LIST', Order.NONE) || '[]';
    const fn = gen.provideFunction_('lists_sort', [
      'def lists_sort(my_list):',
      '  list_cpy = list(my_list)',
      '  list_cpy.sort()',
      '  return list_cpy',
    ]);
    return [`${fn}(${list})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['saci_lists_append'] = (block, gen) => {
    const list  = gen.valueToCode(block, 'LIST',  Order.MEMBER) || '[]';
    const value = gen.valueToCode(block, 'VALUE', Order.NONE)   || 'None';
    return `${list}.append(${value})\n`;
  };

  pythonGenerator.forBlock['saci_lists_getIndex'] = (block, gen) => {
    const list  = gen.valueToCode(block, 'LIST',  Order.MEMBER) || '[]';
    const index = gen.valueToCode(block, 'INDEX', Order.NONE)   || '0';
    return [`${list}[${index}]`, Order.MEMBER];
  };

  pythonGenerator.forBlock['saci_lists_setIndex'] = (block, gen) => {
    const list  = gen.valueToCode(block, 'LIST',  Order.MEMBER) || '[]';
    const index = gen.valueToCode(block, 'INDEX', Order.NONE)   || '0';
    const value = gen.valueToCode(block, 'VALUE', Order.NONE)   || 'None';
    return `${list}[${index}] = ${value}\n`;
  };
}

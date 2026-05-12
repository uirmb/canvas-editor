import type { IElement } from '../../interface/Element'
import type { IRangeStyle } from '../../interface/Listener'
import type {
  WordToolbarAction,
  WordToolbarControllerOptions,
  WordToolbarEditorLike,
  WordToolbarListPayload,
  WordToolbarState,
  WordToolbarTablePayload
} from './types'

const DEFAULT_TOOLBAR_STATE: WordToolbarState = {
  undo: false,
  redo: false,
  painter: false,
  font: '',
  size: 0,
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  color: null,
  highlight: null,
  rowFlex: null,
  rowMargin: 0,
  level: null,
  listType: null,
  listStyle: null
}

type CommandHost = Record<string, unknown>

type CommandMethod = (...args: never[]) => unknown

function isCommandMethod(value: unknown): value is CommandMethod {
  return typeof value === 'function'
}

function toToolbarState(rangeStyle: IRangeStyle): WordToolbarState {
  return {
    undo: rangeStyle.undo,
    redo: rangeStyle.redo,
    painter: rangeStyle.painter,
    font: rangeStyle.font,
    size: rangeStyle.size,
    bold: rangeStyle.bold,
    italic: rangeStyle.italic,
    underline: rangeStyle.underline,
    strikeout: rangeStyle.strikeout,
    color: rangeStyle.color,
    highlight: rangeStyle.highlight,
    rowFlex: rangeStyle.rowFlex,
    rowMargin: rangeStyle.rowMargin,
    level: rangeStyle.level,
    listType: rangeStyle.listType,
    listStyle: rangeStyle.listStyle
  }
}

export class WordToolbarController {
  private readonly editor: WordToolbarEditorLike
  private readonly onStateChange?: (state: WordToolbarState) => void
  private readonly originalRangeStyleChange?: (payload: IRangeStyle) => void
  private state: WordToolbarState

  constructor(
    editor: WordToolbarEditorLike,
    options: WordToolbarControllerOptions = {}
  ) {
    this.editor = editor
    this.onStateChange = options.onStateChange
    this.state = options.initialRangeStyle
      ? toToolbarState(options.initialRangeStyle)
      : { ...DEFAULT_TOOLBAR_STATE }
    this.originalRangeStyleChange =
      editor.listener?.rangeStyleChange || undefined

    if (options.autoBindRangeStyleChange !== false && editor.listener) {
      editor.listener.rangeStyleChange = payload => {
        this.updateState(payload)
        this.originalRangeStyleChange?.(payload)
      }
    }
  }

  public getState(): WordToolbarState {
    return { ...this.state }
  }

  public updateState(rangeStyle: IRangeStyle): WordToolbarState {
    this.state = toToolbarState(rangeStyle)
    this.onStateChange?.(this.getState())
    return this.getState()
  }

  public run(action: WordToolbarAction): void {
    const commandMap: Record<WordToolbarAction, string> = {
      undo: 'executeUndo',
      redo: 'executeRedo',
      clearFormat: 'executeFormat',
      bold: 'executeBold',
      italic: 'executeItalic',
      underline: 'executeUnderline',
      strikeout: 'executeStrikeout',
      superscript: 'executeSuperscript',
      subscript: 'executeSubscript',
      selectAll: 'executeSelectAll'
    }
    this.call(commandMap[action])
  }

  public setFont(font: string): void {
    this.call('executeFont', font)
  }

  public setSize(size: number): void {
    this.call('executeSize', size)
  }

  public setColor(color: string | null): void {
    this.call('executeColor', color)
  }

  public setHighlight(color: string | null): void {
    this.call('executeHighlight', color)
  }

  public setTitle(level: number | null): void {
    this.call('executeTitle', level)
  }

  public setRowFlex(rowFlex: unknown): void {
    this.call('executeRowFlex', rowFlex)
  }

  public setRowMargin(rowMargin: number): void {
    this.call('executeRowMargin', rowMargin)
  }

  public setList(payload: WordToolbarListPayload): void {
    this.call('executeList', payload.type, payload.style)
  }

  public insertTable(payload: WordToolbarTablePayload): void {
    this.call('executeInsertTable', payload.row, payload.col)
  }

  public insertImage(payload: string | IElement): void {
    this.call('executeImage', payload)
  }

  public insertHyperlink(payload: unknown): void {
    this.call('executeHyperlink', payload)
  }

  public insertPageBreak(): void {
    this.call('executePageBreak')
  }

  public print(): void {
    this.call('executePrint')
  }

  public destroy(): void {
    if (this.editor.listener) {
      this.editor.listener.rangeStyleChange = this.originalRangeStyleChange || null
    }
  }

  private call(methodName: string, ...args: unknown[]): void {
    const command = this.editor.command as CommandHost
    const method = command[methodName]
    if (!isCommandMethod(method)) {
      return
    }
    method(...(args as never[]))
  }
}

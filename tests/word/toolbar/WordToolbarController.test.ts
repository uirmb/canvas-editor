import { describe, expect, it, vi } from 'vitest'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
import { TitleLevel } from '../../../src/editor/dataset/enum/Title'
import { ListStyle, ListType } from '../../../src/editor/dataset/enum/List'
import type { IRangeStyle } from '../../../src/editor/interface/Listener'
import { WordToolbarController } from '../../../src/editor/word/toolbar'
import type { WordToolbarEditorLike } from '../../../src/editor/word/toolbar'

function createRangeStyle(): IRangeStyle {
  return {
    type: null,
    undo: true,
    redo: false,
    painter: false,
    font: 'Arial',
    size: 16,
    bold: true,
    italic: false,
    underline: true,
    strikeout: false,
    color: '#111111',
    highlight: null,
    rowFlex: RowFlex.CENTER,
    rowMargin: 1,
    dashArray: [],
    level: TitleLevel.FIRST,
    listType: ListType.UL,
    listStyle: ListStyle.DISC,
    groupIds: null,
    textDecoration: null
  }
}

function createEditor(): WordToolbarEditorLike & {
  command: Record<string, ReturnType<typeof vi.fn>>
} {
  return {
    listener: {
      rangeStyleChange: null
    },
    command: {
      executeUndo: vi.fn(),
      executeRedo: vi.fn(),
      executeFormat: vi.fn(),
      executeBold: vi.fn(),
      executeItalic: vi.fn(),
      executeUnderline: vi.fn(),
      executeStrikeout: vi.fn(),
      executeSuperscript: vi.fn(),
      executeSubscript: vi.fn(),
      executeSelectAll: vi.fn(),
      executeFont: vi.fn(),
      executeSize: vi.fn(),
      executeColor: vi.fn(),
      executeHighlight: vi.fn(),
      executeTitle: vi.fn(),
      executeRowFlex: vi.fn(),
      executeRowMargin: vi.fn(),
      executeList: vi.fn(),
      executeInsertTable: vi.fn(),
      executeImage: vi.fn(),
      executeHyperlink: vi.fn(),
      executePageBreak: vi.fn(),
      executePrint: vi.fn()
    }
  }
}

describe('WordToolbarController', () => {
  it('syncs toolbar state from range style changes', () => {
    const editor = createEditor()
    const onStateChange = vi.fn()
    const controller = new WordToolbarController(editor, { onStateChange })

    editor.listener?.rangeStyleChange?.(createRangeStyle())

    expect(controller.getState().font).toBe('Arial')
    expect(controller.getState().bold).toBe(true)
    expect(controller.getState().level).toBe(TitleLevel.FIRST)
    expect(onStateChange).toHaveBeenCalledWith(controller.getState())
  })

  it('runs common toolbar actions', () => {
    const editor = createEditor()
    const controller = new WordToolbarController(editor)

    controller.run('bold')
    controller.run('italic')
    controller.run('clearFormat')
    controller.run('undo')
    controller.run('redo')

    expect(editor.command.executeBold).toHaveBeenCalled()
    expect(editor.command.executeItalic).toHaveBeenCalled()
    expect(editor.command.executeFormat).toHaveBeenCalled()
    expect(editor.command.executeUndo).toHaveBeenCalled()
    expect(editor.command.executeRedo).toHaveBeenCalled()
  })

  it('forwards formatting commands with payloads', () => {
    const editor = createEditor()
    const controller = new WordToolbarController(editor)

    controller.setFont('SimSun')
    controller.setSize(18)
    controller.setColor('#ff0000')
    controller.setHighlight('#ffff00')
    controller.setTitle(TitleLevel.SECOND)
    controller.setRowFlex(RowFlex.RIGHT)
    controller.setRowMargin(2)
    controller.setList({ type: ListType.OL, style: ListStyle.DECIMAL })

    expect(editor.command.executeFont).toHaveBeenCalledWith('SimSun')
    expect(editor.command.executeSize).toHaveBeenCalledWith(18)
    expect(editor.command.executeColor).toHaveBeenCalledWith('#ff0000')
    expect(editor.command.executeHighlight).toHaveBeenCalledWith('#ffff00')
    expect(editor.command.executeTitle).toHaveBeenCalledWith(TitleLevel.SECOND)
    expect(editor.command.executeRowFlex).toHaveBeenCalledWith(RowFlex.RIGHT)
    expect(editor.command.executeRowMargin).toHaveBeenCalledWith(2)
    expect(editor.command.executeList).toHaveBeenCalledWith(
      ListType.OL,
      ListStyle.DECIMAL
    )
  })

  it('forwards insert and print commands', () => {
    const editor = createEditor()
    const controller = new WordToolbarController(editor)

    controller.insertTable({ row: 2, col: 3 })
    controller.insertImage('data:image/png;base64,xxx')
    controller.insertHyperlink({ url: 'https://example.com' })
    controller.insertPageBreak()
    controller.print()

    expect(editor.command.executeInsertTable).toHaveBeenCalledWith(2, 3)
    expect(editor.command.executeImage).toHaveBeenCalledWith(
      'data:image/png;base64,xxx'
    )
    expect(editor.command.executeHyperlink).toHaveBeenCalledWith({
      url: 'https://example.com'
    })
    expect(editor.command.executePageBreak).toHaveBeenCalled()
    expect(editor.command.executePrint).toHaveBeenCalled()
  })

  it('restores original range style listener on destroy', () => {
    const editor = createEditor()
    const originalRangeStyleChange = vi.fn()
    editor.listener!.rangeStyleChange = originalRangeStyleChange

    const controller = new WordToolbarController(editor)
    expect(editor.listener!.rangeStyleChange).not.toBe(originalRangeStyleChange)

    controller.destroy()

    expect(editor.listener!.rangeStyleChange).toBe(originalRangeStyleChange)
  })
})

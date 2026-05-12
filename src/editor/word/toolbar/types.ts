import type { ListStyle, ListType } from '../../dataset/enum/List'
import type { RowFlex } from '../../dataset/enum/Row'
import type { TitleLevel } from '../../dataset/enum/Title'
import type {
  INumberingProperties,
  IParagraphProperties
} from '../../interface/Element'
import type { IRangeStyle } from '../../interface/Listener'

export type WordToolbarStateChange = (state: WordToolbarState) => void

export type WordToolbarAction =
  | 'undo'
  | 'redo'
  | 'clearFormat'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeout'
  | 'superscript'
  | 'subscript'
  | 'selectAll'

export interface WordToolbarEditorLike {
  command: object
  listener?: {
    rangeStyleChange: ((payload: IRangeStyle) => void) | null
  }
}

export interface WordToolbarControllerOptions {
  autoBindRangeStyleChange?: boolean
  initialRangeStyle?: IRangeStyle
  onStateChange?: WordToolbarStateChange
}

export interface WordToolbarState {
  undo: boolean
  redo: boolean
  painter: boolean
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikeout: boolean
  color: string | null
  highlight: string | null
  rowFlex: RowFlex | null
  rowMargin: number
  level: TitleLevel | null
  listType: ListType | null
  listStyle: ListStyle | null
}

export interface WordToolbarListPayload {
  type: ListType | null
  style?: ListStyle
}

export interface WordToolbarTablePayload {
  row: number
  col: number
}

export type WordToolbarParagraphPayload = IParagraphProperties

export type WordToolbarNumberingPayload = INumberingProperties | null

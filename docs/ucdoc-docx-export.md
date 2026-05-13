# UcDoc 与 DOCX 导出阶段总结

本文档总结当前 `canvas-editor` 在 UcDoc 原生 JSON 文档格式、在线文档外壳、工具栏控制层，以及 DOCX 导出方面已经完成的阶段能力，并给出基础使用链路。

## 1. 阶段目标

当前阶段的目标不是实现一个完整的 Word 兼容器，而是把 `canvas-editor` 扩展为一个可落地的在线文档编辑底座：

- 以 UcDoc JSON 作为在线文档原生格式。
- 业务系统保存和打开 UcDoc，而不是强依赖 docx 作为源格式。
- 用户可以从 UcDoc 导出 docx 文件。
- 覆盖 Word 常用场景：文本、段落、样式、表格、图片、列表、页眉页脚、超链接。
- 不强求完整导入 docx，也不强求 100% 兼容 Word 所有高级格式。

## 2. 已完成能力

### 2.1 UcDoc 原生文档格式

已新增 `UcDocFile` 作为在线文档的原生 JSON 格式，包含：

- `format` / `version`
- `metadata`
- `page`
- `styles`
- `data`
- `options`
- `assets`
- `extensions`

相关入口：

```ts
import {
  createUcDocFile,
  createUcDocFileByEditorResult,
  getEditorResultFromUcDocFile,
  migrateUcDocFile,
  isUcDocFile
} from '@hufe921/canvas-editor'
```

### 2.2 UcDocEditorShell

已新增 `UcDocEditorShell`，用于把现有 editor 实例包装成文档级 API：

- `openUcDoc(doc)`
- `getUcDoc()`
- `getUcDocAsync()`
- `saveUcDoc()`
- `isDirty()`
- `markDirty()`
- `setReadonly()`
- `getHTML()`
- `getText()`
- `print()`

相关入口：

```ts
import { UcDocEditorShell } from '@hufe921/canvas-editor'
```

### 2.3 WordToolbarController

已新增无 UI 框架依赖的工具栏控制层：

- 同步选区样式状态。
- 转发常用格式命令。
- 支持字体、字号、颜色、高亮、标题、对齐、行距、列表、表格、图片、超链接、分页符等入口。
- 适合接入 React、Vue、Lit/Web Components 或任意业务 UI。

相关入口：

```ts
import { WordToolbarController } from '@hufe921/canvas-editor'
```

### 2.4 Word 常用模型增强

已在 UcDoc 和元素模型中补充：

- 段落属性：对齐、缩进、段前段后、行距、制表位、分页前、同段保持等。
- 样式 ID：`styleId`、`characterStyleId`。
- 多级编号：`numbering`。
- 页面配置：纸张大小、方向、页边距、页眉页脚距离。
- 表格属性：表格样式、宽度、布局、单元格边距、表头重复等。
- 图片属性：资产 ID、环绕类型、替代文本、题注、锁定比例。

相关 helper：

```ts
import {
  applyParagraphProperties,
  clearParagraphProperties,
  applyParagraphStyle,
  applyCharacterStyle,
  applyNumberingProperties,
  createPageSettings,
  toLandscapePageSettings,
  toPortraitPageSettings,
  createImageAsset,
  addImageAsset,
  removeImageAsset,
  applyTableProperties,
  clearTableProperties,
  applyTableCellProperties,
  clearTableCellProperties,
  applyImageProperties,
  clearImageProperties
} from '@hufe921/canvas-editor'
```

### 2.5 DOCX 导出

已新增 `exportUcDocToDocx`，从 UcDoc 生成 docx 包数据。

相关入口：

```ts
import {
  exportUcDocToDocx,
  createDocxBlob,
  createDocxObjectUrl,
  revokeDocxObjectUrl
} from '@hufe921/canvas-editor'
```

当前 DOCX 导出覆盖：

- 基础文本段落。
- 字符样式：加粗、斜体、下划线、删除线、字体、字号、颜色、高亮、字符样式。
- 段落属性：样式、对齐、缩进、段落间距、行距。
- 页面设置：纸张大小、方向、页边距、页眉页脚距离。
- 分页符。
- 表格：列宽、默认边框、表头行、单元格宽度、背景、垂直对齐、colspan、rowspan/vMerge。
- 图片：base64 图片资源、media 文件、relationships、inline DrawingML、宽高、altText、caption。
- 编号/列表：显式 `numbering` 模型和旧 `listType/listStyle/listId`。
- 页眉页脚。
- 外部超链接。
- 动态 paragraph styles。

## 3. 基础使用链路

### 3.1 创建 editor 和 shell

```ts
import Editor, {
  UcDocEditorShell,
  createUcDocFile,
  exportUcDocToDocx,
  createDocxBlob
} from '@hufe921/canvas-editor'

const container = document.querySelector<HTMLDivElement>('#editor')!

const editor = new Editor(
  container,
  {
    header: [],
    main: [
      {
        value: 'Hello UcDoc'
      }
    ],
    footer: []
  },
  {}
)

const shell = new UcDocEditorShell(editor, {
  onDirtyChange(dirty) {
    console.log('dirty:', dirty)
  },
  async onSave(doc) {
    localStorage.setItem('demo.ucdoc', JSON.stringify(doc))
  }
})
```

### 3.2 保存为 UcDoc JSON

```ts
const doc = await shell.saveUcDoc({
  metadata: {
    title: 'Demo Document'
  }
})

localStorage.setItem('demo.ucdoc', JSON.stringify(doc))
```

### 3.3 打开 UcDoc JSON

```ts
const json = localStorage.getItem('demo.ucdoc')

if (json) {
  shell.openUcDoc(JSON.parse(json), {
    applyOptions: true
  })
}
```

### 3.4 导出 DOCX

```ts
const doc = shell.getUcDoc({
  metadata: {
    title: 'Demo Document'
  }
})

const result = exportUcDocToDocx(doc, {
  fileName: 'Demo Document.docx'
})

const blob = createDocxBlob(result)
const url = URL.createObjectURL(blob)

const anchor = document.createElement('a')
anchor.href = url
anchor.download = result.fileName
anchor.click()

URL.revokeObjectURL(url)
```

## 4. UcDoc 示例结构

```ts
const doc = createUcDocFile({
  metadata: {
    title: 'Project Plan',
    author: 'uirmb'
  },
  page: {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 96,
      right: 96,
      bottom: 96,
      left: 96
    }
  },
  data: {
    header: [
      {
        value: 'Project Header'
      }
    ],
    main: [
      {
        value: 'Project Plan',
        styleId: 'title',
        paragraph: {
          styleId: 'title',
          align: 'center'
        }
      },
      {
        value: '\n'
      },
      {
        value: 'This document is saved as UcDoc JSON and exported as DOCX.'
      }
    ],
    footer: [
      {
        value: 'Project Footer'
      }
    ]
  }
})
```

## 5. 与业务系统集成建议

### 5.1 数据保存

业务系统建议把 UcDoc 作为源文件保存，例如：

```txt
/document/:id/content.ucdoc.json
```

或保存到数据库 JSON 字段、对象存储、网盘文件系统中。

推荐保存字段：

- `id`
- `title`
- `version`
- `content`，即 UcDoc JSON
- `updatedAt`
- `createdBy`
- `updatedBy`

### 5.2 文件导出

导出 DOCX 时，不建议把 docx 作为主存储格式，而是每次从 UcDoc 生成：

```txt
UcDoc JSON -> exportUcDocToDocx -> Blob / Uint8Array -> download / upload
```

这样可以保证在线编辑器内部模型稳定，也避免 docx 格式反复读写造成格式损失。

### 5.3 图片资源

图片建议保存两份信息：

- 元素中保存 `imageProperties.assetId`。
- `doc.assets.images[assetId]` 保存图片元信息和 base64 或业务 URL。

若业务系统使用对象存储，后续可把 `base64` 替换为可读 URL，并在导出时根据 URL 拉取图片二进制后写入 docx。

## 6. 当前限制

当前阶段尚未覆盖完整 Word 兼容能力，主要限制包括：

- DOCX 导入未实现。
- Word 高级样式、主题、字体表、复杂 section 尚未完整支持。
- 浮动图片、复杂环绕、图片裁剪还未完整导出。
- 页码、目录、脚注、批注、修订痕迹尚未实现。
- 复杂表格极端合并场景仍需更多兼容测试。
- 文档导出兼容性还需要在 Microsoft Word、WPS、LibreOffice 中做更多回归测试。

## 7. 建议后续里程碑

后续建议按以下方向推进：

1. 增加一个官方 demo 页面，展示保存、打开、导出流程。
2. 增加导出回归样例和快照测试。
3. 增强 styles.xml 动态生成能力。
4. 增强图片浮动/环绕导出。
5. 增强复杂表格合并导出。
6. 根据业务需求再考虑轻量 DOCX 导入。

## 8. 验证命令

```bash
pnpm run type:check
pnpm run test:unit -- tests/word/docx/export.test.ts tests/word/docx/table.test.ts tests/word/docx/image.test.ts tests/word/docx/numbering.test.ts tests/word/docx/quality.test.ts
```

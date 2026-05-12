import type { UcDocFile } from '../../ucdoc'
import { escapeXml } from './xml'
import { createDocumentXml, createFooterXml, createHeaderXml } from './document'
import {
  createImagePackageFiles,
  createImageRelationMap,
  createImageRelations
} from './media'
import {
  createNumberingDefinitions,
  createNumberingMap,
  createNumberingXml
} from './numbering'
import {
  createHyperlinkRelationMap,
  createHyperlinkRelations
} from './hyperlink'
import type {
  DocxHeaderFooterRelation,
  DocxHyperlinkRelation,
  DocxImageRelation,
  DocxPackageFile
} from './types'

function createHeaderFooterRelations(doc: UcDocFile): DocxHeaderFooterRelation[] {
  const relations: DocxHeaderFooterRelation[] = []
  if (doc.data.header?.length) {
    relations.push({
      type: 'header',
      relId: 'rIdHeader1',
      target: 'header1.xml',
      path: 'word/header1.xml'
    })
  }
  if (doc.data.footer?.length) {
    relations.push({
      type: 'footer',
      relId: 'rIdFooter1',
      target: 'footer1.xml',
      path: 'word/footer1.xml'
    })
  }
  return relations
}

export function createContentTypesXml(
  imageRelations: DocxImageRelation[] = [],
  hasNumbering = false,
  headerFooterRelations: DocxHeaderFooterRelation[] = []
): string {
  const imageDefaults = Array.from(
    new Map(
      imageRelations.map(relation => [relation.extension, relation.mimeType])
    ).entries()
  )
    .map(
      ([extension, mimeType]) =>
        `<Default Extension="${escapeXml(extension)}" ContentType="${escapeXml(mimeType)}"/>`
    )
    .join('')
  const numberingOverride = hasNumbering
    ? '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
    : ''
  const headerFooterOverrides = headerFooterRelations
    .map(relation =>
      relation.type === 'header'
        ? `<Override PartName="/${relation.path}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`
        : `<Override PartName="/${relation.path}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imageDefaults}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${numberingOverride}${headerFooterOverrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`
}

export function createRootRelsXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'
}

export function createDocumentRelsXml(
  imageRelations: DocxImageRelation[] = [],
  hasNumbering = false,
  hyperlinkRelations: DocxHyperlinkRelation[] = [],
  headerFooterRelations: DocxHeaderFooterRelation[] = []
): string {
  const imageRels = imageRelations
    .map(
      relation =>
        `<Relationship Id="${escapeXml(relation.relId)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${escapeXml(relation.target)}"/>`
    )
    .join('')
  const hyperlinkRels = hyperlinkRelations
    .map(
      relation =>
        `<Relationship Id="${escapeXml(relation.relId)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(relation.url)}" TargetMode="External"/>`
    )
    .join('')
  const headerFooterRels = headerFooterRelations
    .map(relation =>
      relation.type === 'header'
        ? `<Relationship Id="${relation.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="${relation.target}"/>`
        : `<Relationship Id="${relation.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="${relation.target}"/>`
    )
    .join('')
  const numberingRel = hasNumbering
    ? '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
    : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${numberingRel}${headerFooterRels}${imageRels}${hyperlinkRels}</Relationships>`
}

export function createStylesXml(doc?: UcDocFile): string {
  const paragraphStyles = doc?.styles?.paragraphStyles || {}
  const dynamicParagraphStyles = Object.entries(paragraphStyles)
    .map(([styleId, style]) => {
      const basedOn = style.basedOn
        ? `<w:basedOn w:val="${escapeXml(style.basedOn)}"/>`
        : ''
      return `<w:style w:type="paragraph"${styleId === 'normal' ? ' w:default="1"' : ''} w:styleId="${escapeXml(styleId)}"><w:name w:val="${escapeXml(style.name)}"/>${basedOn}</w:style>`
    })
    .join('')

  if (dynamicParagraphStyles) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${dynamicParagraphStyles}</w:styles>`
  }

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="title"><w:name w:val="Title"/><w:basedOn w:val="normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="48"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="normal"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="heading3"><w:name w:val="Heading 3"/><w:basedOn w:val="normal"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>'
}

export function createCorePropertiesXml(doc: UcDocFile): string {
  const title = escapeXml(doc.metadata.title || 'Untitled Document')
  const creator = escapeXml(doc.metadata.author || '')
  const created = doc.metadata.createdAt || new Date().toISOString()
  const modified = doc.metadata.updatedAt || created

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${title}</dc:title><dc:creator>${creator}</dc:creator><cp:lastModifiedBy>${creator}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${escapeXml(created)}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${escapeXml(modified)}</dcterms:modified></cp:coreProperties>`
}

export function createAppPropertiesXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>canvas-editor</Application></Properties>'
}

export function createDocxPackageFiles(doc: UcDocFile): DocxPackageFile[] {
  const imageRelations = createImageRelations(doc)
  const imageRelationMap = createImageRelationMap(imageRelations)
  const numberingDefinitions = createNumberingDefinitions(doc)
  const numberingMap = createNumberingMap(numberingDefinitions)
  const hyperlinkRelations = createHyperlinkRelations(doc)
  const hyperlinkRelationMap = createHyperlinkRelationMap(hyperlinkRelations)
  const headerFooterRelations = createHeaderFooterRelations(doc)
  const hasNumbering = numberingDefinitions.length > 0
  const renderContext = {
    imageRelations: imageRelationMap,
    numberingMap,
    hyperlinkRelations: hyperlinkRelationMap
  }

  return [
    {
      path: '[Content_Types].xml',
      content: createContentTypesXml(
        imageRelations,
        hasNumbering,
        headerFooterRelations
      )
    },
    {
      path: '_rels/.rels',
      content: createRootRelsXml()
    },
    {
      path: 'docProps/core.xml',
      content: createCorePropertiesXml(doc)
    },
    {
      path: 'docProps/app.xml',
      content: createAppPropertiesXml()
    },
    {
      path: 'word/_rels/document.xml.rels',
      content: createDocumentRelsXml(
        imageRelations,
        hasNumbering,
        hyperlinkRelations,
        headerFooterRelations
      )
    },
    {
      path: 'word/document.xml',
      content: createDocumentXml(
        doc,
        imageRelationMap,
        numberingMap,
        hyperlinkRelationMap,
        headerFooterRelations
      )
    },
    {
      path: 'word/styles.xml',
      content: createStylesXml(doc)
    },
    ...headerFooterRelations.map(relation => ({
      path: relation.path,
      content:
        relation.type === 'header'
          ? createHeaderXml(doc.data.header || [], renderContext)
          : createFooterXml(doc.data.footer || [], renderContext)
    })),
    ...(hasNumbering
      ? [
          {
            path: 'word/numbering.xml',
            content: createNumberingXml(numberingDefinitions)
          }
        ]
      : []),
    ...createImagePackageFiles(imageRelations)
  ]
}

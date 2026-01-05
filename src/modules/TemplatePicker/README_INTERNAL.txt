TemplatePicker module (isolated)

Files:
- useTemplateSelection.js: hook that holds the active template
- TemplateSelectorView.js: tabbed UI (Studio / Shop / Upload)
- StudioItems.js, ShopItems.js, UploadSection.js: internal tab contents

Usage:
import { TemplateSelectorView, useTemplateSelection } from '@/src/modules/TemplatePicker'
(or relative path)

const { selectedTemplate, selectTemplate } = useTemplateSelection();
<TemplateSelectorView onSelect={selectTemplate} currentId={selectedTemplate?.id} />

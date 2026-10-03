import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Editor } from '../editor/editor.tsx'
import { EditorStateProvider, bootstrapEditor, useEditorBootstrap } from '../editor/editor-state.tsx'
import { editorStore } from '../editor/editor-store.ts'
import { getEditor } from '../editor/editor.functions.ts'
import { canonicalFor, seo } from '../ui/seo.ts'

export const Route = createFileRoute('/edit')({
  // The filter to edit travels in the URL (plan C2Δ/C6Δ), so it survives refresh.
  validateSearch: z.object({ code: z.string().optional() }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    const data = await getEditor({ data: { code: deps.code } })
    // Client navigations: load the editor before it renders (no-op on the server).
    bootstrapEditor(data.code, data.filter, data.labels)
    return data
  },
  head: ({ matches, match }) =>
    seo({
      title: 'D4 Loot Filter Editor — Diablo IV',
      description:
        'Edit Diablo IV loot filter rules, tune conditions and affixes, and export base64 filter code ready to paste into the game.',
      canonical: canonicalFor(matches, match.pathname),
    }),
  component: EditPage,
})

function EditPage() {
  const { code, filter, error, labels } = Route.useLoaderData()
  // Full page loads: the client doesn't re-run the loader, so load here.
  useEditorBootstrap(code, filter, labels)

  // What the server renders and hydration matches. Without a code that's the
  // editor's starting state, which the server's store always holds (it's never
  // written there).
  const initial = { filter: filter ?? editorStore.getState().filter, labels }

  return (
    <EditorStateProvider initial={initial}>
      <Editor loadError={error} />
    </EditorStateProvider>
  )
}

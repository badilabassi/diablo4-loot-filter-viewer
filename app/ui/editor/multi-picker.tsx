import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { tocStore } from '../../state/toc-store.ts'
import { editorStore } from '../../state/editor-store.ts'
import { iconBtn } from '../styles.ts'

interface MultiPickerProps extends SerializableProps {
  ruleIndex: number
  condIndex: number
  field: 'affixIds' | 'subtypeIds' | 'itemIds' | 'talismanSetIds'
  kind: 'affix' | 'itemType' | 'item' | 'talismanSet'
  placeholder: string
  pillColor?: string
}

export const MultiPicker = clientEntry(
  import.meta.url,
  function MultiPicker(handle: Handle<MultiPickerProps>) {
    let open = false
    let query = ''

    type PickerItem = { id: number; label: string; sub?: string }

    function getItems(): PickerItem[] {
      const data = tocStore.getState().data
      if (!data) return []
      if (handle.props.kind === 'affix')
        return data.affixes.map((a) => ({ id: a.id, label: a.name, sub: a.cat }))
      if (handle.props.kind === 'itemType')
        return data.itemTypes.map((it) => ({ id: it.id, label: it.name }))
      if (handle.props.kind === 'talismanSet')
        return data.talismanSets.map((ts) => ({ id: ts.id, label: ts.name }))
      return data.items.map((it) => ({ id: it.id, label: it.name }))
    }

    function getSelected(): number[] {
      const cond =
        editorStore.getState().filter.rules[handle.props.ruleIndex]?.conditions[
          handle.props.condIndex
        ]
      return cond ? [...cond[handle.props.field]] : []
    }

    function setSelected(ids: number[]) {
      editorStore.updateCondition(handle.props.ruleIndex, handle.props.condIndex, {
        [handle.props.field]: ids,
      } as { affixIds: number[] })
    }

    return () => {
      const all = getItems()
      const sel = getSelected()
      const byId = new Map(all.map((x) => [x.id, x]))
      const filtered = all
        .filter((it) => !sel.includes(it.id))
        .filter((it) => !query || it.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 80)

      const listboxId = `picker-lb-${handle.props.ruleIndex}-${handle.props.condIndex}-${handle.props.field}`
      const searchId = `picker-search-${handle.props.ruleIndex}-${handle.props.condIndex}-${handle.props.field}`

      return (
        <div mix={[css({ display: 'flex', flexDirection: 'column', gap: '6px' })]}>
          {sel.length > 0 && (
            <div mix={[css({ display: 'flex', flexWrap: 'wrap', gap: '4px' })]}>
              {sel.map((id) => {
                const item = byId.get(id) ?? { id, label: `0x${id.toString(16).toUpperCase()}` }
                return (
                  <span
                    key={id}
                    mix={[css({
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--d4-border2)',
                      fontSize: '12px',
                    })]}
                    style={
                      handle.props.pillColor
                        ? {
                            color: handle.props.pillColor,
                            borderColor: `${handle.props.pillColor}55`,
                            background: `${handle.props.pillColor}10`,
                          }
                        : { background: 'var(--d4-bg)', color: 'var(--d4-text2)' }
                    }
                  >
                    {item.label}
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      mix={[
                        iconBtn,
                        css({ minWidth: '32px', minHeight: '32px', padding: '4px' }),
                        on('click', () => setSelected(sel.filter((x) => x !== id))),
                      ]}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-label={handle.props.placeholder}
            mix={[
              css({
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--d4-border)',
                background: 'var(--d4-bg)',
                fontSize: '12px',
                color: 'var(--d4-text3)',
                cursor: 'pointer',
              }),
              on('click', async () => {
                open = !open
                await handle.update()
                if (open) requestAnimationFrame(() => document.getElementById(searchId)?.focus())
              }),
            ]}
          >
            <span>{handle.props.placeholder}</span>
            <span aria-hidden="true">▼</span>
          </button>

          {open && (
            <div
              id={listboxId}
              role="listbox"
              aria-label={handle.props.placeholder}
              mix={[css({
                border: '1px solid var(--d4-border)',
                borderRadius: '6px',
                background: 'var(--d4-bg2)',
                padding: '8px',
                maxHeight: '240px',
                overflow: 'auto',
              }), on('keydown', (e) => {
                if ((e as KeyboardEvent).key === 'Escape') {
                  open = false
                  void handle.update()
                }
              })]}
            >
              <input
                id={searchId}
                type="search"
                placeholder={handle.props.placeholder}
                aria-label={`Search ${handle.props.placeholder}`}
                value={query}
                mix={[css({
                  width: '100%',
                  marginBottom: '8px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--d4-border)',
                  background: 'var(--d4-bg)',
                  color: 'var(--d4-text2)',
                }), on('input', async (e) => {
                  query = (e.target as HTMLInputElement).value
                  await handle.update()
                })]}
              />
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  mix={[css({
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    border: 0,
                    background: 'transparent',
                    color: 'var(--d4-text2)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    '&:hover': { background: 'rgba(175,135,50,0.1)' },
                  }), on('click', async () => {
                    setSelected([...sel, item.id])
                    open = false
                    query = ''
                    await handle.update()
                  })]}
                >
                  <span>{item.label}</span>
                  {item.sub && <span style={{ color: 'var(--d4-text3)' }}>{item.sub}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }
  },
)

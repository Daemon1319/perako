import ConfirmDeleteDialog from './ConfirmDeleteDialog'

export default function DiscardChangesDialog({ guard }) {
  if (!guard.open) return null
  return <ConfirmDeleteDialog title="Discard changes?" cancelLabel="Keep editing" confirmLabel="Discard changes" onCancel={guard.cancel} onConfirm={guard.discard}>
    <p>Your changes have not been saved. Discard them to continue?</p>
  </ConfirmDeleteDialog>
}

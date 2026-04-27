# Dialog Accessibility Guide

## DialogTitle Requirement

All `DialogContent` components **must** include a `DialogTitle` for screen reader accessibility. This is enforced by Radix UI.

## Correct Usage

### 1. Visible DialogTitle (Recommended)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Your Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### 2. Hidden DialogTitle (When No Visual Title Needed)

If you need to hide the title visually but maintain accessibility:

```tsx
import { Dialog, DialogContent, DialogTitle, VisuallyHidden } from './components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <VisuallyHidden>
      <DialogTitle>Descriptive title for screen readers</DialogTitle>
    </VisuallyHidden>
    {/* Dialog content without visible title */}
  </DialogContent>
</Dialog>
```

## Common Patterns

### Modal Form with Title

```tsx
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Tambah Item Baru</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog

```tsx
<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Konfirmasi Hapus</DialogTitle>
      <DialogDescription>
        Apakah Anda yakin ingin menghapus data ini?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Batal
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Hapus
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Image Preview Dialog (Hidden Title)

```tsx
<Dialog open={showPreview} onOpenChange={setShowPreview}>
  <DialogContent className="max-w-4xl">
    <VisuallyHidden>
      <DialogTitle>Image Preview</DialogTitle>
    </VisuallyHidden>
    <img src={imageUrl} alt="Preview" className="w-full" />
  </DialogContent>
</Dialog>
```

## Why This Matters

1. **Screen Reader Accessibility**: Users with visual impairments rely on screen readers to navigate dialogs
2. **WCAG Compliance**: Required for web accessibility standards (WCAG 2.1)
3. **Better UX**: Provides context for all users, not just those with assistive technology

## Troubleshooting

### Error: DialogContent requires DialogTitle

**Problem**: Radix UI warning in console

**Solution**: Ensure every `DialogContent` has a `DialogTitle` (visible or wrapped in `VisuallyHidden`)

```tsx
// ❌ WRONG - Missing DialogTitle
<DialogContent>
  <p>Some content</p>
</DialogContent>

// ✅ CORRECT - Has DialogTitle
<DialogContent>
  <DialogHeader>
    <DialogTitle>Dialog Title</DialogTitle>
  </DialogHeader>
  <p>Some content</p>
</DialogContent>

// ✅ ALSO CORRECT - Hidden DialogTitle
<DialogContent>
  <VisuallyHidden>
    <DialogTitle>Dialog Title</DialogTitle>
  </VisuallyHidden>
  <p>Some content</p>
</DialogContent>
```

## References

- [Radix UI Dialog Documentation](https://radix-ui.com/primitives/docs/components/dialog)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

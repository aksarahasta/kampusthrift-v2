'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  closeDisabled?: boolean
}

export function Modal({ open, onClose, title, children, className, closeDisabled = false }: ModalProps) {
  const opener = useRef<HTMLElement | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !closeDisabled) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={cn('modal-content', className)}
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => { if (closeDisabled) event.preventDefault() }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null }}
          onCloseAutoFocus={(event) => {
            // Existing callers use their own buttons, not Radix Dialog.Trigger.
            event.preventDefault()
            if (opener.current?.isConnected) opener.current.focus()
          }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

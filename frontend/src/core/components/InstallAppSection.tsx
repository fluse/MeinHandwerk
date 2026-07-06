import { useState } from 'react'
import { Share, SquarePlus, Smartphone } from 'lucide-react'
import { Button } from './Button'
import { Overlay } from './Overlay'
import { useInstallPrompt } from '@/core/hooks/useInstallPrompt'

function IosInstallDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <h2 className="text-base font-semibold text-ink">App installieren</h2>
      <p className="mt-2 text-sm text-muted">
        Auf dem iPhone/iPad lässt sich die App nur manuell zum Home-Bildschirm hinzufügen:
      </p>
      <ol className="mt-3 flex flex-col gap-3 text-sm text-ink">
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-page">
            <Share size={16} className="text-sage-deep" />
          </span>
          Auf das Teilen-Symbol in der Safari-Menüleiste tippen
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-page">
            <SquarePlus size={16} className="text-sage-deep" />
          </span>
          „Zum Home-Bildschirm“ auswählen
        </li>
      </ol>
      <div className="mt-5 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Verstanden
        </Button>
      </div>
    </Overlay>
  )
}

/** Zeigt einen "App installieren"-Button, sobald die Plattform das unterstützt.
 * Android/Chrome: löst den nativen Install-Dialog aus. iOS: zeigt eine Anleitung,
 * da Safari keinen programmatischen Install-Prompt anbietet. Ist die App bereits
 * installiert (Standalone-Modus), wird nichts angezeigt. */
export function InstallAppSection() {
  const { installed, canPrompt, canPromptIos, promptInstall } = useInstallPrompt()
  const [showIosDialog, setShowIosDialog] = useState(false)

  if (installed || (!canPrompt && !canPromptIos)) return null

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-semibold text-ink">App installieren</p>
        <p className="text-xs text-muted">Als App auf dem Homescreen hinzufügen</p>
      </div>
      <Button
        variant="secondary"
        onClick={canPrompt ? promptInstall : () => setShowIosDialog(true)}
      >
        <Smartphone size={16} className="mr-1.5 inline-block align-text-bottom" />
        Installieren
      </Button>
      <IosInstallDialog open={showIosDialog} onClose={() => setShowIosDialog(false)} />
    </div>
  )
}

import { ShieldCheck, SlidersHorizontal, Sparkles, UserCircle2 } from 'lucide-react'

const settingCards = [
  {
    title: 'Profile',
    description: 'Update account details and display preferences.',
    icon: UserCircle2,
  },
  {
    title: 'Security',
    description: 'JWT session handling, password changes, and device sessions.',
    icon: ShieldCheck,
  },
  {
    title: 'Experience',
    description: 'Glass theme, motion, and portfolio visibility preferences.',
    icon: Sparkles,
  },
  {
    title: 'Analytics',
    description: 'Portfolio alerts, refresh cadence, and market overview defaults.',
    icon: SlidersHorizontal,
  },
]

export default function Settings() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-secondary">Control center</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            A premium settings shell for profile, security, and experience controls.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingCards.map(({ title, description, icon: Icon }) => (
          <section key={title} className="glass-panel rounded-3xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,212,170,0.14)] bg-[rgba(0,212,170,0.06)] text-accent">
              <Icon size={20} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
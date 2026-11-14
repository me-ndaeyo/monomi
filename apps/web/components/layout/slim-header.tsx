import Wordmark from "@/components/ui/wordmark"

export default function SlimHeader({ tone, action }: Readonly<{ tone: "light" | "dark"; action: React.ReactNode }>) {
  return (
    <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5">
      <Wordmark tone={tone} />
      {action}
    </header>
  )
}

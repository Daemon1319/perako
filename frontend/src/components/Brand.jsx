import { ArrowUpRight } from 'lucide-react'

export default function Brand({ large = false }) {
  return (
    <div className={`inline-flex items-center ${large ? 'gap-3' : 'gap-2.5'}`}>
      <span className={`brand-mark ${large ? 'size-12' : 'size-9'}`} aria-hidden="true">
        <ArrowUpRight size={large ? 29 : 23} strokeWidth={2.7} />
      </span>
      <span className={`${large ? 'text-3xl' : 'text-[25px]'} font-bold tracking-[-0.065em]`}>
        perako<span className="text-teal-600">.</span>
      </span>
    </div>
  )
}

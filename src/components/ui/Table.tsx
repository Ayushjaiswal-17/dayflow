import type { ReactNode } from 'react'

export function Table({ headers, children, caption }: { headers: string[]; children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="border-b border-ink-100 pb-3 pr-6 text-xs font-bold tracking-wide text-ink-500 uppercase last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-ink-100 py-3 pr-6 text-ink-700 last:pr-0 ${className ?? ''}`}>{children}</td>
}

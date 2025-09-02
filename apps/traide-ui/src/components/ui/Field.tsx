"use client"
import React, { useId } from 'react'

type Props = {
  label: string
  children: React.ReactElement
  id?: string
  className?: string
  dense?: boolean
}

export function Field({ label, children, id, className, dense = false }: Props) {
  const autoId = useId()
  const controlId = id || autoId
  const child = React.cloneElement(children, {
    id: controlId,
    'aria-labelledby': `${controlId}-label`,
  })
  return (
    <label className={(dense ? 'space-y-0.5' : 'space-y-1') + ' inline-flex flex-col ' + (className || '')}>
      <span id={`${controlId}-label`} className={(dense ? 'text-[10px]' : 'text-[11px]') + ' text-white/60'}>
        {label}
      </span>
      {child}
    </label>
  )
}


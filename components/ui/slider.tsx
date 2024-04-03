'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-slider'

const Slider = ({ ...props }: TooltipPrimitive.SliderProps) => (
  <TooltipPrimitive.Root
    className="relative flex h-9 w-full touch-none select-none items-center justify-center"
    {...props}
  >
    <TooltipPrimitive.Track className="bg-muted relative h-2 grow rounded-full">
      <TooltipPrimitive.Range className="bg-muted absolute h-full rounded-full" />
    </TooltipPrimitive.Track>
    <TooltipPrimitive.Thumb className="block size-5 cursor-pointer rounded-full bg-blue-600 shadow-sm" />
  </TooltipPrimitive.Root>
)

export { Slider }

'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-slider'

const Slider = ({ ...props }: TooltipPrimitive.SliderProps) => (
  <TooltipPrimitive.Root
    className="relative flex items-center justify-center select-none touch-none w-full h-9"
    {...props}
  >
    <TooltipPrimitive.Track className="bg-muted relative grow rounded-full h-2">
      <TooltipPrimitive.Range className="absolute bg-muted rounded-full h-full" />
    </TooltipPrimitive.Track>
    <TooltipPrimitive.Thumb className="block size-5 bg-blue-600 shadow-sm rounded-full cursor-pointer" />
  </TooltipPrimitive.Root>
)

export { Slider }

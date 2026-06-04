import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/shared/lib/utils'

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  ),
)
Command.displayName = 'Command'

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  ),
)
CommandList.displayName = 'CommandList'

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
)
CommandEmpty.displayName = 'CommandEmpty'

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode }
>(({ className, heading, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-foreground [&_[data-slot=command-group-heading]]:px-2 [&_[data-slot=command-group-heading]]:py-1.5 [&_[data-slot=command-group-heading]]:text-xs [&_[data-slot=command-group-heading]]:font-semibold [&_[data-slot=command-group-heading]]:text-muted-foreground/75 [&_[data-slot=command-group-heading]]:uppercase [&_[data-slot=command-group-heading]]:tracking-wider',
      className,
    )}
    {...props}
  >
    {heading && (
      <div data-slot="command-group-heading" className="mb-2">
        {heading}
      </div>
    )}
    <div className="space-y-1">{children}</div>
  </div>
))
CommandGroup.displayName = 'CommandGroup'

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'div'
    return (
      <Comp
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors duration-200',
          className,
        )}
        {...props}
      />
    )
  },
)
CommandItem.displayName = 'CommandItem'

const CommandSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 h-px bg-border', className)} {...props} />
  ),
)
CommandSeparator.displayName = 'CommandSeparator'

export { Command, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator }

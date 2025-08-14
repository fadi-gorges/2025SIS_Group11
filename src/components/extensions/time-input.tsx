import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const TimeInput = ({ className, ...props }: React.ComponentProps<'input'>) => {
  return (
    <Input
      {...props}
      type="time"
      className={cn(
        'bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
        className,
      )}
    />
  )
}

export default TimeInput

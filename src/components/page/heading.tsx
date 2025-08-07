import { cn } from '@/lib/utils'

type HeadingProps = {
  title: string
  description: string
} & React.ComponentProps<'div'>

const Heading = ({ title, description, className, ...props }: HeadingProps) => {
  return (
    <div className={cn(className)} {...props}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

export default Heading

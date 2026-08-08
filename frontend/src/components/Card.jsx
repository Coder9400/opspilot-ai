/**
 * Card – reusable surface container.
 *
 * Props:
 *  hover: bool – add hover lift effect
 *  className, children, ...rest
 */
export default function Card({ hover = false, className = '', children, ...rest }) {
  const cls = ['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

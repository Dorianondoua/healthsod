/**
 * Composant Badge pour afficher des statuts ou des catégories
 * @param {Object} props - Propriétés du badge
 * @param {string} props.variant - Style du badge (default, success, warning, danger)
 * @param {React.ReactNode} props.children - Contenu du badge
 */
interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "secondary"
  children: React.ReactNode
  className?: string
}

function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    secondary: "bg-gray-100 text-gray-800",
  }

  const classes = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`

  return <span className={classes}>{children}</span>
}

export default Badge

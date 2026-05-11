/**
 * Composant Button réutilisable
 * @param {Object} props - Propriétés du bouton
 * @param {string} props.variant - Style du bouton (primary, secondary, outline)
 * @param {string} props.size - Taille du bouton (sm, md, lg)
 * @param {React.ReactNode} props.children - Contenu du bouton
 * @param {string} props.className - Classes CSS additionnelles
 */
function Button({ variant = "primary", size = "md", children, className = "", ...props }) {
  // Styles de base selon la variante
  const baseStyles = "font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  }

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button

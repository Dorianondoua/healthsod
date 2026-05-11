/**
 * Composant Input réutilisable
 * @param {Object} props - Propriétés de l'input
 * @param {string} props.label - Label de l'input
 * @param {string} props.error - Message d'erreur
 * @param {string} props.className - Classes CSS additionnelles
 */
function Input({ label, error, className = "", ...props }) {
  return (
    <div className="space-y-1">
      {/* Label optionnel */}
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Champ input */}
      <input className={`input-field ${error ? "border-red-500 focus:ring-red-500" : ""} ${className}`} {...props} />

      {/* Message d'erreur */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default Input

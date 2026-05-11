import React, { ReactNode } from "react"

interface CardComponentProps {
  children: ReactNode
  className?: string
}

/**
 * Composant Card pour afficher du contenu dans un conteneur stylisé
 */
const Card: React.FC<CardComponentProps> & {
  Header: React.FC<CardComponentProps>
  Title: React.FC<CardComponentProps>
  Description: React.FC<CardComponentProps>
  Content: React.FC<CardComponentProps>
} = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

/**
 * En-tête de carte
 */
const CardHeader: React.FC<CardComponentProps> = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Titre de carte
 */
const CardTitle: React.FC<CardComponentProps> = ({ children, className = "" }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

/**
 * Description de carte
 */
const CardDescription: React.FC<CardComponentProps> = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  )
}

/**
 * Contenu de carte
 */
const CardContent: React.FC<CardComponentProps> = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

// Attachement des sous-composants à Card
Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent

export default Card

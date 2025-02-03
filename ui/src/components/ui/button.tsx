import * as React from "react"
import theme from "@/lib/theme"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "custom"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyle = {
      backgroundColor: theme.button.background,
      color: theme.button.text,
      border: `2px solid ${theme.button.border}`,
      outline: `2px solid ${theme.border.default}`,
      boxShadow: `0 0 0 2px ${theme.button.border}`,
      borderRadius: 0,
      padding: "0.5rem 1rem",
      cursor: "pointer",
      transition: "background-color 0.2s, color 0.2s",
      fontFamily: "var(--font-syne-mono-mono)",
    }

    const sizeStyles = {
      sm: { padding: "0.25rem 0.5rem", fontSize: "0.875rem" },
      default: { padding: "0.5rem 1rem", fontSize: "1rem" },
      lg: { padding: "0.75rem 1.5rem", fontSize: "1.125rem" },
      icon: { padding: "0.5rem", width: "2.5rem", height: "2.5rem" },
    }

    const variantStyles = {
      default: {},
      destructive: { backgroundColor: theme.error, color: theme.text.primary },
      outline: { backgroundColor: "transparent", color: theme.text.primary },
      secondary: { backgroundColor: theme.background.secondary, color: theme.text.primary },
      ghost: { backgroundColor: "transparent", border: "none", outline: "none", boxShadow: "none" },
      link: {
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
        boxShadow: "none",
        textDecoration: "underline",
      },
      custom: {
        backgroundColor: theme.button.background,
        color: theme.text.primary,
        border: `2px solid ${theme.button.border}`,
      },
    }

    const style = {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }

    return <button className={className} ref={ref} style={style} {...props} />
  },
)

Button.displayName = "Button"

export { Button }


"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Github, Linkedin, Mail, Twitter, Globe, FileText, Rss, Check, Copy } from "lucide-react"
import { useState } from "react"

interface SocialLinksProps {
  collapsed?: boolean
}

export function SocialLinks({ collapsed = false }: SocialLinksProps) {
  // State to track if email was copied
  const [emailCopied, setEmailCopied] = useState(false)
  // State to track if email is being hovered
  const [emailHovered, setEmailHovered] = useState(false)

  // Your email address
  const emailAddress = "xiaoquan0622@gmail.com"

  // Function to copy email to clipboard
  const copyEmailToClipboard = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(emailAddress)
    setEmailCopied(true)
  }

  // Function to handle mouse leave for email button
  const handleEmailMouseLeave = () => {
    setEmailHovered(false)
    if (emailCopied) {
      setEmailCopied(false)
    }
  }

  // Function to handle mouse enter for email button
  const handleEmailMouseEnter = () => {
    setEmailHovered(true)
  }

  // Determine which icon to show for email
  const getEmailIcon = () => {
    if (emailCopied) {
      return <Check className="h-4 w-4 text-green-500" />
    } else if (emailHovered) {
      return <Copy className="h-4 w-4" />
    } else {
      return <Mail className="h-4 w-4" />
    }
  }

  const links = [
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
      href: "https://www.linkedin.com/in/xiaoquan-zhao-b21a1633b/",
      color: "hover:text-blue-600",
      isEmail: false,
    },
    {
      name: "GitHub",
      icon: <Github className="h-4 w-4" />,
      href: "https://github.com/Xiaoquan006Zhao",
      color: "hover:text-gray-900 dark:hover:text-white",
      isEmail: false,
    },
    {
      name: emailCopied ? "Email Copied!" : emailAddress,
      icon: getEmailIcon(),
      href: "#",
      color: emailCopied ? "text-green-500" : "hover:text-red-500",
      isEmail: true,
      onClick: copyEmailToClipboard,
      onMouseLeave: handleEmailMouseLeave,
      onMouseEnter: handleEmailMouseEnter,
    },
  ]

  return (
    <TooltipProvider delayDuration={10}>
      <div className={`flex ${collapsed ? "flex-col" : "flex-wrap"} gap-1 justify-start p-2`}>
        {links.map((link) => (
          <Tooltip key={link.name}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${link.color} transition-colors`}
                onClick={link.onClick}
                onMouseLeave={link.onMouseLeave}
                onMouseEnter={link.onMouseEnter}
                asChild={!link.isEmail}
              >
                {link.isEmail ? (
                  <div className="flex items-center justify-center">{link.icon}</div>
                ) : (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
                    {link.icon}
                  </a>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "bottom"}>
              <p>{link.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}


"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Github, Linkedin, Mail, Twitter, Globe, FileText, Rss, Check, Copy,
  Facebook, Instagram, Youtube, Twitch, Dribbble, Figma 
} from "lucide-react"
import { siteConfig } from "@/personalize/config"

interface SocialLinksProps {
  collapsed?: boolean
}

interface SocialLinkProps {
  name: string
  icon: string
  url: string
}

export function SocialLinks({ collapsed = false }: SocialLinksProps) {
  // Don't render if socials are disabled
  if (!siteConfig.socials.show) return null;

  // State to track if email was copied
  const [emailCopied, setEmailCopied] = useState(false)
  // State to track if email is being hovered
  const [emailHovered, setEmailHovered] = useState(false)

  // Email address from config
  const emailAddress = siteConfig.socials.email

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

  // Find the appropriate icon component for a social link
  const getIconForSocial = (name: string, customIcon?: string) => {
    // If a custom icon is provided, use that
    if (customIcon) {
      switch (customIcon.toLowerCase()) {
        case 'github': return <Github className="h-4 w-4" />;
        case 'linkedin': return <Linkedin className="h-4 w-4" />;
        case 'twitter': return <Twitter className="h-4 w-4" />;
        case 'facebook': return <Facebook className="h-4 w-4" />;
        case 'instagram': return <Instagram className="h-4 w-4" />;
        case 'youtube': return <Youtube className="h-4 w-4" />;
        case 'twitch': return <Twitch className="h-4 w-4" />;
        case 'dribbble': return <Dribbble className="h-4 w-4" />;
        case 'figma': return <Figma className="h-4 w-4" />;
        case 'rss': return <Rss className="h-4 w-4" />;
        case 'file': case 'cv': case 'resume': return <FileText className="h-4 w-4" />;
        default: return <Globe className="h-4 w-4" />;
      }
    }
    
    // Try to auto-detect based on name
    const lowerName = name.toLowerCase();
    if (lowerName.includes('github')) return <Github className="h-4 w-4" />;
    if (lowerName.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    if (lowerName.includes('twitter')) return <Twitter className="h-4 w-4" />;
    if (lowerName.includes('facebook')) return <Facebook className="h-4 w-4" />;
    if (lowerName.includes('instagram')) return <Instagram className="h-4 w-4" />;
    if (lowerName.includes('youtube')) return <Youtube className="h-4 w-4" />;
    if (lowerName.includes('twitch')) return <Twitch className="h-4 w-4" />;
    if (lowerName.includes('dribbble')) return <Dribbble className="h-4 w-4" />;
    if (lowerName.includes('figma')) return <Figma className="h-4 w-4" />;
    if (lowerName.includes('rss')) return <Rss className="h-4 w-4" />;
    if (['cv', 'resume'].some(term => lowerName.includes(term))) return <FileText className="h-4 w-4" />;
    
    // Default fallback
    return <Globe className="h-4 w-4" />;
  }

  // Build links array including config-based social links and email
  const links = [
    // Map the social links from config
    ...siteConfig.socials.links.map(({name, icon, url}:SocialLinkProps) => ({
      name: name,
      icon: getIconForSocial(name, icon),
      href: url,
      color: "hover:text-gray-900 dark:hover:text-white",
      isEmail: false,
    })),
    
    // Add email if provided
    ...(emailAddress ? [{
      name: emailCopied ? "Email Copied!" : emailAddress,
      icon: getEmailIcon(),
      href: "#",
      color: emailCopied ? "text-green-500" : "hover:text-red-500",
      isEmail: true,
      onClick: copyEmailToClipboard,
      onMouseLeave: handleEmailMouseLeave,
      onMouseEnter: handleEmailMouseEnter,
    }] : [])
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
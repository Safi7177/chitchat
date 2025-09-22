import React, { useState } from "react";
import { Box, Avatar, Typography, IconButton, Tooltip } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IoMdCopy, IoMdCheckmark } from "react-icons/io";
import CodeExecutor from "./CodeExecutor";
import toast from "react-hot-toast";

function extractCodeFromString(message: any) {
  // Ensure we have a string to work with
  let stringMessage: string;
  
  if (typeof message === 'string') {
    stringMessage = message;
  } else if (message && typeof message === 'object') {
    // Try different possible properties
    if ('content' in message) {
      stringMessage = String(message.content);
    } else if ('text' in message) {
      stringMessage = String(message.text);
    } else if ('message' in message) {
      stringMessage = String(message.message);
    } else {
      // Try to stringify the object
      stringMessage = JSON.stringify(message);
    }
  } else {
    stringMessage = String(message);
  }
  
  if (stringMessage.includes("```")) {
    const blocks = stringMessage.split("```");
    return blocks;
  }
  return null;
}

function isCodeBlock(str: string) {
  if (
    str.includes("=") ||
    str.includes(";") ||
    str.includes("[") ||
    str.includes("]") ||
    str.includes("{") ||
    str.includes("}") ||
    str.includes("#") ||
    str.includes("//")
  ) {
    return true;
  }
  return false;
}

function isExecutableCode(str: string) {
  const trimmed = str.trim();
  
  // Check for HTML patterns first (more specific)
  const htmlPatterns = [
    /<html/i, /<head/i, /<body/i, /<div/i,
    /<p>/i, /<h[1-6]/i, /<script/i, /<style/i,
    /<img/i, /<a\s/i, /<button/i, /<input/i,
    /<form/i, /<table/i, /<ul/i, /<ol/i
  ];
  
  const hasHtmlPattern = htmlPatterns.some(pattern => pattern.test(trimmed));
  if (hasHtmlPattern) return true;
  
  // Check for JavaScript patterns (more specific)
  const jsPatterns = [
    /function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/,
    /var\s+\w+\s*=/, /console\.log/, /console\./,
    /alert\s*\(/, /if\s*\(/, /for\s*\(/, /while\s*\(/,
    /return\s+/, /=>/, /document\./, /window\./,
    /setTimeout/, /addEventListener/, /querySelector/
  ];
  
  const hasJsPattern = jsPatterns.some(pattern => pattern.test(trimmed));
  return hasJsPattern;
}

function getCodeLanguage(str: string) {
  const trimmed = str.trim();
  
  // Check for HTML patterns first
  const htmlPatterns = [
    /<html/i, /<head/i, /<body/i, /<div/i,
    /<p>/i, /<h[1-6]/i, /<script/i, /<style/i,
    /<img/i, /<a\s/i, /<button/i, /<input/i,
    /<form/i, /<table/i, /<ul/i, /<ol/i
  ];
  
  const hasHtmlPattern = htmlPatterns.some(pattern => pattern.test(trimmed));
  
  if (hasHtmlPattern) {
    return 'html';
  }
  
  return 'javascript';
}
const ChatItem = ({
  content,
  role,
}: {
  content: string;
  role: "user" | "assistant";
}) => {
  const messageBlocks = extractCodeFromString(content);
  const auth = useAuth();
  const { isDarkMode } = useTheme();
  const [copied, setCopied] = useState(false);
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState<Set<number>>(new Set());

  // Safety check for content
  if (!content) {
    console.warn("ChatItem: No content provided");
    return null;
  }

  // Debug logging
  console.log("ChatItem content type:", typeof content);
  console.log("ChatItem content value:", content);

  const cleanContent = (text: any) => {
    // Ensure we have a string to work with
    let stringContent: string;
    
    if (typeof text === 'string') {
      stringContent = text;
    } else if (text && typeof text === 'object') {
      // Try different possible properties
      if ('content' in text) {
        stringContent = String(text.content);
      } else if ('text' in text) {
        stringContent = String(text.text);
      } else if ('message' in text) {
        stringContent = String(text.message);
      } else {
        // Try to stringify the object
        stringContent = JSON.stringify(text);
      }
    } else {
      stringContent = String(text);
    }
    
    // Remove markdown formatting and extra characters
    return stringContent
      .replace(/\*\*/g, '') // Remove ** bold markers
      .replace(/\*/g, '') // Remove * italic markers
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/```[\s\S]*?```/g, (match) => {
        // Keep code blocks but clean them
        return match.replace(/```\w*\n?/, '```\n').replace(/\n?```$/, '\n```');
      })
      .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
      .trim();
  };

  const handleCopy = async (codeContent?: string, blockIndex?: number) => {
    try {
      // Ensure we have a string to copy
      let contentToCopy: string;
      
      if (codeContent) {
        contentToCopy = codeContent;
      } else {
        contentToCopy = cleanContent(content);
      }
      
      // Debug logging
      console.log("Copying content:", contentToCopy);
      console.log("Content type:", typeof contentToCopy);
      
      await navigator.clipboard.writeText(contentToCopy);
      
      if (codeContent && blockIndex !== undefined) {
        // Handle code block copy
        setCopiedCodeBlocks(prev => new Set(prev).add(blockIndex));
        toast.success("Code copied to clipboard!");
        setTimeout(() => {
          setCopiedCodeBlocks(prev => {
            const newSet = new Set(prev);
            newSet.delete(blockIndex);
            return newSet;
          });
        }, 2000);
      } else {
        // Handle message copy
        setCopied(true);
        toast.success("Message copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy message");
    }
  };
  return role == "assistant" ? (
    <Box
      sx={{
        display: "flex",
        p: 2,
        bgcolor: isDarkMode ? "#004d5612" : "#f0f0f0",
        gap: 2,
        borderRadius: 2,
        my: 1,
      }}
    >
        <Avatar sx={{ ml: "0" }}>
          <img src="cc-logo.svg" alt="cc-logo" width={"30px"} />
        </Avatar>
      <Box sx={{ flex: 1 }}>
        {!messageBlocks && (
          <Typography sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>{cleanContent(content)}</Typography>
        )}
        {messageBlocks &&
          messageBlocks.length &&
          messageBlocks.map((block, index) => {
            if (!block) return null;
            return isCodeBlock(block) ? (
              <Box key={index} sx={{ position: "relative", mb: 1 }}>
                <SyntaxHighlighter style={isDarkMode ? coldarkDark : oneLight} language="javascript">
                  {block}
                </SyntaxHighlighter>
                <Tooltip title={copiedCodeBlocks.has(index) ? "Copied!" : "Copy code"}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(block, index);
                    }}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: copiedCodeBlocks.has(index) ? "#4caf50" : isDarkMode ? "white" : "black",
                      backgroundColor: isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
                      border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
                      zIndex: 10,
                      "&:hover": {
                        color: isDarkMode ? "#00fffc" : "#1976d2",
                        backgroundColor: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,1)",
                      },
                    }}
                  >
                    {copiedCodeBlocks.has(index) ? <IoMdCheckmark /> : <IoMdCopy />}
                  </IconButton>
                </Tooltip>
                {/* Code Executor for JavaScript and HTML only */}
                {isExecutableCode(block) && (
                  <CodeExecutor code={block} language={getCodeLanguage(block)} />
                )}
              </Box>
            ) : (
              <Typography key={index} sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>{block}</Typography>
            );
          })}
      </Box>
      <Tooltip title={copied ? "Copied!" : "Copy message"}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          size="small"
          sx={{
            color: copied ? "#4caf50" : "gray",
            "&:hover": {
              color: "#00fffc",
            },
          }}
        >
          {copied ? <IoMdCheckmark /> : <IoMdCopy />}
        </IconButton>
      </Tooltip>
    </Box>
  ) : (
    <Box
      sx={{
        display: "flex",
        p: 2,
        bgcolor: isDarkMode ? "#004d56" : "#e3f2fd",
        gap: 2,
        borderRadius: 2,
      }}
    >
      <Avatar sx={{ ml: "0", bgcolor: "black", color: "white" }}>
        {auth?.user?.name?.[0] || "U"}
        {auth?.user?.name?.split(" ")?.[1]?.[0] || ""}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        {!messageBlocks && (
          <Typography sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>{cleanContent(content)}</Typography>
        )}
        {messageBlocks &&
          messageBlocks.length &&
          messageBlocks.map((block, index) => {
            if (!block) return null;
            return isCodeBlock(block) ? (
              <Box key={index} sx={{ position: "relative", mb: 1 }}>
                <SyntaxHighlighter style={isDarkMode ? coldarkDark : oneLight} language="javascript">
                  {block}
                </SyntaxHighlighter>
                <Tooltip title={copiedCodeBlocks.has(index) ? "Copied!" : "Copy code"}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(block, index);
                    }}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: copiedCodeBlocks.has(index) ? "#4caf50" : isDarkMode ? "white" : "black",
                      backgroundColor: isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
                      border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
                      zIndex: 10,
                      "&:hover": {
                        color: isDarkMode ? "#00fffc" : "#1976d2",
                        backgroundColor: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,1)",
                      },
                    }}
                  >
                    {copiedCodeBlocks.has(index) ? <IoMdCheckmark /> : <IoMdCopy />}
                  </IconButton>
                </Tooltip>
                {/* Code Executor for JavaScript and HTML only */}
                {isExecutableCode(block) && (
                  <CodeExecutor code={block} language={getCodeLanguage(block)} />
                )}
              </Box>
            ) : (
              <Typography key={index} sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>{block}</Typography>
            );
          })}
      </Box>
      <Tooltip title={copied ? "Copied!" : "Copy message"}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          size="small"
          sx={{
            color: copied ? "#4caf50" : "gray",
            "&:hover": {
              color: "#00fffc",
            },
          }}
        >
          {copied ? <IoMdCheckmark /> : <IoMdCopy />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ChatItem;

import React, { useState, useEffect } from "react";
import { Box, Avatar, Typography, IconButton, Tooltip } from "@mui/material";
import { IoMdCopy, IoMdCheckmark } from "react-icons/io";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  onStreamingComplete?: () => void;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isStreaming = false,
  onStreamingComplete,
}) => {
  const { isDarkMode } = useTheme();
  const [displayedContent, setDisplayedContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      onStreamingComplete?.();
      return;
    }

    // Check if content contains code blocks
    const hasCodeBlocks = content.includes('```') || content.includes('function') || content.includes('<') || content.includes('const ') || content.includes('let ');
    
    if (hasCodeBlocks) {
      // For code blocks, display immediately
      setDisplayedContent(content);
      onStreamingComplete?.();
      return;
    }

    // Character-by-character streaming effect for regular text only
    let currentIndex = 0;
    let currentContent = "";

    const streamInterval = setInterval(() => {
      if (currentIndex >= content.length) {
        clearInterval(streamInterval);
        onStreamingComplete?.();
        return;
      }

      // Add the next character
      currentContent += content[currentIndex];
      currentIndex++;
      setDisplayedContent(currentContent);
    }, 3); // Adjust speed here (lower = faster, higher = slower)

    return () => clearInterval(streamInterval);
  }, [content, isStreaming, onStreamingComplete]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy message");
    }
  };

  const extractCodeFromString = (message: string) => {
    if (message.includes("```")) {
      const blocks = message.split("```");
      return blocks;
    }
    return null;
  };

  const isCodeBlock = (str: string) => {
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
  };

  const messageBlocks = extractCodeFromString(displayedContent);

  return (
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
          <Typography sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>
            {displayedContent}
            {isStreaming && <span style={{ color: isDarkMode ? "#00fffc" : "#1976d2" }}>|</span>}
          </Typography>
        )}
        {messageBlocks &&
          messageBlocks.length &&
          messageBlocks.map((block, index) => {
            if (!block) return null;
            return isCodeBlock(block) ? (
              <SyntaxHighlighter key={index} style={isDarkMode ? coldarkDark : oneLight} language="javascript">
                {block}
              </SyntaxHighlighter>
            ) : (
              <Typography key={index} sx={{ fontSize: "20px", color: isDarkMode ? "white" : "black" }}>
                {block}
                {isStreaming && index === messageBlocks.length - 1 && (
                  <span style={{ color: isDarkMode ? "#00fffc" : "#1976d2" }}>|</span>
                )}
              </Typography>
            );
          })}
      </Box>
      {!isStreaming && (
        <Tooltip title={copied ? "Copied!" : "Copy message"}>
          <IconButton
            onClick={handleCopy}
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
      )}
    </Box>
  );
};

export default StreamingMessage;

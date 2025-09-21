import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { IoMdPlay, IoMdRefresh } from 'react-icons/io';
import { useTheme } from '../../context/ThemeContext';

interface CodeExecutorProps {
  code: string;
  language: string;
}

const CodeExecutor: React.FC<CodeExecutorProps> = ({ code, language }) => {
  const { isDarkMode } = useTheme();
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const executeCode = () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
        executeJavaScript();
      } else if (language.toLowerCase() === 'html') {
        executeHTML();
      } else {
        setError('Only JavaScript and HTML are supported for execution');
        setIsRunning(false);
      }
    } catch (err) {
      setError(`Execution error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsRunning(false);
    }
  };

  const executeJavaScript = () => {
    try {
      // Capture console.log output
      const originalLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalLog(...args);
      };

      // Clean the code - remove any language identifiers
      const cleanCode = code.replace(/^javascript\s*/i, '').replace(/^js\s*/i, '').trim();
      
      // Create a safe execution context
      const safeCode = `
        (function() {
          try {
            ${cleanCode}
          } catch (e) {
            throw e;
          }
        })();
      `;

      // Execute the code
      const result = eval(safeCode);
      
      // Restore console.log
      console.log = originalLog;

      // Display output
      let outputText = '';
      if (logs.length > 0) {
        outputText += 'Console Output:\n' + logs.join('\n') + '\n\n';
      }
      if (result !== undefined) {
        outputText += 'Return Value: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
      
      setOutput(outputText || 'Code executed successfully (no output)');
    } catch (err) {
      setError(`JavaScript Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const executeHTML = () => {
    try {
      // Create a new iframe for HTML execution
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 10px; 
                  background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
                  color: ${isDarkMode ? '#ffffff' : '#000000'};
                }
              </style>
            </head>
            <body>
              ${code}
            </body>
            </html>
          `);
          doc.close();
          setOutput('HTML rendered successfully');
        }
      }
    } catch (err) {
      setError(`HTML Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.body.innerHTML = '';
      }
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Button
          onClick={executeCode}
          disabled={isRunning || !code.trim()}
          startIcon={<IoMdPlay />}
          size="small"
          sx={{
            bgcolor: isDarkMode ? '#00fffc' : '#1976d2',
            color: isDarkMode ? 'black' : 'white',
            '&:hover': {
              bgcolor: isDarkMode ? '#00e6e3' : '#1565c0',
            },
            '&:disabled': {
              bgcolor: isDarkMode ? '#333' : '#ccc',
              color: isDarkMode ? '#666' : '#999',
            },
          }}
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </Button>
        <Button
          onClick={clearOutput}
          startIcon={<IoMdRefresh />}
          size="small"
          sx={{
            bgcolor: isDarkMode ? '#333' : '#f0f0f0',
            color: isDarkMode ? 'white' : 'black',
            '&:hover': {
              bgcolor: isDarkMode ? '#555' : '#e0e0e0',
            },
          }}
        >
          Clear
        </Button>
      </Box>

      {/* Output Area */}
      {(output || error) && (
        <Box
          sx={{
            p: 2,
            bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
            border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
            borderRadius: 1,
            mb: 1,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          {output && (
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                color: isDarkMode ? '#ffffff' : '#000000',
                margin: 0,
              }}
            >
              {output}
            </Typography>
          )}
        </Box>
      )}

      {/* HTML Output iframe */}
      {language.toLowerCase() === 'html' && (
        <Box
          sx={{
            border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: '200px',
              border: 'none',
              background: isDarkMode ? '#1a1a1a' : '#ffffff',
            }}
            title="HTML Output"
          />
        </Box>
      )}
    </Box>
  );
};

export default CodeExecutor;

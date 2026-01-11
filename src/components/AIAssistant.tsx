import { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronRight, Loader2 } from 'lucide-react';
import { ChatMessage, DataSummary, CleaningIssues } from '../types';
import { answerSalesQuestion } from '../utils/salesAI';

type DataRow = Record<string, string | number | null | undefined>;

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  dataSummary?: DataSummary;
  cleaningIssues?: CleaningIssues;
  context?: string;
  rows?: DataRow[];
}

export default function AIAssistant({
  isOpen,
  onToggle,
  dataSummary,
  cleaningIssues,
  context,
  rows,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI Data Analyst. I can help you understand your data, analyze quality issues, and provide insights. Upload a dataset to get started, or ask me anything!",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fallback logic (when rows are not available)
  const analyzeQuestion = (question: string): string => {
    const q = question.toLowerCase();

    if (!dataSummary) {
      return `I don't have any data to analyze yet. Please upload a CSV file first, and I'll be able to help you with:

• Data quality analysis
• Missing value detection
• Outlier identification
• Column statistics
• Cleaning recommendations
• And much more!

Once you upload your data, just ask me anything about it!`;
    }

    if (q.includes('explain') && (q.includes('csv') || q.includes('file') || q.includes('data'))) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const totalInvalid = dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0);
      const totalOutliers = dataSummary.columnDetails.reduce((sum, col) => sum + (col.outliers || 0), 0);

      return `📊 **Complete Dataset Explanation:**

**Dataset Size:**
- Total Rows: ${dataSummary.rows.toLocaleString()}
- Total Columns: ${dataSummary.columns}

**Columns in Your Dataset:**
${dataSummary.columnDetails
  .map(
    (col) =>
      `  • **${col.name}** (${col.type})${col.missing > 0 ? ` - ${col.missing} missing` : ''}${
        col.invalid > 0 ? ` - ${col.invalid} invalid` : ''
      }${col.outliers ? ` - ${col.outliers} outliers` : ''}`
  )
  .join('\n')}

**Data Quality Summary:**
- Missing Values: ${totalMissing} total
- Invalid Type Entries: ${totalInvalid}
- Outliers Detected: ${totalOutliers}
- Duplicate Rows: ${dataSummary.duplicates}

**What This Data Contains:**
This CSV file contains ${dataSummary.rows} records with ${dataSummary.columns} different attributes. ${
        totalMissing + totalInvalid + dataSummary.duplicates > 0
          ? 'There are some data quality issues that need attention.'
          : 'The data quality is good with minimal issues.'
      }

Want to know more about specific columns or issues?`;
    }

    // (Keep the rest of your original fallback responses unchanged)
    // --- Your existing logic below is fine and still works ---

    if (
      q.includes('how many') &&
      (q.includes('row') || q.includes('record') || q.includes('entry') || q.includes('entries'))
    ) {
      return `Your dataset contains **${dataSummary.rows.toLocaleString()} rows** (records).

📊 **Dataset Overview:**
- Total Rows: ${dataSummary.rows.toLocaleString()}
- Total Columns: ${dataSummary.columns}
- Duplicate Rows: ${dataSummary.duplicates}
- Unique Rows: ${(dataSummary.rows - dataSummary.duplicates).toLocaleString()}

${
  dataSummary.duplicates > 0
    ? `⚠️ Note: You have ${dataSummary.duplicates} duplicate rows that should be removed during cleaning.`
    : '✅ No duplicate rows detected!'
}`;
    }

    if (q.includes('duplicate')) {
      if (dataSummary.duplicates === 0) {
        return `✅ **No duplicates found!**

Your dataset has ${dataSummary.rows.toLocaleString()} unique rows. This is excellent data quality - no duplicate removal needed.`;
      }

      const percentage = ((dataSummary.duplicates / dataSummary.rows) * 100).toFixed(1);
      return `🔄 **Duplicate Rows Analysis:**

Found **${dataSummary.duplicates} duplicate rows** in your dataset.

**Impact:**
- Percentage: ${percentage}% of total rows
- Unique rows: ${dataSummary.rows - dataSummary.duplicates}`;
    }

    if (q.includes('missing') || q.includes('null') || q.includes('empty')) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const columnsWithMissing = cleaningIssues?.missingValues || [];

      if (totalMissing === 0) {
        return `✅ Great news! Your dataset has **no missing values**. All ${dataSummary.rows} rows are complete across all ${dataSummary.columns} columns.`;
      }

      const missingDetails = columnsWithMissing
        .map((col) => {
          const percentage = ((col.missing / dataSummary.rows) * 100).toFixed(1);
          return `  • **${col.name}**: ${col.missing} missing (${percentage}% of rows)`;
        })
        .join('\n');

      return `📊 **Missing Values Analysis:**

Your dataset has **${totalMissing} total missing values** across ${columnsWithMissing.length} columns:

${missingDetails}`;
    }

    return `I can help with:
- Row/column counts
- Missing values
- Duplicates
- Data quality summary

Upload a dataset (or make sure rows are passed in), then ask me anything.`;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const currentInput = trimmed;
    setInput('');

    setTimeout(() => {
      const headers = rows && rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
      let response: string;

      // ✅ Use advanced engine if we have raw rows
      if (rows && rows.length > 0 && headers.length > 0) {
        const ans = answerSalesQuestion({ question: currentInput, rows, headers });

        response =
          `${ans.text}\n\n` +
          `How I got this:\n` +
          ans.how.map((h) => `• ${h}`).join('\n');
      } else {
        // ✅ fallback to your existing logic
        response = analyzeQuestion(currentInput);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const hasRows = !!rows && rows.length > 0;

  const examplePrompts = hasRows
    ? [
        'How many rows are there?',
        'How many duplicates are there?',
        'How many Mike are there?',
        'Total revenue',
      ]
    : dataSummary
      ? ['Explain this CSV file', 'Show me the list of missing values', 'Is my data dirty?', 'List all columns']
      : ['What can you help me with?', 'How do I get started?', 'What features do you have?', 'Tell me about data cleaning'];

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed right-6 top-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all lg:hidden"
      >
        <Bot className="w-6 h-6" />
      </button>

      <div
        className={`fixed lg:relative inset-y-0 right-0 w-full lg:w-96 bg-white border-l border-gray-200 shadow-2xl lg:shadow-none transition-transform duration-300 z-30 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">AI Data Analyst</h3>
              <p className="text-xs text-blue-100">
               
                {context ? `Context: ${context}` : 'Ask me anything about your data'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                {message.role === 'user' ? (
                  <span className="text-white text-sm font-medium">U</span>
                ) : (
                  <Bot className="w-5 h-5 text-gray-600" />
                )}
              </div>

              <div
                className={`flex-1 rounded-2xl p-3 ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 rounded-2xl p-3 bg-gray-100 text-gray-900">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Analyzing your data...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} // ✅ fixed
              placeholder="Ask about your data..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

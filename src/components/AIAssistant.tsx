import { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronRight, Loader2 } from 'lucide-react';
import { ChatMessage, DataSummary, CleaningIssues } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  dataSummary?: DataSummary;
  cleaningIssues?: CleaningIssues;
}

export default function AIAssistant({ isOpen, onToggle, dataSummary, cleaningIssues }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI Data Analyst. I can help you understand your data, analyze quality issues, and provide insights. Upload a dataset to get started, or ask me anything!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    if (q.includes('how many') && (q.includes('row') || q.includes('record') || q.includes('entry') || q.includes('entries'))) {
      return `Your dataset contains **${dataSummary.rows.toLocaleString()} rows** (records).

📊 **Dataset Overview:**
- Total Rows: ${dataSummary.rows.toLocaleString()}
- Total Columns: ${dataSummary.columns}
- Duplicate Rows: ${dataSummary.duplicates}
- Unique Rows: ${(dataSummary.rows - dataSummary.duplicates).toLocaleString()}

${dataSummary.duplicates > 0 ? `⚠️ Note: You have ${dataSummary.duplicates} duplicate rows that should be removed during cleaning.` : '✅ No duplicate rows detected!'}`;
    }

    if (q.includes('how many') && (q.includes('column') || q.includes('field'))) {
      const columnList = dataSummary.columnDetails.map(col => `  • ${col.name} (${col.type})`).join('\n');
      return `Your dataset has **${dataSummary.columns} columns**:

${columnList}

📋 **Column Types Breakdown:**
- String columns: ${dataSummary.columnDetails.filter(c => c.type === 'string').length}
- Number columns: ${dataSummary.columnDetails.filter(c => c.type === 'number').length}
- Date columns: ${dataSummary.columnDetails.filter(c => c.type === 'date').length}

Would you like to know more about any specific column?`;
    }

    if (q.includes('missing') || q.includes('null') || q.includes('empty')) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const columnsWithMissing = cleaningIssues?.missingValues || [];

      if (totalMissing === 0) {
        return `✅ Great news! Your dataset has **no missing values**. All ${dataSummary.rows} rows are complete across all ${dataSummary.columns} columns.

This is excellent data quality!`;
      }

      const missingDetails = columnsWithMissing.map(col => {
        const percentage = ((col.missing / dataSummary.rows) * 100).toFixed(1);
        return `  • **${col.name}**: ${col.missing} missing (${percentage}% of rows)`;
      }).join('\n');

      return `📊 **Missing Values Analysis:**

Your dataset has **${totalMissing} total missing values** across ${columnsWithMissing.length} columns:

${missingDetails}

**Recommendations:**

${columnsWithMissing.map(col => {
  const percentage = (col.missing / dataSummary.rows) * 100;
  if (percentage > 30) {
    return `  ⚠️ **${col.name}**: Consider dropping this column (${percentage.toFixed(1)}% missing)`;
  } else if (col.type === 'number') {
    return `  ✓ **${col.name}**: Impute with median or mean`;
  } else if (col.type === 'string') {
    return `  ✓ **${col.name}**: Impute with mode or mark as "Unknown"`;
  } else if (col.type === 'date') {
    return `  ✓ **${col.name}**: Forward fill or interpolate dates`;
  }
  return `  ✓ **${col.name}**: Review manually`;
}).join('\n')}

Use the Auto Clean feature to handle these automatically!`;
    }

    if (q.includes('dirty') || q.includes('quality') || q.includes('clean') || q.includes('issue')) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const totalInvalid = dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0);
      const totalOutliers = dataSummary.columnDetails.reduce((sum, col) => sum + (col.outliers || 0), 0);
      const totalIssues = totalMissing + totalInvalid + dataSummary.duplicates;

      const qualityScore = Math.max(0, 100 - (totalIssues / dataSummary.rows * 100));

      let assessment = '';
      if (qualityScore >= 95) assessment = '✅ Excellent - Very Clean';
      else if (qualityScore >= 85) assessment = '👍 Good - Minor Issues';
      else if (qualityScore >= 70) assessment = '⚠️ Fair - Needs Cleaning';
      else assessment = '🚨 Poor - Significant Issues';

      return `📋 **Data Quality Report:**

**Overall Quality Score: ${qualityScore.toFixed(1)}%** ${assessment}

**Issues Found:**
- Missing Values: ${totalMissing} across ${cleaningIssues?.missingValues.length || 0} columns
- Invalid Types: ${totalInvalid} entries with type errors
- Outliers: ${totalOutliers} potential outliers
- Duplicates: ${dataSummary.duplicates} duplicate rows

**Detailed Breakdown:**

${totalMissing > 0 ? `🔴 **Missing Values:** ${cleaningIssues?.missingValues.map(c => `${c.name} (${c.missing})`).join(', ')}` : '✅ No missing values'}

${totalInvalid > 0 ? `🔴 **Invalid Types:** ${cleaningIssues?.invalidTypes.map(c => `${c.name} (${c.invalid})`).join(', ')}` : '✅ All types valid'}

${totalOutliers > 0 ? `🟡 **Outliers:** ${cleaningIssues?.outliers.map(c => `${c.name} (${c.outliers})`).join(', ')}` : '✅ No significant outliers'}

${dataSummary.duplicates > 0 ? `🔴 **Duplicates:** ${dataSummary.duplicates} duplicate rows found` : '✅ No duplicates'}

**My Recommendation:**
${qualityScore < 85 ? 'Your data needs cleaning. Click "Auto Clean" to fix these issues automatically.' : 'Your data is in good shape! Minor cleaning will make it perfect.'}

Want me to explain any specific issue in detail?`;
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
- Unique rows: ${dataSummary.rows - dataSummary.duplicates}
- These should be removed to avoid:
  • Skewed statistics
  • Biased analysis
  • Inflated counts
  • Incorrect aggregations

**Recommendation:**
Remove all ${dataSummary.duplicates} duplicates using the Auto Clean feature. This will keep only the first occurrence of each duplicate row.

After cleaning, you'll have ${dataSummary.rows - dataSummary.duplicates} clean, unique rows.`;
    }

    if (q.includes('outlier') || q.includes('extreme') || q.includes('anomal')) {
      const outlierCols = cleaningIssues?.outliers || [];

      if (outlierCols.length === 0) {
        return `✅ **No significant outliers detected** in your numeric columns.

Your data values fall within expected ranges. This indicates good data quality!`;
      }

      const totalOutliers = outlierCols.reduce((sum, col) => sum + (col.outliers || 0), 0);
      const outlierDetails = outlierCols.map(col =>
        `  • **${col.name}**: ${col.outliers} outliers detected`
      ).join('\n');

      return `📊 **Outlier Analysis:**

Found **${totalOutliers} outliers** in ${outlierCols.length} numeric column(s):

${outlierDetails}

**What are outliers?**
Values that are significantly different from other observations (typically >1.5×IQR from quartiles).

**Should you remove them?**

❌ **Keep outliers if:**
- They represent legitimate extreme values
- They're important edge cases
- You're doing exploratory analysis

✅ **Remove outliers if:**
- They're data entry errors
- They'll skew your models
- You need normalized distributions

**My recommendation:** Review these values manually before removing. They might contain important insights!

Want to see statistics for any specific column?`;
    }

    if (q.includes('column') || q.includes('field')) {
      const specificColumn = dataSummary.columnDetails.find(col =>
        q.includes(col.name.toLowerCase())
      );

      if (specificColumn) {
        const percentage = ((specificColumn.missing / dataSummary.rows) * 100).toFixed(1);
        return `📊 **Column Details: ${specificColumn.name}**

**Type:** ${specificColumn.type}
**Missing Values:** ${specificColumn.missing} (${percentage}%)
**Invalid Entries:** ${specificColumn.invalid}
${specificColumn.outliers ? `**Outliers:** ${specificColumn.outliers}` : ''}

**Quality Assessment:**
${specificColumn.missing === 0 && specificColumn.invalid === 0 ? '✅ This column is clean and complete!' : '⚠️ This column needs attention'}

${specificColumn.missing > 0 ? `\n**Missing Values:** Consider ${specificColumn.type === 'number' ? 'median/mean imputation' : specificColumn.type === 'string' ? 'mode imputation or "Unknown"' : 'forward fill or interpolation'}` : ''}

${specificColumn.invalid > 0 ? `\n**Invalid Types:** ${specificColumn.invalid} entries don't match expected ${specificColumn.type} type. These need correction.` : ''}

Want to know more about this column or others?`;
      }

      return `I can provide detailed information about any column. Here are your columns:

${dataSummary.columnDetails.map(col => `  • ${col.name} (${col.type})`).join('\n')}

Just ask "Tell me about [column name]" for details!`;
    }

    if (q.includes('invalid') || q.includes('type') || q.includes('error')) {
      const invalidCols = cleaningIssues?.invalidTypes || [];

      if (invalidCols.length === 0) {
        return `✅ **All data types are valid!**

Every value in your dataset matches its expected type. No type conversions needed!`;
      }

      const totalInvalid = invalidCols.reduce((sum, col) => sum + col.invalid, 0);
      const details = invalidCols.map(col =>
        `  • **${col.name}** (${col.type}): ${col.invalid} invalid entries`
      ).join('\n');

      return `🔍 **Invalid Type Analysis:**

Found **${totalInvalid} invalid entries** across ${invalidCols.length} column(s):

${details}

**What causes invalid types?**
- Text in numeric columns
- Malformed dates
- Special characters
- Inconsistent formats

**How to fix:**
${invalidCols.map(col => {
  if (col.type === 'number') return `  • **${col.name}**: Convert to numbers or replace with median`;
  if (col.type === 'date') return `  • **${col.name}**: Convert to ISO format (YYYY-MM-DD)`;
  return `  • **${col.name}**: Standardize format`;
}).join('\n')}

Use Auto Clean to fix these automatically!`;
    }

    if (q.includes('statistic') || q.includes('average') || q.includes('mean') || q.includes('median')) {
      const numericCols = dataSummary.columnDetails.filter(c => c.type === 'number');

      if (numericCols.length === 0) {
        return `Your dataset has no numeric columns to calculate statistics for. The columns are:

${dataSummary.columnDetails.map(col => `  • ${col.name} (${col.type})`).join('\n')}`;
      }

      return `📊 **Statistical Overview:**

Your dataset has ${numericCols.length} numeric column(s): ${numericCols.map(c => c.name).join(', ')}

**Key Statistics:**
- Data points per column: ${dataSummary.rows}
- Valid values: Varies by column (see missing values)
- Range: From minimum to maximum values

**For detailed statistics:**
Navigate to the Visualization screen to see:
• Mean and Median values
• Standard deviation
• Min/Max ranges
• Distribution charts
• Correlation analysis

Would you like to know about a specific numeric column?`;
    }

    if (q.includes('recommend') || q.includes('should') || q.includes('what do')) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const totalInvalid = dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0);
      const totalIssues = totalMissing + totalInvalid + dataSummary.duplicates;

      if (totalIssues === 0) {
        return `✅ **Your data is already clean!**

No issues detected:
- No missing values
- No invalid types
- No duplicates

You can proceed directly to visualization and analysis. Great job maintaining clean data!`;
      }

      return `🎯 **My Cleaning Recommendations:**

**Step 1: Remove Duplicates** (Priority: High)
${dataSummary.duplicates > 0 ? `Remove ${dataSummary.duplicates} duplicate rows - no information loss!` : '✅ No duplicates to remove'}

**Step 2: Fix Invalid Types** (Priority: High)
${totalInvalid > 0 ? `Fix ${totalInvalid} type errors to ensure data consistency` : '✅ All types are valid'}

**Step 3: Handle Missing Values** (Priority: Medium)
${totalMissing > 0 ? `Impute or remove ${totalMissing} missing values` : '✅ No missing values'}

**Quick Action:**
Click the **"Auto Clean"** button to automatically:
1. Remove all duplicates
2. Fix type inconsistencies
3. Impute missing values intelligently
4. Flag outliers for review

This will clean ${totalIssues} issues in seconds!

After cleaning, your data will be ready for analysis and visualization.`;
    }

    if (q.includes('help') || q.includes('what can') || q.includes('how do')) {
      return `🤖 **I'm your AI Data Analyst! Here's what I can do:**

**📊 Data Analysis:**
- "How many rows/columns do I have?"
- "Tell me about the [column name] column"
- "Show me statistics"

**🔍 Quality Assessment:**
- "Is my data dirty?"
- "What issues does my data have?"
- "Check data quality"

**🧹 Cleaning Guidance:**
- "How should I clean my data?"
- "What about missing values?"
- "Should I remove duplicates?"
- "Tell me about outliers"

**💡 Insights:**
- "Which columns need attention?"
- "What's the quality score?"
- "What do you recommend?"

Just ask me anything about your data in natural language, and I'll provide detailed, actionable insights!

${!dataSummary ? '\n📤 Upload a dataset to get started!' : ''}`;
    }

    return `I understand you're asking: "${question}"

${dataSummary ? `I have analyzed your dataset with ${dataSummary.rows} rows and ${dataSummary.columns} columns.` : 'Please upload a dataset first so I can analyze it.'}

Here are some things you can ask me:
- "How many rows do I have?"
- "Is my data dirty?"
- "Tell me about missing values"
- "What columns need cleaning?"
- "Show me data quality"
- "What do you recommend?"

Try asking something more specific, and I'll give you detailed insights!`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    const currentInput = input;
    setInput('');

    setTimeout(() => {
      const response = analyzeQuestion(currentInput);
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

  const examplePrompts = dataSummary ? [
    'How many rows do I have?',
    'Is my data dirty?',
    'Tell me about missing values',
    'What do you recommend?',
  ] : [
    'What can you help me with?',
    'How do I get started?',
    'What features do you have?',
    'Tell me about data cleaning',
  ];

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
              <p className="text-xs text-blue-100">Ask me anything about your data</p>
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
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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

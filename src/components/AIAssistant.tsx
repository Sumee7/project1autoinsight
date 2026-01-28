import { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronRight, Loader2, Sparkles, Copy, Download, AlertCircle, CheckCircle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { ChatMessage, DataSummary, CleaningIssues } from '../types';
import { answerSalesQuestion } from '../utils/salesAI';
import { 
  analyzeColumnStats, 
  detectPatterns, 
  detectAnomalies, 
  calculateCorrelations, 
  generateInsights, 
  answerComplexQuestion, 
  classifyQuestion 
} from '../utils/advancedAnalysis';

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

  // Helper function to render formatted messages with visual elements
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Header formatting with emojis
      if (line.startsWith('📊') || line.startsWith('🔄') || line.startsWith('✅') || 
          line.startsWith('⚠️') || line.startsWith('🤖') || line.startsWith('📈') ||
          line.startsWith('🔍')) {
        elements.push(
          <div key={i} className="font-bold text-blue-300 mb-2 text-base">
            {line}
          </div>
        );
      }
      // Bold formatting **text**
      else if (line.includes('**')) {
        const formatted = line.split(/\*\*/).map((part, idx) => 
          idx % 2 === 1 ? <span key={idx} className="font-bold text-white">{part}</span> : part
        );
        elements.push(<p key={i} className="mb-1 text-sm">{formatted}</p>);
      }
      // Bullet points
      else if (line.startsWith('•') || line.startsWith('-')) {
        elements.push(
          <div key={i} className="ml-3 mb-1 text-sm flex gap-2">
            <span className="text-blue-400 flex-shrink-0">•</span>
            <span>{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        );
      }
      // Code/stats formatting
      else if (line.includes(':') && !line.includes('http')) {
        const [label, value] = line.split(':');
        elements.push(
          <div key={i} className="mb-1 text-sm grid grid-cols-2 gap-2">
            <span className="text-gray-400">{label}:</span>
            <span className="text-white font-semibold">{value.trim()}</span>
          </div>
        );
      }
      // Empty lines
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      }
      // Regular text
      else {
        elements.push(
          <p key={i} className="mb-2 text-sm leading-relaxed">
            {line}
          </p>
        );
      }
      i++;
    }

    return elements;
  };

  // Helper to generate data context summary
  const getDataContextSummary = () => {
    if (!dataSummary) return null;
    
    const totalIssues = (dataSummary.columnDetails.reduce((sum, col) => sum + col.missing + col.invalid, 0)) + dataSummary.duplicates;
    const completeness = ((dataSummary.rows - (dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0) / dataSummary.columns)) / dataSummary.rows * 100).toFixed(0);

    return {
      rows: dataSummary.rows,
      columns: dataSummary.columns,
      completeness: parseInt(completeness),
      issues: totalIssues,
      duplicates: dataSummary.duplicates,
    };
  };

  // Helper to generate fixing solutions
  const generateFixingSolution = (issue: string, dataSummary?: DataSummary): string => {
    const q = issue.toLowerCase();

    // MISSING VALUES SOLUTIONS
    if (q.includes('missing') || q.includes('null') || q.includes('empty') || q.includes('fix missing') || q.includes('handle missing')) {
      const totalMissing = dataSummary ? dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0) : 0;
      const columnsWithMissing = cleaningIssues?.missingValues || [];

      if (totalMissing === 0) {
        return `✅ **Great News!**

Your dataset has **no missing values** - nothing to fix!

You can proceed directly to analysis. Go to the Visualization screen to explore your data.`;
      }

      const missingStr = columnsWithMissing
        .map((col) => {
          const percent = ((col.missing / (dataSummary?.rows || 1)) * 100).toFixed(1);
          return `• **${col.name}**: ${col.missing} missing (${percent}%)`;
        })
        .join('\n');

      return `🔧 **How to Fix Missing Values**

**Your Missing Data:**
${missingStr}

**Solutions (Pick One):**

**Option 1: Remove Rows with Missing Data** ⚡ Fastest
- Removes entire rows that have ANY missing values
- Best for: Small amount of missing data (<5%)
- How to: Click "Auto Clean" button on Cleaning screen

**Option 2: Fill with Average (Numeric Columns)** 📊
- Fills missing numbers with column average
- Best for: Numeric data (ages, prices, counts)
- How to: Select "Fill Missing Values" → Choose "Average"

**Option 3: Fill with Most Common Value** 📋
- Fills gaps with the most frequent value
- Best for: Categories (cities, product types)
- How to: Select "Fill Missing Values" → Choose "Mode"

**Option 4: Remove Entire Columns** (Last Resort) 🗑️
- Removes columns with too many missing values
- Best for: When column has >50% missing
- How to: Manual in Cleaning screen

**My Recommendation:**
For ${totalMissing} missing values across ${columnsWithMissing.length} columns:
${
  totalMissing / (dataSummary?.rows || 1) < 0.01
    ? '✅ Use "Auto Clean" - you have minimal missing data'
    : totalMissing / (dataSummary?.rows || 1) < 0.1
      ? '✅ Use "Fill with Average" for numeric columns'
      : '⚠️ Consider removing columns with high missing rates first'
}

**Steps:**
1. Go to Cleaning Screen
2. Review the "Missing Values" section
3. Click "Auto Clean" to apply fixes
4. Check results and come back if issues remain`;
    }

    // DUPLICATE SOLUTIONS
    if (q.includes('duplicate') || q.includes('remove duplicate') || q.includes('fix duplicate')) {
      const duplicates = dataSummary?.duplicates || 0;

      if (duplicates === 0) {
        return `✅ **No Duplicates Found!**

Your dataset is clean - no duplicate removal needed.`;
      }

      const dupPercent = ((duplicates / (dataSummary?.rows || 1)) * 100).toFixed(1);

      return `🔧 **How to Remove Duplicates**

**Your Duplicate Issue:**
- Duplicate Rows: **${duplicates}** (${dupPercent}% of data)
- Unique Rows: **${(dataSummary?.rows || 0) - duplicates}**

**Why Remove Them:**
Duplicates skew analysis, inflate metrics, and create bias. Always remove them first!

**Solution (Automatic):** ✨

1. Go to **Cleaning Screen**
2. Look for "Duplicate Rows" section
3. Click **"Remove Duplicates"** button
4. System will:
   - Identify exact duplicate rows
   - Keep first occurrence
   - Delete ${duplicates} duplicate entries
   - Give you clean data with ${(dataSummary?.rows || 0) - duplicates} unique rows

**After Removing:**
✅ Re-analyze data
✅ Check for other issues
✅ Proceed to visualization

**Tip:** Always do this FIRST before any other cleaning!`;
    }

    // INVALID DATA SOLUTIONS
    if (q.includes('invalid') || q.includes('wrong type') || q.includes('type error') || q.includes('fix invalid')) {
      const totalInvalid = dataSummary ? dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0) : 0;
      const invalidCols = cleaningIssues?.invalidTypes || [];

      if (totalInvalid === 0) {
        return `✅ **Perfect!**

All your data types are valid - no corrections needed!`;
      }

      return `🔧 **How to Fix Invalid Data Types**

**Invalid Entries Found:**
${invalidCols.map((col) => `• **${col.name}** (${col.type}): ${col.invalid} invalid entries`).join('\n')}

**What This Means:**
You have values in columns that don't match their expected type. For example:
- Text in a number column ("abc" in Price)
- Numbers in a date column ("999" in Birthday)
- Special characters breaking the pattern

**Solution:**

**Automatic Fix (Recommended):**
1. Go to **Cleaning Screen**
2. Click **"Auto Clean"** button
3. System will:
   - Remove rows with invalid types
   - Convert compatible values (e.g., "123" → 123)
   - Flag incompatible data for review

**Manual Fix (For Experts):**
1. Review the invalid entries on Cleaning screen
2. Decide: Remove row or convert value?
3. Use the "Fix Invalid Types" option
4. Choose conversion method per column

**What Happens After:**
- ${totalInvalid} problematic entries are removed
- All remaining data matches column type
- Data becomes analysis-ready

**Then:** Check data quality again!`;
    }

    // OUTLIERS SOLUTIONS
    if (q.includes('outlier') || q.includes('anomal') || q.includes('unusual') || q.includes('fix outlier')) {
      return `🔧 **How to Handle Outliers & Anomalies**

**What Are Outliers?**
Unusual values that are very different from the rest. Examples:
- Age: 999 years old (should be 99)
- Price: -$1000 (should be positive)
- Revenue: $10M when average is $1K

**Detection Method Used:**
IQR (Interquartile Range) - Statistical method to find extreme values

**Solutions:**

**Option 1: Flag for Review** 🚩 Most Common
- Marks unusual values but keeps them
- Best for: Real-world edge cases
- How: System automatically highlights them

**Option 2: Remove Rows** 🗑️
- Deletes entire rows with outliers
- Best for: Clear errors/typos
- How: Click "Remove Outliers" in Cleaning screen

**Option 3: Cap Values** 📊
- Replaces extreme values with reasonable limits
- Example: Age > 120 becomes 120
- Best for: Physical constraints exist

**Option 4: Transform Data** 🔄
- Use log/square root to normalize extreme values
- Best for: Statistical analysis

**My Recommendation:**
1. **Investigate first** - Are they errors or real data?
2. **Manual review** - Look at suspicious values
3. **Decide per column** - Different rules for different data
4. **Document removal** - Keep track of what you removed

**Actions on Cleaning Screen:**
- ✅ View all detected outliers
- ✅ See which rows they're in
- ✅ Choose to remove or keep them
- ✅ Re-analyze after changes`;
    }

    // DATA QUALITY SOLUTIONS
    if (q.includes('quality') || q.includes('improve data') || q.includes('clean data') || q.includes('fix data')) {
      const totalIssues = dataSummary 
        ? (dataSummary.columnDetails.reduce((sum, col) => sum + col.missing + col.invalid, 0)) + dataSummary.duplicates
        : 0;
      const completeness = dataSummary 
        ? (((dataSummary.rows - (dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0) / dataSummary.columns)) / dataSummary.rows) * 100).toFixed(0)
        : 0;

      return `🔧 **Complete Data Cleaning Solution**

**Your Data Quality Score: ${completeness}%**

**Issues Summary:**
${
  dataSummary
    ? `- Missing Values: ${dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0)}
- Invalid Types: ${dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0)}
- Duplicates: ${dataSummary.duplicates}
- **Total Issues: ${totalIssues}**`
    : 'Upload data to see specific issues'
}

**3-Step Cleaning Process:**

**Step 1: Remove Duplicates** ⚡ (Do First!)
→ Go to Cleaning Screen → Click "Remove Duplicates"
→ Removes ${dataSummary?.duplicates || 0} exact duplicate rows

**Step 2: Handle Missing Values** 📊
→ Cleaning Screen → "Missing Values" section
→ Choose: Remove rows / Fill with Average / Fill with Mode
→ Handles ${dataSummary?.columnDetails.reduce((sum, col) => sum + col.missing, 0) || 0} missing entries

**Step 3: Fix Invalid Types** ✅
→ Cleaning Screen → "Invalid Types" section
→ Click "Auto Fix" to convert/remove invalid data
→ Fixes ${dataSummary?.columnDetails.reduce((sum, col) => sum + col.invalid, 0) || 0} invalid entries

**After Each Step:**
✅ Review results
✅ Check updated quality score
✅ Proceed if satisfied, or repeat

**Final Result:**
→ Move to Visualization Screen
→ Run analysis on clean data
→ Generate insights!

**Pro Tip:** Start with duplicates, then missing values, then types. This order prevents cascading issues!`;
    }

    // GENERAL DATA IMPROVEMENT
    return `🔧 **Data Improvement Guide**

**Questions I Can Answer:**
• "How do I fix missing values?"
• "How to remove duplicates?"
• "Fix invalid data types?"
• "Handle outliers?"
• "Improve data quality?"
• "Clean my entire dataset?"

**Quick Start - Best Practices:**

**1️⃣ Remove Duplicates First** (Always!)
→ Fastest way to improve quality

**2️⃣ Handle Missing Values** (Second)
→ Fill gaps or remove incomplete rows

**3️⃣ Fix Invalid Types** (Third)
→ Ensure data types match columns

**4️⃣ Review Outliers** (Last)
→ Investigate unusual values

**Then Analyze!** 📊
→ Use visualization tools
→ Ask for insights
→ Export cleaned data

**Pick a specific issue and I'll give you exact steps!**
Examples:
• "How do I fix missing values?"
• "Help with duplicates"
• "Fix invalid data"
• "Remove outliers"`;
  };

  // Fallback logic (when rows are not available)
  const analyzeQuestion = (question: string): string => {
    const q = question.toLowerCase();

    if (!dataSummary) {
      return `✅ **Getting Started**

**What to do:**
1. Upload a CSV file using the upload screen
2. Review data quality issues
3. Clean your data if needed
4. Ask me questions about it!

**What I can help with:**
📊 Data quality analysis
📈 Statistics and distributions
🔍 Pattern detection
⚠️ Anomaly identification
✅ Duplicate detection
📋 Column analysis

Let me know once you've uploaded data!`;
    }

    if (q.includes('explain') && (q.includes('csv') || q.includes('file') || q.includes('data'))) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const totalInvalid = dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0);
      const totalOutliers = dataSummary.columnDetails.reduce((sum, col) => sum + (col.outliers || 0), 0);

      return `📊 **Complete Dataset Explanation**

**Dataset Size:**
- Total Rows: ${dataSummary.rows.toLocaleString()}
- Total Columns: ${dataSummary.columns}

**Columns in Your Dataset:**
${dataSummary.columnDetails
  .map(
    (col) =>
      `• **${col.name}** (${col.type})${col.missing > 0 ? ` - ${col.missing} missing` : ''}${
        col.invalid > 0 ? ` - ${col.invalid} invalid` : ''
      }${col.outliers ? ` - ${col.outliers} outliers` : ''}`
  )
  .join('\n')}

**Data Quality Summary:**
- Missing Values: ${totalMissing}
- Invalid Entries: ${totalInvalid}
- Outliers Detected: ${totalOutliers}
- Duplicate Rows: ${dataSummary.duplicates}

**What This Means:**
${
  totalMissing + totalInvalid + dataSummary.duplicates > 0
    ? 'Your data has some quality issues that should be cleaned before analysis.'
    : 'Great! Your data quality is excellent with minimal issues.'
}

**Next Steps:**
1. Review the cleaning screen for issues
2. Decide which issues to fix
3. Come back and ask me specific questions!`;
    }

    if (
      q.includes('how many') &&
      (q.includes('row') || q.includes('record') || q.includes('entry') || q.includes('entries'))
    ) {
      return `📊 **Dataset Row Count**

Your dataset contains **${dataSummary.rows.toLocaleString()} rows** (records).

**Breakdown:**
- Total Rows: ${dataSummary.rows.toLocaleString()}
- Duplicate Rows: ${dataSummary.duplicates}
- Unique Rows: ${(dataSummary.rows - dataSummary.duplicates).toLocaleString()}

**Why This Matters:**
${
  dataSummary.duplicates > 0
    ? `You have ${dataSummary.duplicates} duplicate rows (${((dataSummary.duplicates / dataSummary.rows) * 100).toFixed(1)}%). These should be removed to avoid skewed analysis.`
    : 'No duplicates detected! All rows are unique.'
}`;
    }

    if (q.includes('duplicate')) {
      if (dataSummary.duplicates === 0) {
        return `✅ **No Duplicates Found!**

Your dataset has ${dataSummary.rows.toLocaleString()} unique rows. 

**What this means:**
Each row in your data is unique - there are no repeated records. This is excellent for data quality!`;
      }

      const percentage = ((dataSummary.duplicates / dataSummary.rows) * 100).toFixed(1);
      return `🔄 **Duplicate Analysis**

Found **${dataSummary.duplicates} duplicate rows** out of ${dataSummary.rows.toLocaleString()}.

**Impact:**
- Percentage: ${percentage}% of your data
- Unique rows: ${dataSummary.rows - dataSummary.duplicates}
- Rows to remove: ${dataSummary.duplicates}

**Recommendation:**
Remove duplicates to ensure accurate analysis. This is usually the first cleaning step.`;
    }

    if (q.includes('missing') || q.includes('null') || q.includes('empty')) {
      const totalMissing = dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0);
      const columnsWithMissing = cleaningIssues?.missingValues || [];

      if (totalMissing === 0) {
        return `✅ **Perfect! No Missing Values**

Your dataset is 100% complete across all ${dataSummary.columns} columns and ${dataSummary.rows} rows.`;
      }

      const missingDetails = columnsWithMissing
        .map((col) => {
          const percentage = ((col.missing / dataSummary.rows) * 100).toFixed(1);
          return `• **${col.name}**: ${col.missing} missing (${percentage}% of rows)`;
        })
        .join('\n');

      return `📊 **Missing Values Analysis**

Your dataset has **${totalMissing} total missing values** across ${columnsWithMissing.length} columns:

${missingDetails}

**What to do:**
- Remove rows with too many missing values
- Fill gaps with average/median values
- Use 'cleaning' feature to fix automatically`;
    }

    if (q.includes('quality') || q.includes('health')) {
      const totalIssues = (dataSummary.columnDetails.reduce((sum, col) => sum + col.missing + col.invalid, 0)) + dataSummary.duplicates;
      const percentage = ((dataSummary.rows - totalIssues) / dataSummary.rows * 100).toFixed(1);

      return `📈 **Data Quality Assessment**

Your data quality score: **${percentage}%**

**Issues Found:**
- Missing Values: ${dataSummary.columnDetails.reduce((sum, col) => sum + col.missing, 0)}
- Invalid Types: ${dataSummary.columnDetails.reduce((sum, col) => sum + col.invalid, 0)}
- Duplicates: ${dataSummary.duplicates}
- Total Issues: ${totalIssues}

**Recommendations:**
${totalIssues === 0 ? '✅ No issues found! Data is ready to analyze.' : '1. Clean missing values\n2. Fix invalid types\n3. Remove duplicates\n4. Re-analyze quality'}`;
    }

    return `🤖 **How I Can Help**

📊 **Data Exploration**
• "How many rows?"
• "List all columns"
• "Show duplicates"
• "Missing values where?"

📈 **Quality Assessment**
• "Data quality report"
• "Any issues?"
• "Explain this CSV"
• "Is data complete?"

🔍 **Advanced Analysis**
(After cleaning)
• "Show patterns"
• "Find correlations"
• "Detect anomalies"

Just ask!`;
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
      const q_lower = currentInput.toLowerCase();
      const headers = rows && rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
      let response: string = '';

      // CHECK FOR FIXING/SOLUTION REQUESTS FIRST
      if (
        q_lower.includes('fix') || q_lower.includes('how do i') || q_lower.includes('how to') ||
        q_lower.includes('clean') || q_lower.includes('improve') || q_lower.includes('solution') ||
        q_lower.includes('help') && (q_lower.includes('missing') || q_lower.includes('duplicate') || q_lower.includes('invalid') || q_lower.includes('quality'))
      ) {
        // Use the AI solution provider
        response = generateFixingSolution(currentInput, dataSummary);
      }
      // PRIMARY: Use advanced analysis engine if rows available
      else if (rows && rows.length > 0 && headers.length > 0) {
        // Try advanced analysis first
        const complexAnswer = answerComplexQuestion(currentInput, rows, headers, dataSummary);
        if (complexAnswer && complexAnswer.trim().length > 20) {
          response = complexAnswer;
        } else {
          // Try sales AI engine
          const ans = answerSalesQuestion({ question: currentInput, rows, headers });
          if (ans.text && ans.text.length > 20) {
            response = `${ans.text}\n\n**💡 How I analyzed this:**\n${ans.how.map((h) => `• ${h}`).join('\n')}`;
          }
        }

        // Add smart suggestions if no specific answer found
        if (!response || response.trim().length < 20) {
          if (q_lower.includes('what can') || q_lower.includes('feature') || q_lower.includes('example')) {
            response = `🤖 **I can help you with:**

📊 **Data Analysis**
• "Show me the distribution of [column]"
• "Find correlations between columns"
• "What patterns exist in the data?"
• "Find anomalies and outliers"

📈 **Statistics & Insights**
• "What's the data quality score?"
• "How many duplicate rows?"
• "Summarize column [name]"
• "Show unique values in [column]"

🔍 **Data Cleaning**
• "How do I fix missing values?"
• "How to remove duplicates?"
• "Fix invalid data types?"
• "Clean my entire dataset?"

Just ask any question about your data!`;
          } else {
            // Default helpful response
            response = `✅ **I can analyze this in detail!**

Try asking me about:
📊 Data distributions and patterns
📈 Correlations between columns
⚠️ Anomalies and outliers
📋 Column statistics
✅ Data quality assessment

**Or get fixing solutions:**
• "How do I fix missing values?"
• "How to remove duplicates?"
• "Fix invalid data?"
• "Clean my data?"

What would you like to know?`;
          }
        }
      } else if (dataSummary) {
        // Fallback to basic analysis if no rows
        response = analyzeQuestion(currentInput);
      } else {
        response = `📁 **Ready to Analyze!**

Please upload a CSV file to get started. I can then help you with:

✅ Data quality checks
✅ Missing value analysis
✅ Pattern detection
✅ Anomaly identification
✅ Fixing & cleaning solutions

Upload a file and ask me anything!`;
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
        'Show distribution',
        'Find correlations',
        'Detect anomalies',
        'How to fix data?',
        'Data quality report',
        'Fix duplicates',
      ]
    : dataSummary
      ? [
          'Explain this CSV',
          'Data quality summary',
          'Missing values fix',
          'Remove duplicates',
          'Quality assessment',
          'Clean data how?',
        ]
      : [
          'Get started',
          'What can you do?',
          'Show features',
          'How to analyze',
          'Data cleaning tips',
          'Check data quality?',
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
        className={`fixed lg:relative inset-y-0 right-0 w-full lg:w-96 bg-gray-800/50 backdrop-blur border-l border-gray-700/50 shadow-2xl lg:shadow-none transition-transform duration-300 z-30 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Data Analyst</h3>
              <p className="text-xs text-blue-100">
                {context ? `Context: ${context}` : 'Intelligent analysis engine'}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
          {/* Data Context Summary - Show at start if data available */}
          {hasRows && messages.length <= 1 && dataSummary && (
            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl p-3 border border-blue-500/30">
              <p className="text-xs font-semibold text-blue-300 mb-2">📊 Your Dataset</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Rows:</span> <span className="text-white font-bold">{dataSummary.rows.toLocaleString()}</span></div>
                <div><span className="text-gray-400">Columns:</span> <span className="text-white font-bold">{dataSummary.columns}</span></div>
                <div><span className="text-gray-400">Completeness:</span> <span className="text-green-400 font-bold">{getDataContextSummary()?.completeness}%</span></div>
                <div><span className="text-gray-400">Issues:</span> <span className="text-orange-400 font-bold">{getDataContextSummary()?.issues}</span></div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                  message.role === 'user' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                }`}
              >
                {message.role === 'user' ? (
                  <span className="text-white text-sm font-medium">U</span>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div
                className={`flex-1 rounded-2xl p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedMessage(message.content)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                  <p className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                        alert('Copied to clipboard!');
                      }}
                      className="text-gray-500 hover:text-blue-400 p-1 rounded transition-colors"
                      title="Copy response"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600/30 border border-blue-500/50 text-blue-300">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 rounded-2xl p-3 bg-gray-800/50 border border-gray-700/50 text-gray-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <p className="text-sm text-gray-400">Analyzing your data...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700/50 bg-gray-900/20 space-y-3">
          {/* Quick Stats if data available */}
          {hasRows && dataSummary && (
            <div className="bg-gray-800/30 rounded-lg p-2 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1.5 font-semibold">🎯 Quick Stats</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div className="bg-green-500/20 rounded px-2 py-1 border border-green-500/30 text-center">
                  <div className="font-bold text-green-400">{dataSummary.rows}</div>
                  <div className="text-gray-400 text-xs">Rows</div>
                </div>
                <div className="bg-blue-500/20 rounded px-2 py-1 border border-blue-500/30 text-center">
                  <div className="font-bold text-blue-400">{dataSummary.columns}</div>
                  <div className="text-gray-400 text-xs">Columns</div>
                </div>
                <div className={`${getDataContextSummary()!.issues === 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-orange-500/20 border-orange-500/30'} rounded px-2 py-1 text-center`}>
                  <div className={`font-bold ${getDataContextSummary()!.issues === 0 ? 'text-green-400' : 'text-orange-400'}`}>{getDataContextSummary()!.issues}</div>
                  <div className="text-gray-400 text-xs">Issues</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-2 font-semibold">💡 Try asking:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {examplePrompts.slice(0, 6).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1.5 rounded-lg transition-colors text-left hover:border-blue-500/60"
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your data..."
              className="flex-1 px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

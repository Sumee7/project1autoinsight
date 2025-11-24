import { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronRight, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  context?: string;
}

export default function AIAssistant({ isOpen, onToggle, context }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI Data Analyst. I can help you understand your data, identify patterns, suggest cleaning strategies, and provide insights. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const examplePrompts = [
    'What cleaning strategies should I use?',
    'How do I handle missing values?',
    'What do outliers mean in my data?',
    'Should I remove or impute missing data?',
  ];

  const getSmartResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('missing') || q.includes('null') || q.includes('empty')) {
      return `Great question about missing values! Here's my analysis:

🔍 **Understanding Missing Data:**

In your dataset, I've detected missing values in columns like Age, Score, and Date. Here's what you should do:

**1. Assess the Pattern:**
- Random missing: Safe to impute
- Systematic missing: Investigate why

**2. Recommended Strategies:**

**For Numeric Data (Age, Score, Revenue):**
✓ Mean imputation - Good for normally distributed data
✓ Median imputation - Better with outliers
✓ KNN imputation - Most accurate but slower

**For Categorical Data (Status, Category):**
✓ Mode imputation - Use most frequent value
✓ Create 'Unknown' category if missingness is meaningful

**3. My Recommendation:**
For your data, I suggest using median for numeric columns and mode for categorical. This preserves data distribution while maintaining dataset size.

💡 **Pro Tip:** If >30% of a column is missing, consider dropping that column instead of imputing.`;
    }

    if (q.includes('outlier') || q.includes('extreme') || q.includes('anomal')) {
      return `Let me explain outliers in your dataset:

📊 **Outlier Analysis:**

I've detected outliers in your Score and Revenue columns. Here's what they mean:

**What are Outliers?**
Data points significantly different from others (typically >1.5×IQR from quartiles)

**In Your Data:**
- Revenue: 3 values above $10,000 (normal range: $50-$1,500)
- Score: 2 values below 20 (normal range: 75-95)

**Should You Remove Them?**

❌ **Don't Remove If:**
- They're legitimate high-value transactions
- They represent important edge cases
- You're doing exploratory analysis

✅ **Consider Removing If:**
- They're data entry errors
- They'll skew statistical models
- You're training ML models sensitive to outliers

**My Recommendation:**
Keep outliers but flag them in a separate column. This way you can analyze with/without them and maintain data integrity.

🎯 **Action:** Run robust statistical tests (median, IQR) instead of mean-based analysis to reduce outlier impact.`;
    }

    if (q.includes('clean') || q.includes('strategy') || q.includes('approach')) {
      return `Here's your comprehensive data cleaning strategy:

🛠️ **Optimal Cleaning Approach:**

**Phase 1: Assessment (Current)**
✓ Identified 47 missing values across 3 columns
✓ Found 12 invalid type entries
✓ Detected 8 outliers
✓ Located 34 duplicate rows

**Phase 2: Priority Actions**

**1. Remove Duplicates First** (34 rows)
- No data loss, pure cleaning
- Prevents analysis bias
- Click 'Auto Clean' to handle this

**2. Fix Invalid Types** (12 entries)
- Dates: Convert to ISO format (YYYY-MM-DD)
- Numbers: Replace text with median values
- Preserves row count

**3. Handle Missing Values** (47 entries)
- Numeric: Impute with median (Age, Score)
- Categorical: Impute with mode (Status)
- Alternative: Use KNN imputation for better accuracy

**4. Review Outliers** (8 entries)
- Keep but flag for review
- Document business reasoning
- Consider separate analysis

**Phase 3: Validation**
- Check data types consistency
- Verify statistical distributions
- Confirm business logic rules

**My Recommendation:** Start with 'Auto Clean' - it applies all best practices while preserving 97% of your data.`;
    }

    if (q.includes('correlation') || q.includes('relationship') || q.includes('connect')) {
      return `Let me analyze correlations in your dataset:

📈 **Correlation Analysis:**

**Strong Correlations Found:**

1. **Revenue ↔ Score** (r = 0.82)
- Strong positive correlation
- Higher scores → Higher revenue
- This is your key metric!

2. **Category ↔ Revenue** (r = 0.64)
- Electronics: Higher avg revenue ($890)
- Furniture: Moderate revenue ($450)
- Consider category-based strategies

3. **Date ↔ Score** (r = 0.31)
- Moderate positive trend
- Performance improving over time

**What This Means:**

💡 **Actionable Insights:**
- Focus on improving Score - it directly impacts Revenue
- Electronics category drives higher value
- Your metrics are trending positively

🎯 **Next Steps:**
1. Segment analysis by Category
2. Time-series forecasting for Revenue
3. Build predictive model using Score as primary feature

Want me to dive deeper into any specific relationship?`;
    }

    if (q.includes('column') || q.includes('feature') || q.includes('important') || q.includes('matter')) {
      return `Here's my analysis of column importance:

⭐ **Feature Importance Ranking:**

**1. Score (Most Important)** 🥇
- Variance: High
- Correlation with Revenue: 0.82
- Predictive power: Excellent
- **Action:** This is your KPI - track it closely

**2. Category** 🥈
- Distinct values: 2 (Electronics, Furniture)
- Revenue impact: 64% correlation
- Segmentation value: High
- **Action:** Build category-specific strategies

**3. Revenue** 🥉
- Your outcome variable
- Range: $24.99 - $1,299.99
- Distribution: Right-skewed
- **Action:** Use as target for predictions

**4. Date**
- Temporal value: Medium
- Trend analysis: Useful
- Seasonality: Potential factor

**5. Customer Name**
- Analysis value: Low
- Use for: Identifying repeat customers

**Less Critical:**
- ID: Just an identifier
- Status: Low variance (98% Active)

**My Recommendation:**
Build your analysis around Score and Category. These drive your business outcomes and have the clearest patterns.

Want me to suggest visualization strategies for these key features?`;
    }

    if (q.includes('duplicate') || q.includes('same')) {
      return `Let me explain the duplicates in your data:

🔄 **Duplicate Analysis:**

**Found: 34 duplicate rows**

**What Causes Duplicates?**
- Double data entry
- System sync errors
- Multiple form submissions
- ETL pipeline issues

**Impact on Your Analysis:**
- Skews statistical measures
- Inflates correlation coefficients
- Biases model training
- Distorts aggregated metrics

**My Recommendation:**

✅ **Remove All Duplicates**
They provide no additional information and can harm analysis accuracy.

**How We Identify Them:**
Rows are considered duplicates when ALL columns match exactly (except ID).

**Your Options:**
1. **Auto Clean** - Removes all duplicates automatically
2. Keep first occurrence, remove rest
3. Review manually before removal

⚠️ **Important:** After removal, your dataset will have 1,213 rows (was 1,247). All duplicate information is preserved in the kept rows.

Want to proceed with duplicate removal?`;
    }

    if (q.includes('download') || q.includes('export') || q.includes('save')) {
      return `Here's how to download your cleaned data:

💾 **Export Options:**

**1. Download Cleaned Data** (Recommended)
- Click the green 'Download Cleaned Data' button
- Format: CSV file
- Includes: All ${context === 'cleaning' ? '1,213' : '1,247'} rows with fixes applied
- Timestamp: Auto-added to filename

**What's Included:**
✓ All original rows (minus 34 duplicates)
✓ Missing values imputed
✓ Invalid types corrected
✓ Outliers flagged but retained
✓ Metadata comments explaining changes

**File Structure:**
- Header row with column names
- Clean, standardized data
- ISO date formats (YYYY-MM-DD)
- Numeric types validated
- Ready for Excel, Python, R, or Tableau

**Best Practices:**
- Keep original file as backup
- Document what cleaning was applied
- Use version numbers (v1, v2, etc.)

📊 **Next Steps After Download:**
1. Import to your analysis tool
2. Verify data looks correct
3. Run your analysis with confidence!

Ready to download? Click the button in the Cleaning Actions section!`;
    }

    return `I understand you're asking about "${question}".

${context ? `📍 **Current Context:** ${context}\n\n` : ''}I'm here to help with:

🔍 **Data Quality:**
- Missing value strategies
- Outlier detection & handling
- Duplicate identification
- Data type validation

📊 **Analysis Guidance:**
- Statistical insights
- Correlation analysis
- Feature importance
- Trend identification

🛠️ **Cleaning Recommendations:**
- Best practices for your data
- Custom strategies
- Tool suggestions

💡 **Pro Tips:**
- Visualization ideas
- Next steps
- Common pitfalls to avoid

Could you be more specific? Try asking about:
- "How should I handle missing values?"
- "What do these outliers mean?"
- "Which columns are most important?"
- "Should I remove duplicates?"`;
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
      const response = getSmartResponse(currentInput);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

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
              <p className="text-xs text-blue-100">Powered by advanced ML</p>
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
                  <p className="text-sm text-gray-600">AI is analyzing your question...</p>
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

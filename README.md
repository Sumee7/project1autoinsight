# AutoInsight 📊

**An intelligent data cleaning and analysis platform powered by AI**

AutoInsight helps you analyze, clean, and visualize CSV datasets with the assistance of an AI Data Analyst that answers questions about your data in natural language.

## Short Description

AutoInsight is a web-based data analysis tool that automatically detects data quality issues like missing values, duplicates, invalid types, and outliers. It features an intelligent AI assistant that can explain your data, answer questions, and provide cleaning recommendations—all through natural conversation.

## Features

### 🤖 AI Data Analyst
- **Natural Language Understanding**: Ask questions like "How many rows do I have?" or "Show me the list of missing values"
- **Smart Analysis**: Get instant insights about data quality, column statistics, and recommendations
- **Interactive Chat**: Chat with your data to understand patterns, issues, and cleaning strategies
- **Context-Aware**: The AI understands your specific dataset and provides tailored answers

### 🧹 Intelligent Data Cleaning
- **Auto Clean**: One-click automatic cleaning of all detected issues
- **Missing Values**: Detect and impute missing values using statistical methods
- **Invalid Types**: Fix type inconsistencies in dates, numbers, and strings
- **Duplicates**: Identify and remove duplicate rows
- **Outliers**: Detect statistical outliers with detailed analysis

### 📊 Data Quality Assessment
- **Quality Score**: Get an overall data quality percentage
- **Issue Breakdown**: See detailed reports on missing values, invalid types, and duplicates
- **Column Analysis**: View statistics for each column including type, missing count, and outliers
- **Visual Dashboard**: Clean, modern interface showing all data metrics

### 📈 Visualization & Insights
- Statistical analysis of numeric columns
- Data distribution charts
- Export cleaned data as CSV
- Professional reporting

## How It Works

1. **Upload**: Drop your CSV file or use the sample dataset
2. **Analyze**: AutoInsight scans your data for quality issues
3. **Ask Questions**: Chat with the AI about your data
4. **Clean**: Use auto-clean or selective cleaning options
5. **Export**: Download your cleaned dataset

## AI Assistant Capabilities

The AI Data Analyst can answer questions like:

### Data Overview
- "Explain this CSV file"
- "How many rows do I have?"
- "Show me all columns"

### Quality Analysis
- "Is my data dirty?"
- "What's the quality score?"
- "List all issues"

### Specific Queries
- "Show me the list of missing values"
- "Tell me about the Score column"
- "How many duplicates are there?"

### Recommendations
- "What should I do?"
- "How do I clean this data?"
- "What do you recommend?"

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (ready for persistence)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd project1autoinsight

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Type Checking

```bash
npm run typecheck
```

## Project Structure

```
src/
├── components/
│   ├── AIAssistant.tsx       # Intelligent AI chat interface
│   ├── CleaningScreen.tsx    # Data cleaning dashboard
│   ├── UploadScreen.tsx      # File upload interface
│   ├── VisualizationScreen.tsx
│   └── SummaryScreen.tsx
├── utils/
│   └── mockData.ts           # Sample data generator
├── types.ts                  # TypeScript interfaces
├── App.tsx                   # Main application
└── main.tsx                  # Entry point
```

## Data Quality Metrics

AutoInsight analyzes your data across multiple dimensions:

- **Missing Values**: Percentage and count of null/empty values per column
- **Invalid Types**: Entries that don't match expected data types
- **Duplicates**: Exact row duplicates across all columns
- **Outliers**: Statistical outliers using IQR method (1.5×IQR)
- **Quality Score**: Overall score from 0-100% based on issue density

## Cleaning Methodology

### Auto Clean Process
1. **Remove Duplicates**: Keeps first occurrence of duplicate rows
2. **Fix Invalid Types**: Converts to proper formats (ISO dates, valid numbers)
3. **Impute Missing Values**:
   - Numeric columns: Median imputation
   - Categorical columns: Mode imputation
   - Dates: Forward fill or interpolation
4. **Flag Outliers**: Retained but marked for review

### Manual Options
- Clean missing values only
- Fix invalid types only
- Custom column-by-column cleaning

## Use Cases

- **Data Scientists**: Quick data profiling and cleaning before analysis
- **Analysts**: Interactive data quality assessment
- **Students**: Learn about data cleaning best practices
- **Researchers**: Prepare datasets for statistical analysis
- **Business Users**: No-code data cleaning with AI guidance

## Future Enhancements

- [ ] Real-time CSV parsing and preview
- [ ] Advanced visualization charts
- [ ] Machine learning-based imputation
- [ ] Export to multiple formats (JSON, Excel)
- [ ] Scheduled data quality monitoring
- [ ] Custom cleaning rule builder
- [ ] Integration with cloud storage (S3, Google Drive)
- [ ] Team collaboration features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ for better data quality**

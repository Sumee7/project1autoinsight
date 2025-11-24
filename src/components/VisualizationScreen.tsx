import { useState } from 'react';
import { LineChart, BarChart3, ScatterChart, TrendingUp, Lightbulb } from 'lucide-react';
import { ChartType, Statistics } from '../types';
import AIAssistant from './AIAssistant';

interface VisualizationScreenProps {
  statistics: Statistics;
  onNext: () => void;
}

export default function VisualizationScreen({ statistics, onNext }: VisualizationScreenProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const chartTabs: { type: ChartType; icon: any; label: string }[] = [
    { type: 'line', icon: LineChart, label: 'Line Chart' },
    { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
    { type: 'scatter', icon: ScatterChart, label: 'Scatter Plot' },
  ];

  const categoryData = [
    { category: 'Electronics', count: 142 },
    { category: 'Clothing', count: 98 },
    { category: 'Home & Garden', count: 87 },
    { category: 'Sports', count: 65 },
    { category: 'Books', count: 54 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Visualization</h1>
            <p className="text-gray-600">Explore your data through interactive charts</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <div className="flex gap-1 p-2">
                {chartTabs.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setActiveChart(type)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      activeChart === type
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 h-96 flex items-center justify-center">
                {activeChart === 'line' && (
                  <div className="relative w-full h-full p-6">
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3A7AFE" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3A7AFE" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polyline
                        fill="url(#lineGradient)"
                        stroke="none"
                        points="0,250 100,200 200,180 300,160 400,140 500,100 600,80 700,60 800,40 800,300 0,300"
                      />
                      <polyline
                        fill="none"
                        stroke="#3A7AFE"
                        strokeWidth="3"
                        points="0,250 100,200 200,180 300,160 400,140 500,100 600,80 700,60 800,40"
                      />
                      {[0, 100, 200, 300, 400, 500, 600, 700, 800].map((x, i) => {
                        const y = [250, 200, 180, 160, 140, 100, 80, 60, 40][i];
                        return (
                          <circle key={i} cx={x} cy={y} r="5" fill="#3A7AFE" />
                        );
                      })}
                    </svg>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-xs text-gray-600">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                    </div>
                  </div>
                )}
                {activeChart === 'bar' && (
                  <div className="relative w-full h-full p-6">
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                        const height = [180, 220, 160, 200, 240, 190, 210, 230][i];
                        const x = i * 100 + 20;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={280 - height}
                            width="60"
                            height={height}
                            fill="#3A7AFE"
                            rx="4"
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
                {activeChart === 'scatter' && (
                  <div className="relative w-full h-full p-6">
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      {Array.from({ length: 50 }, () => ({
                        x: Math.random() * 800,
                        y: Math.random() * 300,
                        r: Math.random() * 8 + 3,
                      })).map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r={point.r}
                          fill="#3A7AFE"
                          opacity="0.6"
                        />
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Summary Statistics</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Mean', value: statistics.mean },
                  { label: 'Median', value: statistics.median },
                  { label: 'Min', value: statistics.min },
                  { label: 'Max', value: statistics.max },
                  { label: 'Std Dev', value: statistics.stdDev },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {value?.toFixed(2) ?? 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Category Frequency</h2>
              </div>
              <div className="space-y-2">
                {categoryData.map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.category}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(item.count / 142) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Insights</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Column <strong>Score</strong> shows an increasing trend over time with a steady growth pattern.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Electronics</strong> category has the highest frequency at 142 occurrences.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Data distribution shows minimal outliers, indicating consistent data quality.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              View Summary
            </button>
          </div>
        </div>
      </div>

      <AIAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        context="data visualization"
      />
    </div>
  );
}
